# EP01: How Taxes Actually Work (Explained Simply), Part 1 (demo)

A 2:06 landscape (1920×1080, 30 fps) animated explainer. Sam, in his late 20s, explains taxes to his 15–16-year-old
little brother. The viewer is the little brother. The episode ends on a cliffhanger: "What happens if you don't pay?"

## How it's made

| Step | Tool | Files |
|---|---|---|
| Script and hook | Faceless Channels Playbook v7: D3 hook rules, D4 scorecard (10/10), "Nobody-taught-you" hook | `script.json` |
| AI voiceover | Kokoro TTS v1.0 (Apache-2.0), voice `am_michael`, runs locally | `build_audio.py` |
| Lip sync | Per-frame voice loudness drives the mouth shape | `components/timeline.gen.ts` (generated) |
| SFX and music | Synthesized locally (click, tick, pop, whoosh, riser, ding, thud, coin, stamp; lo-fi bed; tension pulse) | `build_audio.py` |
| Animation and render | RAEA 0.1.8 (React/TypeScript compositions) | `compositions/ep01-taxes.tsx`, `components/*.tsx` |

## Rebuild

The RAEA project lives in `~/raea-studio/fine-print-money/projects/ep01-taxes`. This folder is a copy of its source.

```bash
python3 assets/build_audio.py          # voice, lip-sync data, SFX, music
```

```bash
raea render compositions/ep01-taxes.tsx -o out/ep01-taxes.mp4 --quality high
```

## Numbers on screen (sources)

See `script.json` → `sources`. Federal income tax uses the 2025 single-filer standard deduction and brackets. FICA is
6.2% + 1.45%. State tax and the 8% sales tax are labeled on screen as examples. Federal receipts are ~$4.9T for FY2024.
The penalty demo is an estimate from IRS failure-to-file, failure-to-pay and interest rules. All of it is presented as
education, not advice.
