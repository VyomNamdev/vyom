#!/usr/bin/env python3
"""Build every sound for EP01 (taxes): AI voice (Kokoro, local), lip-sync envelope, SFX and a music bed.

Outputs (all under assets/audio/ unless noted):
  voice.wav                 the narration, lines joined with their pauses
  sfx_*.wav                 click, whoosh, riser, pop, ding (cash register), thud, tick
  music_main.wav            light warm lo-fi bed for the explainer (sections 1-11)
  music_tension.wav         low pulse for the twist (sections 12-14)
  ../components/timeline.gen.ts   line start/end frames + per-frame mouth openness (0..1)
"""
import json
import math
from pathlib import Path

import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
OUT = HERE / "audio"
OUT.mkdir(exist_ok=True)
SR = 24000
FPS = 30
MODEL_DIR = Path("/home/user/tts")


def write(name, x, sr=SR):
    x = np.asarray(x, dtype=np.float32)
    peak = np.max(np.abs(x)) or 1.0
    if peak > 0.98:
        x = x / peak * 0.98
    sf.write(OUT / name, x, sr)


# ---------------------------------------------------------------- voice
def build_voice(script):
    from kokoro_onnx import Kokoro

    k = Kokoro(str(MODEL_DIR / "kokoro-v1.0.onnx"), str(MODEL_DIR / "voices-v1.0.bin"))
    v = script["voice"]
    lead = 0.6  # silence before the first word
    pieces = [np.zeros(int(lead * SR), dtype=np.float32)]
    t = lead
    lines = []
    for ln in script["lines"]:
        audio, sr = k.create(ln["text"], voice=v["voice"], speed=v["speed"], lang="en-us")
        assert sr == SR, sr
        audio = trim(audio)
        dur = len(audio) / SR
        lines.append({"id": ln["id"], "start": round(t, 3), "end": round(t + dur, 3), "text": ln["text"]})
        pieces += [audio, np.zeros(int(ln["pause_after"] * SR), dtype=np.float32)]
        t += dur + ln["pause_after"]
        print(f"  {ln['id']:<11} {dur:5.2f}s")
    voice = np.concatenate(pieces)
    write("voice.wav", voice)
    return voice, lines


def trim(a, thresh=0.01):
    idx = np.where(np.abs(a) > thresh)[0]
    if len(idx) == 0:
        return a
    s = max(0, idx[0] - int(0.02 * SR))
    e = min(len(a), idx[-1] + int(0.06 * SR))
    return a[s:e]


