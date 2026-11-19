"""Voice placement, synthesized lo-fi music bed, sparse SFX, lip-sync envelope."""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf

from timeline import FPS, DUR, N, LINES, WRITE, WALK_T0, WALK_T1, COUNT, PLUS_T, RECEIPT, GIVE

HERE = Path(__file__).resolve().parent
SR = 48000
rng = np.random.default_rng(7)


def resample(x, sr_in):
    t_in = np.arange(len(x)) / sr_in
    t_out = np.arange(int(len(x) * SR / sr_in)) / SR
    return np.interp(t_out, t_in, x)


def env_adsr(n, a=0.01, r=0.4):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)


def tone(freq, dur, amp=0.2, r=0.6, harmonics=(1, 0.35, 0.12)):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = sum(h * np.sin(2 * np.pi * freq * (i + 1) * t) for i, h in enumerate(harmonics))
    return amp * s * env_adsr(n, 0.008, r)


def music():
    bpm = 84
    beat = 60 / bpm
    total = int(DUR * SR) + SR
    out = np.zeros(total)
    chords = [(261.6, 329.6, 392.0, 493.9), (220.0, 261.6, 329.6, 392.0),
              (174.6, 220.0, 261.6, 329.6), (196.0, 246.9, 293.7, 392.0)]
    bar = 4 * beat
    t = 0.0
    i = 0
    while t < DUR + 1:
        ch = chords[i % 4]
        for k, f in enumerate(ch):                       # soft e-piano chord, slightly strummed
            s = tone(f, bar * 0.95, 0.05, r=1.4)
            st = int((t + k * 0.012) * SR)
            out[st:st + len(s)] += s[: max(0, total - st)]
        b = tone(ch[0] / 2, bar * 0.9, 0.09, r=0.9, harmonics=(1, 0.2))
        out[int(t * SR):int(t * SR) + len(b)] += b[: max(0, total - int(t * SR))]
        for q in range(4):                               # kick on 1 and 3, hat on offbeats
            bt = t + q * beat
            if q in (0, 2):
                n = int(0.25 * SR)
                tt = np.arange(n) / SR
                k_ = 0.22 * np.sin(2 * np.pi * (55 + 60 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 12)
                st = int(bt * SR)
                out[st:st + n] += k_[: max(0, total - st)]
            n = int(0.05 * SR)
            h = 0.025 * rng.normal(0, 1, n) * np.exp(-np.arange(n) / SR * 80)
            st = int((bt + beat / 2) * SR)
            out[st:st + n] += h[: max(0, total - st)]
        t += bar
        i += 1
    # gentle low-pass for a lo-fi feel
    k = np.ones(6) / 6
    return np.convolve(out, k, mode="same")[: int(DUR * SR)]


def sfx():
    out = np.zeros(int(DUR * SR))

    def add(sig, at, gain=1.0):
        st = int(at * SR)
        out[st:st + len(sig)] += gain * sig[: max(0, len(out) - st)]

    def noise_burst(dur, decay, gain, hp=True):
        n = int(dur * SR)
        x = rng.normal(0, 1, n)
        if hp:
            x = np.diff(np.concatenate([[0], x]))
        return gain * x * np.exp(-np.arange(n) / SR * decay)

    for t in np.arange(WRITE[0], WRITE[1], 0.32):           # pen scribbles
        add(noise_burst(0.18, 14, 0.03), t + rng.uniform(0, 0.08))
    for t in np.arange(WALK_T0 + 0.1, WALK_T1, 1 / 1.5):     # soft footsteps
        add(noise_burst(0.08, 60, 0.10, hp=False) * np.hanning(int(0.08 * SR)), t)
    for t in np.arange(COUNT[0] + 0.2, COUNT[1], 0.38):      # bill flicks
        add(noise_burst(0.06, 50, 0.07), t)
    bell = tone(1318.5, 1.2, 0.14, r=0.5, harmonics=(1, 0.4, 0.2, 0.1)) + tone(1975.5, 1.2, 0.07, r=0.4)
    add(bell, PLUS_T)                                       # "deposited" ding
    pr = noise_burst(0.7, 2, 0.03, hp=True) * (0.6 + 0.4 * np.sin(np.arange(int(0.7 * SR)) / SR * 2 * np.pi * 30))
    add(pr, RECEIPT[0] - 0.8)                               # receipt printer
    pop = tone(880, 0.15, 0.08, r=0.05)
    for t in (GIVE[1], RECEIPT[1]):
        add(pop, t)
    return out


def main():
    voice = np.zeros(int(DUR * SR))
    for i, st in LINES.items():
        x, sr = sf.read(HERE / f"audio/line{i}.wav")
        x = resample(x, sr)
        s = int(st * SR)
        voice[s:s + len(x)] += x[: len(voice) - s]
    # lip-sync envelope per frame
    hop = SR // FPS
    env = np.array([np.sqrt(np.mean(voice[i * hop:(i + 1) * hop] ** 2)) for i in range(N)])
    env = env / (np.percentile(env[env > 0.005], 95) + 1e-9)
    (HERE / "audio/mouth.json").write_text(json.dumps([round(float(v), 3) for v in env]))
    mus = music()
    # duck music under the voice (smooth 300 ms envelope)
    v_env = np.convolve(np.abs(voice), np.ones(int(0.3 * SR)) / int(0.3 * SR), mode="same")
    duck = 1 - 0.65 * np.clip(v_env / (v_env.max() * 0.3), 0, 1)
    mix = voice * 1.0 + mus * 0.55 * duck + sfx()
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    sf.write(HERE / "audio/mix_raw.wav", mix, SR)
    master(HERE / "audio/mix_raw.wav", HERE / "audio/mix.wav")
    print("audio ok")


def loudness(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    summary = r[r.rindex("Summary:"):]
    i = float(summary.split("I:")[1].split("LUFS")[0])
    tp = float(summary.split("Peak:")[1].split("dBFS")[0])
    return i, tp


def master(src, dst, target=-14.0):
    """Playbook Section 6: about -14 LUFS integrated, true peak below -1 dB (gain, then an oversampled limiter)."""
    i0, _ = loudness(src)
    gain = target - i0
    for _ in range(4):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-af",
                        f"volume={gain:.2f}dB,aresample=192000,alimiter=limit=0.72:level=false:attack=0.5:release=30,"
                        "aresample=48000", str(dst)], check=True)
        i, tp = loudness(dst)
        if abs(i - target) < 0.4:
            break
        gain += target - i
    print(f"master: {i:.1f} LUFS, true peak {tp:.1f} dBFS")


if __name__ == "__main__":
    main()
