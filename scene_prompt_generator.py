#!/usr/bin/env python3
"""
scene_prompt_generator.py — Fine Print Money visual consistency engine.

Reads `character_bible.json` and a scene specification, then outputs:
  1. A strict, copy-pasteable image-generation prompt (+ negative prompt)
  2. A consistency checklist for reviewing the generated image
  3. (Optional) calls an image-generation API configured via environment variables

Pure standard library — no pip installs required.

Usage examples
--------------
  # Show characters, expressions, settings, framings, accents
  python scene_prompt_generator.py --list

  # Print a starter scene-spec JSON you can copy and edit
  python scene_prompt_generator.py --template > scenes/my_scene.json

  # Build prompt + checklist from a scene file (single scene or {"scenes": [...]})
  python scene_prompt_generator.py scenes/my_scene.json

  # Save the output as markdown
  python scene_prompt_generator.py scenes/my_scene.json --out output/my_scene.md

  # Quick one-off scene straight from the command line
  python scene_prompt_generator.py \
      --setting general_store --framing medium \
      --char "sam:smug_confident:sliding coins across the counter" \
      --char "mr_hale_shopkeeper:surprised:leaning over the register" \
      --action "Sam buys his first ten candy bars wholesale to resell" \
      --prop "brass cash register" --prop "glass candy jars" \
      --text "chalkboard sign=CANDY 1¢" --accent profit_green_arrow

  # Optional: actually generate via an API (see env vars in ImageAPIClient)
  python scene_prompt_generator.py scenes/my_scene.json --generate \
      --reference refs/sam_turnaround.png --reference refs/style_still.png
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

DEFAULT_BIBLE = Path(__file__).resolve().parent / "character_bible.json"

TEMPLATE_SPEC: dict[str, Any] = {
    "scenes": [
        {
            "id": "ep01_s03",
            "title": "Sam shows his sister the stock certificate",
            "layout": "single",
            "setting": "family_living_room",
            "setting_details": "evening, the table lamp is the main light source",
            "framing": "medium",
            "characters": [
                {
                    "id": "sam",
                    "expression": "smug_confident",
                    "pose": "standing on the left, arm extended, holding a stock certificate out toward his sister",
                },
                {
                    "id": "lena",
                    "expression": "annoyed_skeptical",
                    "pose": "standing on the right, arms crossed tightly",
                },
            ],
            "action": "Sam proudly presents his first stock certificate; his sister is not impressed.",
            "props": ["ornate cream stock certificate with a decorative brown border"],
            "text_elements": [{"location": "top of the certificate", "text": "STOCK"}],
            "accent": "none",
            "notes": "",
        }
    ]
}


# --------------------------------------------------------------------------- #
# Bible loading & validation
# --------------------------------------------------------------------------- #
class SpecError(ValueError):
    """Raised when a scene spec references something the bible doesn't define."""