def mouth_envelope(voice):
    """Per-frame mouth openness 0..1 from the voice's loudness, smoothed so the mouth flaps naturally."""
    hop = SR // FPS
    n = math.ceil(len(voice) / hop)
    rms = np.array([np.sqrt(np.mean(voice[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    db = 20 * np.log10(rms + 1e-9)
    open_ = np.clip((db + 42) / 26, 0, 1)  # -42 dB closed, -16 dB fully open
    # light attack/release smoothing
    out = np.zeros_like(open_)
    for i, x in enumerate(open_):
        prev = out[i - 1] if i else 0
        out[i] = prev + (x - prev) * (0.75 if x > prev else 0.45)
    return [round(float(x), 2) for x in out]


# ---------------------------------------------------------------- sfx
def env(n, a, r):
    e = np.ones(n)
    a, r = int(a), int(r)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[-r:] *= np.linspace(1, 0, r) ** 2
    return e


def noise(n, seed=1):
    return np.random.default_rng(seed).standard_normal(n)


def lowpass(x, cutoff):
    """One-pole low-pass; cutoff may be an array (sweeps)."""
    cutoff = np.broadcast_to(cutoff, x.shape)
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        a = 1 - math.exp(-2 * math.pi * cutoff[i] / SR)
        acc += a * (x[i] - acc)
        y[i] = acc
    return y


def sfx():
    s = {}
    # click: a short bright tick (UI / number tick)
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    s["click"] = (np.sin(2 * math.pi * 2200 * t) * 0.6 + noise(n, 2) * 0.25) * np.exp(-t * 180)
    # tick: softer counter tick
    n = int(0.02 * SR)
    t = np.arange(n) / SR
    s["tick"] = np.sin(2 * math.pi * 1500 * t) * np.exp(-t * 260) * 0.5
    # pop: a rounded pop for things appearing
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = 900 * np.exp(-t * 30) + 220
    s["pop"] = np.sin(2 * math.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * 0.8
    # whoosh: band-swept noise, 0.45 s
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    sweep = 300 + 5000 * np.sin(np.pi * t / t[-1]) ** 2
    w = lowpass(noise(n, 3), sweep) - lowpass(noise(n, 3), sweep * 0.25)
    s["whoosh"] = w * np.sin(np.pi * t / t[-1]) ** 1.5 * 2.2
    # riser: 2.2 s rising noise + tone
    n = int(2.2 * SR)
    t = np.arange(n) / SR
    p = t / t[-1]
    r = lowpass(noise(n, 4), 400 + 7000 * p ** 2) * p ** 2 * 1.6
    tone = np.sin(2 * math.pi * np.cumsum(180 + 700 * p ** 2) / SR) * p ** 3 * 0.35
    s["riser"] = (r + tone) * env(n, 0, 0.05 * SR)
    # ding: cash-register bell (two partials) + drawer click
    n = int(1.1 * SR)
    t = np.arange(n) / SR
    bell = (np.sin(2 * math.pi * 1568 * t) + 0.6 * np.sin(2 * math.pi * 2093 * t) + 0.3 * np.sin(2 * math.pi * 3136 * t)) * np.exp(-t * 4)
    s["ding"] = bell * 0.45 + np.pad(s["click"], (0, n - len(s["click"]))) * 0.6
    # thud: low impact for big reveals
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 120 * np.exp(-t * 8) + 45
    s["thud"] = (np.sin(2 * math.pi * np.cumsum(f) / SR) * np.exp(-t * 9) + lowpass(noise(n, 5), 300) * np.exp(-t * 20) * 0.8)
    # coin: two quick metallic pings
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    c = np.sin(2 * math.pi * 3520 * t) * np.exp(-t * 18) + np.sin(2 * math.pi * 4186 * t) * np.exp(-t * 22) * 0.6
    c2 = np.roll(c, int(0.07 * SR)) * 0.7
    c2[: int(0.07 * SR)] = 0
    s["coin"] = (c + c2) * 0.4
    # stamp: thump + paper slap
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    s["stamp"] = (np.sin(2 * math.pi * 90 * t) * np.exp(-t * 25) + noise(n, 6) * np.exp(-t * 60) * 0.7)
    for k, x in s.items():
        write(f"sfx_{k}.wav", x)
    return list(s)


# ---------------------------------------------------------------- music
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(name):
    n, o = name[:-1], int(name[-1])
    return 440 * 2 ** ((NOTE[n] + 12 * (o + 1) - 69) / 12)


def epiano(f, dur, vel=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * math.pi * f * t + 0.8 * np.sin(2 * math.pi * f * 2 * t) * np.exp(-t * 3))
    x += 0.25 * np.sin(2 * math.pi * f * 2 * t) * np.exp(-t * 2)
    return x * np.exp(-t * 1.6) * env(n, 0.005 * SR, 0.08 * SR) * vel


def music_main(seconds):
    """Warm lo-fi: Fmaj7 - Em7 - Dm7 - Cmaj7 at 84 bpm, soft keys, brushed hats, mellow kick."""
    bpm = 84
    beat = 60 / bpm
    n = int(seconds * SR)
    mix = np.zeros(n + SR * 3)
    chords = [["F3", "A3", "C4", "E4"], ["E3", "G3", "B3", "D4"], ["D3", "F3", "A3", "C4"], ["C3", "E3", "G3", "B3"]]
    bass = ["F2", "E2", "D2", "C2"]
    bar = 4 * beat
    nbars = int(seconds / bar) + 1
    for b in range(nbars):
        t0 = b * bar
        ch = chords[b % 4]
        for i, note in enumerate(ch):  # slightly strummed
            s = int((t0 + i * 0.018) * SR)
            x = epiano(hz(note), bar * 1.05, 0.11)
            mix[s:s + len(x)] += x[: len(mix) - s]
        # off-beat chord stab on beat 3.5
        s = int((t0 + 2.5 * beat) * SR)
        for note in ch[1:]:
            x = epiano(hz(note), beat, 0.05)
            mix[s:s + len(x)] += x[: len(mix) - s]
        # bass
        for bt in (0, 2.5):
            s = int((t0 + bt * beat) * SR)
            nn = int(beat * 1.4 * SR)
            tt = np.arange(nn) / SR
            x = np.sin(2 * math.pi * hz(bass[b % 4]) * tt) * np.exp(-tt * 2.5) * env(nn, 0.01 * SR, 0.1 * SR) * 0.32
            mix[s:s + nn] += x[: len(mix) - s]
        # drums
        for k in range(8):
            ts = t0 + k * beat / 2
            s = int(ts * SR)
            # hat
            nn = int(0.06 * SR)
            h = (noise(nn, 100 + k) - lowpass(noise(nn, 100 + k), 6000)) * np.exp(-np.arange(nn) / SR * 70) * (0.07 if k % 2 else 0.045)
            mix[s:s + nn] += h
            if k in (0, 5):  # kick
                nn = int(0.3 * SR)
                tt = np.arange(nn) / SR
                kick = np.sin(2 * math.pi * np.cumsum(55 + 90 * np.exp(-tt * 30)) / SR) * np.exp(-tt * 10) * 0.42
                mix[s:s + nn] += kick
            if k in (2, 6):  # soft snare/rim
                nn = int(0.15 * SR)
                tt = np.arange(nn) / SR
                sn = lowpass(noise(nn, 200 + k), 3500) * np.exp(-tt * 28) * 0.16
                mix[s:s + nn] += sn
    mix = mix[:n]
    # vinyl crackle, very quiet
    rng = np.random.default_rng(9)
    crackle = np.zeros(n)
    idx = rng.integers(0, n, int(seconds * 6))
    crackle[idx] = rng.uniform(-0.15, 0.15, len(idx))
    mix += lowpass(crackle, 3000) * 0.5
    fade = int(1.5 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)
    write("music_main.wav", mix)


def music_tension(seconds):
    """Low pulse in A minor with a heartbeat kick, for the twist."""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    drone = (np.sin(2 * math.pi * hz("A1") * t) + 0.5 * np.sin(2 * math.pi * hz("E2") * t) + 0.25 * np.sin(2 * math.pi * hz("C3") * t * 1.002))
    drone *= 0.18 * (0.75 + 0.25 * np.sin(2 * math.pi * 0.25 * t))
    beat = 60 / 70
    for k in range(int(seconds / beat)):
        for off, g in ((0, 0.5), (0.22, 0.32)):
            s = int((k * beat + off) * SR)
            nn = int(0.25 * SR)
            tt = np.arange(nn) / SR
            kick = np.sin(2 * math.pi * np.cumsum(45 + 60 * np.exp(-tt * 25)) / SR) * np.exp(-tt * 12) * g
            mix_end = min(n, s + nn)
            drone[s:mix_end] += kick[: mix_end - s]
    drone *= env(n, 1.0 * SR, 1.5 * SR)
    write("music_tension.wav", drone)


def load_chatterbox_voice():
    """The Chatterbox voice made by build_voice_chatterbox.py, with its line and segment timings."""
    seg = json.loads((OUT / "voice_segments.json").read_text())
    voice, sr = sf.read(OUT / "voice.wav", dtype="float32")
    if sr != SR:
        n = int(len(voice) * SR / sr)
        voice = np.interp(np.linspace(0, len(voice) - 1, n), np.arange(len(voice)), voice).astype(np.float32)
    return voice, seg["lines"]


def main():
    import sys
    if "--kokoro" in sys.argv:
        script = json.loads((HERE / "script.json").read_text())
        print("voice (kokoro):")
        voice, lines = build_voice(script)
        for l in lines:
            l["segments"] = [{"text": l["text"], "start": l["start"], "end": l["end"]}]
    else:
        print("voice (chatterbox, from audio/voice.wav)")
        voice, lines = load_chatterbox_voice()
    total = len(voice) / SR
    mouth = mouth_envelope(voice)
    names = sfx()
    music_main(total + 1)
    music_tension(total + 1)
    frames = math.ceil((total + 0.4) * FPS)
    fr = lambda s: round(s * FPS)
    tl = {
        "fps": FPS,
        "totalFrames": frames,
        "lines": [
            {"id": l["id"], "text": l["text"], "start": l["start"], "end": l["end"], "from": fr(l["start"]), "to": fr(l["end"]),
             "segments": [{"text": g["text"], "from": fr(g["start"]), "to": fr(g["end"])} for g in l["segments"]]}
            for l in lines
        ],
    }
    ts = (
        "// generated by assets/build_audio.py — do not edit by hand\n"
        f"export const TIMELINE = {json.dumps(tl, indent=1)} as const;\n"
        f"export const MOUTH: number[] = {json.dumps(mouth)};\n"
    )
    (HERE.parent / "components" / "timeline.gen.ts").write_text(ts)
    words = sum(len(l["text"].split()) for l in lines)
    print(f"total {total:.1f}s, {frames} frames, {words} words, {words / total * 60:.0f} wpm; sfx: {', '.join(names)}")


if __name__ == "__main__":
    main()
