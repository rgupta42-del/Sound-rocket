"""Builds every clip in /audio from tools/clips.json.

Voice: Piper "lessac" (medium). The model's per-sound durations are exposed and
overridden, so held sounds like "mmm" and "sss" are spoken by the voice itself
(no looping or time-stretching). Stop sounds (b, d, t...) are clipped short
with only a trace of vowel, the way phonics teachers say them.

Usage: python3 tools/build_audio.py /path/to/voice_dir
  voice_dir holds en-us-lessac-medium.onnx plus durA.onnx/durB.onnx (see make_models()).
"""
import json, os, subprocess, sys, wave
import numpy as np, onnx, onnxruntime as ort
from piper import PiperVoice
from piper.config import SynthesisConfig

VD = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "audio"); os.makedirs(OUT, exist_ok=True)
SR = 16000; HOP = 256; W = 320

def make_models():
    base = os.path.join(VD, "en-us-lessac-medium.onnx")
    a, b = os.path.join(VD, "durA.onnx"), os.path.join(VD, "durB.onnx")
    if os.path.exists(a) and os.path.exists(b): return
    m = onnx.load(base); c = [n for n in m.graph.node if n.op_type == "Ceil"][0]
    m.graph.output.append(onnx.helper.make_tensor_value_info(c.output[0], onnx.TensorProto.FLOAT, None)); onnx.save(m, a)
    m = onnx.load(base); c = [n for n in m.graph.node if n.op_type == "Ceil"][0]
    c.op_type = "Identity"; del c.input[:]; c.input.append("dur_in")
    m.graph.input.append(onnx.helper.make_tensor_value_info("dur_in", onnx.TensorProto.FLOAT, [1, 1, None])); onnx.save(m, b)

make_models()
V = PiperVoice.load(os.path.join(VD, "en-us-lessac-medium.onnx"))
A = ort.InferenceSession(os.path.join(VD, "durA.onnx")); B = ort.InferenceSession(os.path.join(VD, "durB.onnx"))

def synth_ph(phs, add=None, ls=1.0, ns=0.333, nw=0.0):
    ids = V.phonemes_to_ids(list(phs))
    inp = {"input": np.array([ids], dtype=np.int64), "input_lengths": np.array([len(ids)], dtype=np.int64),
           "scales": np.array([ns, ls, nw], dtype=np.float32)}
    a, d = A.run(None, inp)
    if not add: return a.ravel()
    d = d.copy()
    for slot, f in add.items(): d[0, 0, slot] += f
    return B.run(None, {**inp, "dur_in": d})[0].ravel()

def frames(a):
    out = []
    for i in range(0, len(a) - W, W):
        x = a[i:i+W]; e = float(np.sqrt(np.mean(x**2)))
        X = np.abs(np.fft.rfft(x * np.hanning(W)))**2 + 1e-12; f = np.fft.rfftfreq(W, 1/SR)
        c = float((X*f).sum() / X.sum()); ac = np.correlate(x, x, "full")[W-1:]
        per = float(ac[40:230].max() / (ac[0] + 1e-12))
        out.append((e, per > 0.5, c))
    return out

def longest(a, pred):
    fr = frames(a); best = (0, 0); s = None
    for i in range(len(fr) + 1):
        ok = i < len(fr) and pred(*fr[i])
        if ok and s is None: s = i
        if not ok and s is not None:
            if i - s > best[1] - best[0]: best = (s, i)
            s = None
    return best[0] * W, best[1] * W

def fade(x, i_ms=20, o_ms=40):
    x = x.copy(); n1 = min(int(SR*i_ms/1000), len(x)//3); n2 = min(int(SR*o_ms/1000), len(x)//3)
    if n1: x[:n1] *= np.linspace(0, 1, n1) ** 2
    if n2: x[-n2:] *= np.linspace(1, 0, n2) ** 2
    return x

def trim(x, rel=0.03):
    m = np.abs(x).max() if len(x) else 0
    if not m: return x
    idx = np.where(np.abs(x) > m * rel)[0]
    return x[max(0, idx[0] - 160): idx[-1] + 320]

def loud(x, target=0.11):
    rms = np.sqrt(np.mean(x**2)) or 1
    y = x * (target / rms); pk = np.abs(y).max()
    return y * (0.9 / pk) if pk > 0.9 else y

def save(name, x, quiet_target=None):
    x = loud(x, quiet_target or 0.11)
    x = np.concatenate([np.zeros(int(SR*0.02)), x, np.zeros(int(SR*0.04))]).astype(np.float32)
    wav = os.path.join(VD, "tmp.wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1)*32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-ac", "1", "-ar", str(SR),
                    "-codec:a", "libmp3lame", "-b:a", "48k", os.path.join(OUT, name + ".mp3")], check=True)

# ---------- letter sounds ----------
def held(ph, slot, pred, secs=0.6, carrier=("ˈ", "ʌ", "p")):
    x = synth_ph([ph, *carrier], {slot: int(secs*SR/HOP) + 4})
    s, e = longest(x, pred)
    assert e - s > SR*0.3, (ph, (e-s)/SR)
    seg = x[s + int(SR*0.04): e - int(SR*0.05)]
    return fade(seg, 50, 90)

unvoiced = lambda lo: (lambda e, v, c: e > 0.004 and not v and c > lo)
voiced_low = lambda hi: (lambda e, v, c: e > 0.01 and v and c < hi)