def load_bible(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as fh:
        bible = json.load(fh)
    for key in ("global_art_style", "characters"):
        if key not in bible:
            raise SpecError(f"character bible is missing required key '{key}'")
    return bible


def _resolve(lookup: dict[str, str], value: str | None, kind: str, allow_free_text: bool = True) -> str:
    """Return a library entry if `value` is a known key, else the raw text (if allowed)."""
    if not value:
        return ""
    if value in lookup:
        return lookup[value]
    if allow_free_text and (" " in value or len(value) > 25):
        return value  # treat as a free-text description
    raise SpecError(
        f"unknown {kind} '{value}'. Use one of: {', '.join(sorted(lookup))} "
        f"(or write a full free-text description)."
    )


# --------------------------------------------------------------------------- #
# Prompt building
# --------------------------------------------------------------------------- #
@dataclass
class BuiltScene:
    scene_id: str
    title: str
    prompt: str
    negative_prompt: str
    checklist: list[str]
    reference_reminder: str
    width: int = 1920
    height: int = 1080
    meta: dict[str, Any] = field(default_factory=dict)


class PromptBuilder:
    def __init__(self, bible: dict[str, Any]):
        self.bible = bible
        self.style = bible["global_art_style"]
        self.characters = bible["characters"]
        self.settings = bible.get("settings_library", {})
        self.accents = bible.get("accent_presets", {})
        self.framings = self.style.get("framing_and_output", {}).get("camera_framings", {})

    # ---- character ------------------------------------------------------- #
    def character_block(self, entry: dict[str, Any]) -> tuple[str, dict[str, Any], str]:
        cid = entry.get("id")
        if cid not in self.characters:
            raise SpecError(f"unknown character '{cid}'. Available: {', '.join(self.characters)}")
        c = self.characters[cid]
        expr_key = entry.get("expression") or next(iter(c["allowed_expressions"]))
        if expr_key not in c["allowed_expressions"]:
            raise SpecError(
                f"expression '{expr_key}' is not allowed for {cid}. "
                f"Allowed: {', '.join(c['allowed_expressions'])}"
            )
        expr = c["allowed_expressions"][expr_key]
        props = entry.get("props") or []
        pose = entry.get("pose", "standing naturally, facing camera")
        block = (
            f"{c['display_name'].upper()} — {pose}. "
            f"HEAD: {c['head_shape']} FACE: {c['face_style']} "
            f"EXPRESSION ({expr_key.replace('_', ' ')}): {expr} "
            f"HAIR/HAT: {c['hair_or_hat']} OUTFIT: {c['torso_outfit']} "
            f"LIMBS: {c['limb_style']} HANDS & FEET: {c['hands_and_feet']} "
            f"ALWAYS-ON PROPS: {self._always_props(c)}"
        )
        if props:
            block += f" HOLDING/USING: {', '.join(props)}."
        if entry.get("outfit_note"):
            block += f" SCENE NOTE (outfit stays locked): {entry['outfit_note']}."
        if c.get("do_not"):
            block += f" DO NOT: {'; '.join(c['do_not'])}."
        return block, c, expr_key

    @staticmethod
    def _always_props(c: dict[str, Any]) -> str:
        always = [p for p in c.get("signature_props", []) if "ALWAYS" in p.upper()]
        return "; ".join(always) if always else "none required"

    # ---- panel / scene --------------------------------------------------- #
    def panel_text(self, panel: dict[str, Any], label: str | None = None) -> tuple[str, list[tuple]]:
        setting = _resolve(self.settings, panel.get("setting"), "setting")
        if panel.get("setting_details"):
            setting = f"{setting} {panel['setting_details']}".strip()
        chars = [self.character_block(e) for e in panel.get("characters", [])]
        accent = _resolve(self.accents, panel.get("accent", "none"), "accent")
        props = panel.get("props", [])
        texts = panel.get("text_elements", [])

        parts = []
        if label:
            parts.append(f"[{label}]")
        if panel.get("action"):
            parts.append(f"ACTION/STORY BEAT: {panel['action']}")
        if setting:
            parts.append(f"SETTING: {setting}")
        if chars:
            parts.append(
                f"CHARACTERS ({len(chars)} named character(s), no other foreground characters):\n"
                + "\n".join(f"  - {b}" for b, _, _ in chars)
            )
        if panel.get("background_extras"):
            parts.append(
                "BACKGROUND EXTRAS (same stick-limb + cream-head anatomy, muted colors, simpler faces): "
                + panel["background_extras"]
            )
        if props:
            parts.append("KEY PROPS (clean bold ink outlines): " + "; ".join(props))
        if texts:
            parts.append(
                "EXACT READABLE TEXT (spell exactly, clean lettering, nothing else readable): "
                + "; ".join(f'"{t["text"]}" on {t["location"]}' for t in texts)
            )
        if accent:
            parts.append(f"ACCENT COLOR (the only high-contrast color): {accent}")
        return "\n".join(parts), chars

    def build(self, spec: dict[str, Any]) -> BuiltScene:
        s = self.style
        layout = spec.get("layout", "single")
        framing_key = spec.get("framing", "split_screen" if layout == "split_screen" else "medium")
        framing = _resolve(self.framings, framing_key, "framing")

        if layout == "split_screen":
            panels = spec.get("panels") or []
            if len(panels) != 2:
                raise SpecError("split_screen layout needs exactly 2 entries in 'panels'")
            body_parts, all_chars = [], []
            for side, p in zip(("LEFT PANEL", "RIGHT PANEL"), panels):
                text, chars = self.panel_text(p, f"{side}: {p.get('label', '')}".strip(": "))
                body_parts.append(text)
                all_chars += chars
            body = (
                "Two equal vertical panels separated by a clean thick black divider line; "
                "both panels share the same ink style and character anatomy.\n\n" + "\n\n".join(body_parts)
            )
        else:
            body, all_chars = self.panel_text(spec)

        style_header = (
            "STYLE LOCK — match the attached reference image(s) exactly. "
            f"{s['style_summary']} "
            f"Characters: {s['line_work']['character_outline']} {s['line_work']['stick_limbs']} "
            f"Proportions: {s['character_anatomy_rules']['proportions']} "
            f"Faces: {s['facial_expression_rules']['eyes']} {s['facial_expression_rules']['eyebrows']} "
            f"{s['facial_expression_rules']['mouth']} "
            f"Backgrounds: {s['line_work']['background_lines']} " + " ".join(s["shading_rules"])
        )
        palette = s["color_palette"]
        palette_line = (
            "PALETTE: warm earthy vintage — "
            + ", ".join(f"{k.replace('_', ' ')} {v}" for k, v in palette["base_tones"].items())
            + ". " + " ".join(palette["palette_rules"])
        )
        out = s["framing_and_output"]
        framing_line = (
            f"CAMERA/FRAMING: {framing_key.replace('_', ' ')} — {framing} "
            f"{out['aspect_ratio']} widescreen, {out['recommended_resolution']}. {out['composition']} "
            "Leave 10-15% safe margin around the action for zoom/pan."
        )
        extra = f"\nEXTRA NOTES: {spec['notes']}" if spec.get("notes") else ""

        prompt = "\n\n".join(
            [
                style_header,
                body + extra,
                palette_line,
                framing_line,
                "FINAL OUTPUT: a single clean 16:9 illustration frame. No UI, no player bars, "
                "no inset thumbnails, no watermark, no captions.",
            ]
        )
        negative = ", ".join(s["negative_prompt"])
        checklist = self.checklist(spec, all_chars, layout)
        names = sorted({c["display_name"] for _, c, _ in all_chars})
        hero = self.characters.get("sam", {}).get("display_name")
        others = [n for n in names if n != hero]
        reminder = (
            "ATTACH REFERENCE IMAGES BEFORE GENERATING: (1) the approved Sam turnaround/reference sheet, "
            f"(2) one approved scene still in the house style"
            + (f", (3) reference sheets for: {', '.join(others)}" if others else "")
            + ". Set reference/style strength high (e.g. 0.7-0.85) so the model locks onto the look."
        )
        return BuiltScene(
            scene_id=spec.get("id", "scene"),
            title=spec.get("title", ""),
            prompt=prompt,
            negative_prompt=negative,
            checklist=checklist,
            reference_reminder=reminder,
            meta={"layout": layout, "framing": framing_key, "characters": names},
        )

    # ---- checklist ------------------------------------------------------- #
    def checklist(self, spec: dict[str, Any], chars: list[tuple], layout: str) -> list[str]:
        items = [
            "Every character's head is a flat cream-white rounded oval with a bold black outline — no shading, no nose, no ears.",
            "Arms and legs are single thick black stick lines (no flesh, no muscles, no elbows/knees).",
            "Hands are rounded mitten/glove shapes; feet are simple dark bean shoes.",
            "Faces use only dot eyes, thick eyebrows and a single-line mouth.",
            "Character lines are visibly bolder than the thinner sepia background linework.",
            "Background is richly detailed, warm, vintage 2D illustration with subtle crosshatching — not flat, not 3D, not photo.",
            "Palette stays warm/earthy (tan, cream, wood brown, muted olive); only ONE high-contrast accent color.",
            "16:9 frame with safe margins; nothing important touches the edges.",
            "No YouTube UI, player bars, corner thumbnail inset, watermark, logo or captions.",
            "No extra foreground characters beyond those specified.",
        ]
        for _, c, expr in chars:
            name = c["display_name"]
            locks = c.get("color_lock", {})
            items.append(f"{name}: expression reads clearly as '{expr.replace('_', ' ')}'.")
            items.append(f"{name}: hair/hat matches — {c['hair_or_hat'].split('.')[0]}.")
            items.append(f"{name}: outfit matches — {c['torso_outfit'].split('.')[0]}.")
            if locks:
                flat = ", ".join(f"{k} {v}" for k, v in locks.items() if isinstance(v, str))
                if flat:
                    items.append(f"{name}: locked colors approximately {flat}.")
            for p in c.get("signature_props", []):
                if "ALWAYS" in p.upper():
                    items.append(f"{name}: always-on prop present — {p}.")
        panels = spec.get("panels", []) if layout == "split_screen" else [spec]
        for p in panels:
            for t in p.get("text_elements", []):
                items.append(f'Text "{t["text"]}" on {t["location"]} is spelled exactly and legible.')
            for prop in p.get("props", []):
                items.append(f"Prop present and clearly outlined: {prop}.")
        if layout == "split_screen":
            items.append("Two equal panels with a clean thick black divider; both panels share identical character anatomy.")
        return list(dict.fromkeys(items))  # de-duplicate, keep order


# --------------------------------------------------------------------------- #
# Output formatting
# --------------------------------------------------------------------------- #
def to_markdown(b: BuiltScene) -> str:
    check = "\n".join(f"- [ ] {i}" for i in b.checklist)
    return (
        f"## {b.scene_id} — {b.title}\n\n"
        f"> **{b.reference_reminder}**\n\n"
        f"### Image Generation Prompt\n```text\n{b.prompt}\n```\n\n"
        f"### Negative Prompt\n```text\n{b.negative_prompt}\n```\n\n"
        f"### Consistency Checklist\n{check}\n"
    )


def to_text(b: BuiltScene) -> str:
    bar = "=" * 78
    check = "\n".join(f"[ ] {i}" for i in b.checklist)
    return (
        f"{bar}\nSCENE {b.scene_id}: {b.title}\n{bar}\n"
        f"!! {b.reference_reminder}\n\n"
        f"--- IMAGE PROMPT (copy everything below) ---\n{b.prompt}\n\n"
        f"--- NEGATIVE PROMPT ---\n{b.negative_prompt}\n\n"
        f"--- CONSISTENCY CHECKLIST ---\n{check}\n"
    )


# --------------------------------------------------------------------------- #
# Optional API client (no secrets in code — everything from os.environ)
# --------------------------------------------------------------------------- #
class ImageAPIClient:
    """
    Environment variables:
      IMAGE_API_PROVIDER  "openai" (OpenAI-compatible images API) or "generic" (default: generic)
      IMAGE_API_KEY       your secret key (never hardcode it)
      IMAGE_API_URL       base URL. openai default: https://api.openai.com/v1
                          generic: full endpoint URL that accepts a JSON POST
      IMAGE_API_MODEL     model name (e.g. gpt-image-1) — optional for generic
      IMAGE_API_SIZE      e.g. 1536x1024 (openai) — default 1536x1024

    Generic provider JSON body:
      {"prompt", "negative_prompt", "width", "height", "model",
       "reference_images": [{"filename", "mime_type", "data_base64"}]}
    and expects a response with "image_base64" or "url" (or OpenAI-style data[0]).
    """

    def __init__(self) -> None:
        self.provider = os.environ.get("IMAGE_API_PROVIDER", "generic").lower()
        self.key = os.environ.get("IMAGE_API_KEY")
        self.model = os.environ.get("IMAGE_API_MODEL", "")
        self.size = os.environ.get("IMAGE_API_SIZE", "1536x1024")
        default_url = "https://api.openai.com/v1" if self.provider == "openai" else ""
        self.url = os.environ.get("IMAGE_API_URL", default_url).rstrip("/")
        if not self.key:
            raise SystemExit("IMAGE_API_KEY is not set. Export it in your shell; never put it in code.")
        if not self.url:
            raise SystemExit("IMAGE_API_URL is not set for the generic provider.")

    def generate(self, scene: BuiltScene, references: list[Path], out_dir: Path) -> Path:
        out_dir.mkdir(parents=True, exist_ok=True)
        full_prompt = f"{scene.prompt}\n\nAVOID: {scene.negative_prompt}"
        if self.provider == "openai":
            payload = self._openai(full_prompt, references)
        else:
            payload = self._generic(scene, references)
        return self._save(payload, out_dir / f"{scene.scene_id}.png")

    # -- providers --
    def _openai(self, prompt: str, refs: list[Path]) -> dict[str, Any]:
        headers = {"Authorization": f"Bearer {self.key}"}
        model = self.model or "gpt-image-1"
        if refs:  # reference-image edit endpoint (multipart)
            fields = {"model": model, "prompt": prompt, "size": self.size, "n": "1"}
            files = [("image[]", r) for r in refs]
            body, ctype = _multipart(fields, files)
            headers["Content-Type"] = ctype
            return _post(f"{self.url}/images/edits", body, headers)
        headers["Content-Type"] = "application/json"
        body = json.dumps({"model": model, "prompt": prompt, "size": self.size, "n": 1}).encode()
        return _post(f"{self.url}/images/generations", body, headers)

    def _generic(self, scene: BuiltScene, refs: list[Path]) -> dict[str, Any]:
        body = {
            "prompt": scene.prompt,
            "negative_prompt": scene.negative_prompt,
            "width": scene.width,
            "height": scene.height,
            "model": self.model or None,
            "reference_images": [
                {
                    "filename": r.name,
                    "mime_type": mimetypes.guess_type(r.name)[0] or "image/png",
                    "data_base64": base64.b64encode(r.read_bytes()).decode(),
                }
                for r in refs
            ],
        }
        headers = {"Authorization": f"Bearer {self.key}", "Content-Type": "application/json"}
        return _post(self.url, json.dumps(body).encode(), headers)

    @staticmethod
    def _save(payload: dict[str, Any], dest: Path) -> Path:
        item = payload.get("data", [payload])[0] if isinstance(payload.get("data"), list) else payload
        b64 = item.get("b64_json") or item.get("image_base64")
        if b64:
            dest.write_bytes(base64.b64decode(b64))
            return dest
        if item.get("url"):
            with urllib.request.urlopen(item["url"], timeout=120) as r:  # noqa: S310 (provider URL)
                dest.write_bytes(r.read())
            return dest
        raise RuntimeError(f"Unrecognised API response keys: {list(payload)}")


def _post(url: str, body: bytes, headers: dict[str, str]) -> dict[str, Any]:
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=300) as r:  # noqa: S310 (user-configured URL)
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"API error {e.code}: {e.read().decode(errors='replace')[:500]}") from e


