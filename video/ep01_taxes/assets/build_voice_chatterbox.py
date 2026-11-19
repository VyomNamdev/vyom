#!/usr/bin/env python3
"""Sam's voice with Chatterbox-Turbo: one generation per tagged phrase (voice_plan.json), several takes each,
each take checked against the script with Whisper, the best kept, then joined with the planned pauses.

Run with the Chatterbox venv:  /home/user/tts/cbx/bin/python assets/build_voice_chatterbox.py
Writes audio/voice.wav (24 kHz) and audio/voice_segments.json (every line's and segment's start/end in seconds).
"""
import difflib
import json
import re
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

HERE = Path(__file__).resolve().parent
OUT = HERE / "audio"
OUT.mkdir(exist_ok=True)
TAKES_DIR = OUT / "takes"
TAKES_DIR.mkdir(exist_ok=True)
LEAD = 0.6  # silence before the first word

TAG = re.compile(r"\[[^\]]+\]\s*")


def clean(text):
    return TAG.sub("", text).strip()


def letters(text):
    t = re.sub(r"[^a-z ]+", " ", text.lower())
    return re.sub(r"\s+", " ", t).strip()


def trim(a, sr, thresh=0.012):
    idx = np.where(np.abs(a) > thresh)[0]
    if len(idx) == 0:
        return a
    s = max(0, idx[0] - int(0.03 * sr))
    e = min(len(a), idx[-1] + int(0.08 * sr))
    out = a[s:e].copy()
    f = int(0.01 * sr)
    out[:f] *= np.linspace(0, 1, f)
    out[-f:] *= np.linspace(1, 0, f)
    return out


def main():
    from chatterbox.tts_turbo import ChatterboxTurboTTS
    from faster_whisper import WhisperModel

    plan = json.loads((HERE / "voice_plan.json").read_text())
    import os
    torch.set_num_threads(os.cpu_count() or 4)
    tts = ChatterboxTurboTTS.from_pretrained(device="cpu")
    sr = tts.sr
    asr = WhisperModel("base.en", device="cpu", compute_type="int8")

    pieces = [np.zeros(int(LEAD * sr), dtype=np.float32)]
    t = LEAD
    timeline = []
    report = []
    for line in plan["lines"]:
        segs = []
        line_start = t
        for si, seg in enumerate(line["segments"]):
            want = clean(seg["say"])
            expect_s = max(0.8, len(want) / 14.5)
            best = None
            def judge(a, path, take):
                got = " ".join(x.text for x in asr.transcribe(str(path), language="en", beam_size=1)[0])
                score = difflib.SequenceMatcher(None, letters(want), letters(got)).ratio()
                dur = len(a) / sr
                ratio = dur / expect_s
                if ratio > 1.9 or ratio < 0.45:
                    score -= 0.3
                return (score, take, a, got, dur)
            # reuse takes already made in an earlier run
            for take in range(4):
                path = TAKES_DIR / f"{line['id']}_{si}_{take}.wav"
                if path.exists():
                    a, _ = sf.read(path, dtype="float32")
                    cand = judge(a, path, take)
                    if best is None or cand[0] > best[0]:
                        best = cand
            take = 0
            while best is None or (best[0] < 0.7 and take < 2):
                while (TAKES_DIR / f"{line['id']}_{si}_{take}.wav").exists():
                    take += 1
                torch.manual_seed(1000 + take * 7 + si * 31 + len(want))
                t0 = time.time()
                wav = tts.generate(seg["say"], temperature=0.8 if take < 2 else 0.7)
                a = trim(wav.squeeze().numpy().astype(np.float32), sr)
                path = TAKES_DIR / f"{line['id']}_{si}_{take}.wav"
                sf.write(path, a, sr)
                cand = judge(a, path, take)
                if best is None or cand[0] > best[0]:
                    best = cand
                print(f"  {line['id']:<10} seg{si} take{take}: {cand[4]:4.1f}s score {cand[0]:.2f} ({time.time() - t0:.0f}s)  heard: {cand[3].strip()[:70]}", flush=True)
                take += 1
            score, take, a, got, dur = best
            a = a * (10 ** (seg.get("gain_db", 0) / 20))
            segs.append({"text": want, "start": round(t, 3), "end": round(t + dur, 3)})
            report.append({"line": line["id"], "seg": si, "take": take, "score": round(score, 2), "heard": got.strip()})
            pieces += [a.astype(np.float32), np.zeros(int(seg["pause"] * sr), dtype=np.float32)]
            t += dur + seg["pause"]
        timeline.append({
            "id": line["id"],
            "text": " ".join(s["text"] for s in segs),
            "start": round(line_start, 3),
            "end": segs[-1]["end"],
            "segments": segs,
        })
    voice = np.concatenate(pieces)
    peak = np.max(np.abs(voice))
    voice = voice / peak * 0.9
    sf.write(OUT / "voice.wav", voice, sr)
    (OUT / "voice_segments.json").write_text(json.dumps({"sr": sr, "lead": LEAD, "lines": timeline, "takes": report}, indent=1))
    low = [r for r in report if r["score"] < 0.8]
    print(f"voice.wav {len(voice) / sr:.1f}s, {sum(len(l['segments']) for l in timeline)} segments; {len(low)} below 0.80: {low}")


if __name__ == "__main__":
    sys.exit(main())