def vowel(ph, secs=0.5, long=False):
    phs = ["t", "ˈ", ph, "ː", "p"] if long else ["t", "ˈ", ph, "p"]
    x = synth_ph(phs, {5: int(secs*SR/HOP)})
    s, e = longest(x, lambda e, v, c: e > 0.01 and v)
    seg = x[s + int(SR*0.05): e - int(SR*0.05)]
    return fade(seg, 50, 110)

def stop(phs, tail_ms=45, ls=1.1, maxlen=0.22):
    x = synth_ph(list(phs) + ["ˈ", "ʌ", "p"], ls=ls)
    fr = frames(x)
    on = next(i for i, f in enumerate(fr) if f[0] > 0.006)
    # vowel = first run of 4+ voiced frames with energy, after the onset
    vs = None
    for i in range(on, len(fr) - 4):
        if all(fr[j][1] and fr[j][0] > 0.02 for j in range(i, i + 4)): vs = i; break
    start = on * W; end = (vs or on + 4) * W + int(SR*tail_ms/1000)
    end = min(max(end, start + int(SR*0.09)), start + int(SR*maxlen))
    return fade(x[max(0, start - 80): end], 4, 35)

def build_sounds():
    S = {}
    S["s"] = held("s", 1, unvoiced(3500)); S["f"] = held("f", 1, unvoiced(800))
    S["sh"] = held("ʃ", 1, unvoiced(2200)); S["th"] = held("θ", 1, lambda e, v, c: e > 0.002 and not v)
    S["m"] = held("m", 2, voiced_low(450)); S["n"] = held("n", 2, voiced_low(450))
    S["l"] = held("l", 2, voiced_low(520)); S["v"] = held("v", 2, lambda e, v, c: e > 0.004 and c < 1500)
    S["r"] = vowel("ɚ", 0.5)
    S["ng"] = held("ŋ", 2, voiced_low(500))
    # The voice devoices a held z, so add back the buzz: hiss from its z plus a low hum from its v
    hiss = held("z", 1, lambda e, v, c: e > 0.006 and c > 1800)
    hum = S["v"]
    n = min(len(hiss), len(hum))
    def band(x, lo, hi):
        X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1/SR); X[(f < lo) | (f > hi)] = 0
        return np.fft.irfft(X, len(x))
    h = band(hiss[:n], 2500, 8000); u = band(hum[:n], 60, 900)
    S["z"] = fade(h / (np.sqrt(np.mean(h**2)) + 1e-9) * 0.6 + u / (np.sqrt(np.mean(u**2)) + 1e-9) * 0.8, 50, 90)
    for k, p in [("a", "æ"), ("e", "ɛ"), ("i", "ɪ"), ("u", "ʌ")]: S[k] = vowel(p)
    S["o"] = vowel("ɑ", 0.5, long=True)
    S["ee"] = vowel("i", 0.5, long=True); S["oo"] = vowel("u", 0.5, long=True)
    for k, p in [("b", "b"), ("d", "d"), ("g", "ɡ"), ("p", "p"), ("t", "t"), ("c", "k"), ("k", "k"), ("ck", "k")]: S[k] = stop([p])
    S["j"] = stop(["d", "ʒ"], maxlen=0.25); S["ch"] = stop(["t", "ʃ"], maxlen=0.25)
    S["h"] = stop(["h"], tail_ms=70); S["w"] = stop(["w"], tail_ms=60); S["y"] = stop(["j"], tail_ms=60)
    S["qu"] = stop(["k", "w"], tail_ms=50, maxlen=0.28)
    # x = /ks/: the end of "box"
    x = synth_ph(["b", "ˈ", "ɑ", "k", "s"], {9: 14}, ls=1.2)
    fr = frames(x); last_v = max(i for i, f in enumerate(fr) if f[1] and f[0] > 0.02)
    S["x"] = fade(trim(x[(last_v + 1) * W:]), 5, 60)
    for k, x in S.items():
        quiet = 0.07 if k in ("f", "th", "h") else None  # soft sounds stay soft
        save("s_" + k, x, quiet)
    return S

# ---------- words, sentences, prompts ----------
def say(text, ls=1.0, phonemes=None):
    if phonemes:
        return fade(trim(synth_ph(phonemes, ls=ls, ns=0.5, nw=0.6)), 5, 40)
    cfg = SynthesisConfig(length_scale=ls, noise_scale=0.5, noise_w_scale=0.6)
    x = np.concatenate([c.audio_float_array for c in V.synthesize(text, cfg)])
    return fade(trim(x), 5, 40)

def main():
    C = json.load(open(os.path.join(ROOT, "tools", "clips.json")))
    only = set(sys.argv[2:])
    if not only or "sounds" in only: build_sounds()
    if not only or "words" in only:
        for k, w in C["words"].items():
            if w == "a": save(k, say("", 1.1, ["ˈ", "ʌ"]))
            else: save(k, say(w, 1.1))
    if not only or "stretched" in only:
        for k, w in C["stretched"].items(): save(k, say(w, 2.3))
    if not only or "sentences" in only:
        for k, t in C["sentences"].items(): save(k, say(t, 1.15))
    if not only or "phrases" in only:
        for k, t in C["phrases"].items(): save("p_" + k, say(t, 1.0))

main()
print("clips:", len(os.listdir(OUT)))