def _multipart(fields: dict[str, str], files: list[tuple[str, Path]]) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    chunks: list[bytes] = []
    for k, v in fields.items():
        chunks += [f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode()]
    for name, path in files:
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        chunks += [
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; filename=\"{path.name}\"\r\n"
            f"Content-Type: {mime}\r\n\r\n".encode(),
            path.read_bytes(),
            b"\r\n",
        ]
    chunks.append(f"--{boundary}--\r\n".encode())
    return b"".join(chunks), f"multipart/form-data; boundary={boundary}"


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def print_library(bible: dict[str, Any]) -> None:
    print("CHARACTERS (id -> allowed expressions)")
    for cid, c in bible["characters"].items():
        print(f"  {cid:22s} {c['display_name']}")
        print(f"  {'':22s} expressions: {', '.join(c['allowed_expressions'])}")
    print("\nSETTINGS:", ", ".join(bible.get("settings_library", {})))
    print("FRAMINGS:", ", ".join(bible["global_art_style"]["framing_and_output"]["camera_framings"]))
    print("ACCENTS: ", ", ".join(bible.get("accent_presets", {})))
    print("\n(Any setting/accent can also be a full free-text description.)")


def spec_from_flags(a: argparse.Namespace) -> dict[str, Any]:
    chars = []
    for raw in a.char or []:
        cid, _, rest = raw.partition(":")
        expr, _, pose = rest.partition(":")
        entry: dict[str, Any] = {"id": cid.strip()}
        if expr.strip():
            entry["expression"] = expr.strip()
        if pose.strip():
            entry["pose"] = pose.strip()
        chars.append(entry)
    texts = []
    for raw in a.text or []:
        loc, sep, txt = raw.partition("=")
        texts.append({"location": loc.strip(), "text": txt.strip()} if sep else {"location": "a sign", "text": raw})
    return {
        "id": a.id,
        "title": a.title or a.action or "",
        "setting": a.setting,
        "framing": a.framing,
        "characters": chars,
        "action": a.action,
        "props": a.prop or [],
        "text_elements": texts,
        "accent": a.accent,
        "notes": a.notes or "",
    }


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        description="Build locked-style image prompts + consistency checklists from character_bible.json",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("spec", nargs="?", help="scene spec JSON file (single scene or {'scenes': [...]})")
    p.add_argument("--bible", default=str(DEFAULT_BIBLE), help="path to character_bible.json")
    p.add_argument("--list", action="store_true", help="list characters/expressions/settings/framings/accents")
    p.add_argument("--template", action="store_true", help="print an example scene spec JSON")
    p.add_argument("--format", choices=("text", "md", "json"), default="text")
    p.add_argument("--out", help="write output to this file instead of stdout")
    p.add_argument("--only", help="build only the scene with this id")

    q = p.add_argument_group("quick scene (no spec file)")
    q.add_argument("--id", default="quick_scene")
    q.add_argument("--title")
    q.add_argument("--setting", help="settings_library key or free text")
    q.add_argument("--framing", default="medium")
    q.add_argument("--char", action="append", help='"id:expression:pose" (repeatable)')
    q.add_argument("--action")
    q.add_argument("--prop", action="append", help="key prop (repeatable)")
    q.add_argument("--text", action="append", help='"location=EXACT TEXT" (repeatable)')
    q.add_argument("--accent", default="none")
    q.add_argument("--notes")

    g = p.add_argument_group("optional API generation")
    g.add_argument("--generate", action="store_true", help="call the image API (env vars required)")
    g.add_argument("--reference", action="append", default=[], help="reference image path (repeatable)")
    g.add_argument("--image-out", default="renders", help="folder for generated images")
    a = p.parse_args(argv)

    if a.template:
        print(json.dumps(TEMPLATE_SPEC, indent=2, ensure_ascii=False))
        return 0

    bible = load_bible(Path(a.bible))
    if a.list:
        print_library(bible)
        return 0

    if a.spec:
        raw = json.loads(Path(a.spec).read_text(encoding="utf-8"))
        specs = raw.get("scenes", [raw]) if isinstance(raw, dict) else raw
    elif a.char or a.setting or a.action:
        specs = [spec_from_flags(a)]
    else:
        p.print_help()
        return 1
    if a.only:
        specs = [s for s in specs if s.get("id") == a.only]

    builder = PromptBuilder(bible)
    try:
        built = [builder.build(s) for s in specs]
    except SpecError as e:
        print(f"Scene spec error: {e}", file=sys.stderr)
        return 2

    if a.format == "json":
        output = json.dumps([b.__dict__ for b in built], indent=2, ensure_ascii=False)
    elif a.format == "md":
        output = "\n---\n\n".join(to_markdown(b) for b in built)
    else:
        output = "\n".join(to_text(b) for b in built)

    if a.out:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        Path(a.out).write_text(output, encoding="utf-8")
        print(f"Wrote {len(built)} scene(s) to {a.out}")
    else:
        print(output)

    if a.generate:
        refs = [Path(r) for r in a.reference]
        missing = [str(r) for r in refs if not r.exists()]
        if missing:
            print(f"Reference image(s) not found: {', '.join(missing)}", file=sys.stderr)
            return 2
        if not refs:
            print("WARNING: no --reference images given; style drift is very likely.", file=sys.stderr)
        client = ImageAPIClient()
        for b in built:
            path = client.generate(b, refs, Path(a.image_out))
            print(f"Generated {b.scene_id} -> {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
