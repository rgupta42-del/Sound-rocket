"""Builds every clip in /audio from tools/clips.json, in the Kokoro "af_heart" voice.

Usage: python3 tools/build_audio.py /path/to/kokoro_dir [section ...] [--force]
  kokoro_dir holds kokoro-v1.0.onnx and voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx, model-files-v1.0).
  Needs: pip install kokoro-onnx soundfile numpy, and ffmpeg.
  Sections: sounds words stretched chunks sentences phrases defs math geo labels (default: all).
  Clips that already exist are kept; --force rebuilds them.

Letter sounds can't be read reliably by any text-to-speech voice on their own, so each one is cut out of a
clearly spoken donor word (/θ/ from "thin", /iː/ from "seat") and then shaped the way phonics teachers say it:
continuous sounds (mmm, sss, thhh, eee) are held for about half a second by looping their steady middle, and
stop sounds (b, d, t...) keep only the burst and a sliver of the next vowel, so "b" not "buh".
"""
import json, os, subprocess, sys
import numpy as np
from kokoro_onnx import Kokoro

KD = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get("AUDIO_OUT") or os.path.join(ROOT, "audio"); os.makedirs(OUT, exist_ok=True)
K = Kokoro(os.path.join(KD, "kokoro-v1.0.onnx"), os.path.join(KD, "voices-v1.0.bin"))
VOICE, SR = "af_heart", 24000
FORCE = "--force" in sys.argv
want = lambda name: FORCE or not os.path.exists(os.path.join(OUT, name + ".mp3"))
F = 240   # 10 ms frames

def tts(text, speed=0.92):
    for carrier in ("Okay... ", "Alright then... "):
        try: return _tts(carrier, text, speed)
        except RuntimeError: pass
    print("  no pause found, kept as is:", text, flush=True)
    return K.create(text, voice=VOICE, speed=speed, lang="en-us")[0].astype(np.float64)

def _tts(carrier, text, speed):
    """Kokoro adds a stray "uh" syllable before short inputs, so every clip is said after a pause
    ("Okay... cat.") and only what follows the pause is kept."""
    x, sr = K.create(carrier + text, voice=VOICE, speed=speed, lang="en-us")
    assert sr == SR
    x = x.astype(np.float64)
    db = 20 * np.log10(rms(x) + 1e-9); quiet = db < db.max() - 35; run = 0
    for i, q in enumerate(quiet):
        run = run + 1 if q else 0
        if run >= 12 and not quiet[i + 1:].all():                 # the first real pause with speech after it
            start = next(j for j in range(i, len(quiet)) if not quiet[j])
            return x[max(start - 2, 0) * F:]
    raise RuntimeError(f"no pause found before {text!r}")

def rms(x): return np.array([np.sqrt(np.mean(x[i:i + F] ** 2)) for i in range(0, max(1, len(x) - F), F)])
def periodic(x):
    """per 10 ms frame: is it voiced (periodic)?"""
    out = []
    for i in range(0, max(1, len(x) - 2 * F), F):
        y = x[i:i + 2 * F]; y = y - y.mean(); ac = np.correlate(y, y, "full")[len(y) - 1:]
        out.append(ac[0] > 1e-9 and ac[60:400].max() / ac[0] > .45)
    return np.array(out)

def clean(x, lead=.02):
    """trim silence at both ends"""
    e = rms(x); m = e.max() or 1
    on = next((i for i, v in enumerate(e) if v > m * lead), 0)
    end = len(e) - next((i for i, v in enumerate(e[::-1]) if v > m * .02), 0)
    return x[max(0, on - 2) * F: min(len(x), (end + 3) * F)]

def fade(x, a=.008, b=.03):
    x = x.copy(); na, nb = min(int(SR * a), len(x) // 3), min(int(SR * b), len(x) // 3)
    if na: x[:na] *= np.linspace(0, 1, na) ** 2
    if nb: x[-nb:] *= np.linspace(1, 0, nb) ** 2
    return x

def loud(x, target=.1):
    r = np.sqrt(np.mean(x ** 2)) or 1; y = x * (target / r); pk = np.abs(y).max()
    return y * (.92 / pk) if pk > .92 else y

def save(name, x, quiet=None):
    x = np.concatenate([np.zeros(int(SR * .02)), loud(x, quiet or .1), np.zeros(int(SR * .05))])
    p = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        "-codec:a", "libmp3lame", "-b:a", "56k", os.path.join(OUT, name + ".mp3")], input=np.clip(x, -1, 1).astype(np.float32).tobytes())
    assert p.returncode == 0

# ---------- letter sounds ----------
def hold(seg, secs=.55):
    """sustain a steady sound by looping its middle with crossfades (no pitch or speed change)"""
    n = len(seg); assert n > SR * .02, f"cut came out too short ({n} samples)"
    mid = seg[int(n * .25): int(n * .75)]
    if len(mid) < SR * .04: mid = seg
    out, xf = seg[: int(n * .25)].copy(), int(SR * .02)
    while len(out) < SR * secs:
        if len(out) >= xf and len(mid) > 2 * xf:
            ramp = np.linspace(0, 1, xf); out[-xf:] = out[-xf:] * (1 - ramp) + mid[:xf] * ramp; out = np.concatenate([out, mid[xf:]])
        else: out = np.concatenate([out, mid])
    return fade(out[: int(SR * secs)], .04, .09)

def centroids(x):
    """spectral centre of each 10 ms frame, in Hz"""
    out = []
    for i in range(0, max(1, len(x) - F), F):
        X = np.abs(np.fft.rfft(x[i:i + F] * np.hanning(F))) ** 2; f = np.fft.rfftfreq(F, 1 / SR)
        out.append((X * f).sum() / max(X.sum(), 1e-12))
    return np.array(out)

def first_voiced(x, start=0):
    v = periodic(x); e = rms(x); m = e.max()
    for i in range(start, len(v) - 3):
        if v[i] and v[i + 1] and v[i + 2] and e[i] > m * .15: return i
    return None

def unvoiced_onset(word, secs=.55):
    """s, f, sh, th: the noise before the vowel starts"""
    x = clean(tts(word, .75)); vs = first_voiced(x)
    return hold(x[: max(vs - 1, 4) * F], secs)

def voiced_onset(word, secs=.55):
    """m, n, l, v, z, r: the consonant before the vowel gets loud"""
    x = clean(tts(word, .75)); e = rms(x); m = e.max()
    vstart = next(i for i, v in enumerate(e) if v > m * .55)
    return hold(x[: max(vstart - 1, 5) * F], secs)

def buzz_onset(word, secs=.55):
    """z: the buzzy hiss before the vowel (the hum of voicing before it is left off, or it sounds like "mmm")"""
    x = clean(tts(word, .75)); e = rms(x); m = e.max(); c = centroids(x)[: len(e)]; peak = int(np.argmax(e))
    a, b = longest_run((e[:peak] > m * .05) & (c[:peak] > 2500))
    return hold(x[a * F: b * F], secs)

def longest_run(mask, gap=2):
    """(start, end) frames of the longest run of True, bridging gaps of up to `gap` frames"""
    best, start, miss = (0, 0), None, 0
    for i, on in enumerate(list(mask) + [False] * (gap + 1)):
        if on:
            if start is None: start = i
            miss = 0; end = i + 1
            if end - start > best[1] - best[0]: best = (start, end)
        elif start is not None:
            miss += 1
            if miss > gap: start = None
    return best

def vowel_of(word, secs=.45, skip=.03):   # no longer used for the vowels (see vowel_ph); kept for experiments
    """the voiced stretch of a word whose vowel sits between unvoiced sounds (sit, set, seat...)"""
    # a vowel is loud with its energy low in the spectrum (fricatives and bursts are weak or hissy)
    x = clean(tts(word, .75)); e = rms(x); m = e.max(); c = centroids(x)[: len(e)]
    a, b = longest_run((e[: len(c)] > m * .3) & (c < 1800))
    seg = x[a * F + int(SR * skip): b * F - int(SR * .015)]
    return hold(seg, secs)

def vowel_ph(ph):
    """a vowel said on its own by the voice model from its phonetic spelling ("æ", "eɪ"), after the same pause trick as tts().
    Long vowels say their name (ai = "A", igh = "I"); cutting them out of words and looping them lost the glide, so "ai" came out "eh"."""
    x, sr = K.create("oʊkˈeɪ... " + ph + ".", voice=VOICE, speed=.8, lang="en-us", is_phonemes=True)
    x = x.astype(np.float64); db = 20 * np.log10(rms(x) + 1e-9); quiet = db < db.max() - 35; run = 0
    for i, q in enumerate(quiet):
        run = run + 1 if q else 0
        if run >= 12 and not quiet[i + 1:].all():
            start = next(j for j in range(i, len(quiet)) if not quiet[j])
            return fade(clean(x[max(start - 2, 0) * F:]), .01, .06)
    raise RuntimeError(f"no pause found before /{ph}/")

def coda(word):
    """ng, x: the sound after the vowel's loud part (sing, box)"""
    x = clean(tts(word, .75)); e = rms(x); m = e.max()
    peak = int(np.argmax(e)); end = next((i for i in range(peak, len(e)) if e[i] < m * .35), len(e) - 1)
    return x[end * F:]

def stop(word, vowel_ms=20, minlen=.09, maxlen=.24):
    """b, d, p, t, k, j, ch...: from the release to just after the vowel starts, with as little vowel as can still be heard,
    so it's "p", not "puh" (w, y and qu are glides and need a bit more)"""
    x = clean(tts(word, .8)); e = rms(x); m = e.max()
    on = next(i for i, v in enumerate(e) if v > m * .04)
    vs = first_voiced(x, on + 1) or on + 6
    end = vs * F + int(SR * vowel_ms / 1000)
    seg = x[on * F: min(max(end, on * F + int(SR * minlen)), on * F + int(SR * maxlen))]
    return fade(seg, .003, .04)

def build_sounds():
    S = {}
    for k, w in [("s", "sat"), ("f", "fat"), ("sh", "shop"), ("th", "thin")]: S[k] = unvoiced_onset(w)
    for k, w in [("m", "mat"), ("n", "nap"), ("l", "lap"), ("v", "van"), ("r", "rat")]: S[k] = voiced_onset(w)
    S["z"] = buzz_onset("zip")
    for k, ph in [("a", "ˈæ"), ("e", "ˈɛ"), ("i", "ˈɪ"), ("o", "ˈɑː"), ("u", "ˈʌʌ"), ("ee", "ˈiː"), ("oo", "ˈuː"), ("ay", "ˈeɪ"), ("igh", "ˈaɪ"),
                  ("oa", "ˈoʊ"), ("ue", "jˈuː"), ("er", "ˈɜːɹ"), ("ar", "ˈɑːɹ"), ("or", "ˈɔːɹ")]: S[k] = vowel_ph(ph)
    # stops come from words with the neutral "uh" vowel, so the sliver of vowel left on is the clipped one teachers use
    for k, w in [("b", "but"), ("d", "dug"), ("g", "gum"), ("p", "pup"), ("t", "tub"), ("c", "cup"), ("k", "cut"), ("j", "jug"), ("ch", "chug"),
                 ("h", "hug"), ("w", "won"), ("y", "yum"), ("qu", "quack")]:
        S[k] = stop(w, *{"w": (70, .11), "y": (70, .11), "qu": (70, .11)}.get(k, (15, .09) if k in ("p", "t", "c", "k", "ch", "h") else (35, .09)),
                    .3 if k in ("qu", "ch", "j") else .2)
    S["ck"] = S["k"]
    S["ng"] = hold(coda("sing"), .5)
    S["x"] = fade(coda("box"), .005, .05)
    for k, x in S.items():
        print("sound", k, round(len(x) / SR, 2), "s", flush=True)
        if want("s_" + k): save("s_" + k, x, .06 if k in ("f", "th", "h") else None)   # soft sounds stay soft

def main():
    C = json.load(open(os.path.join(ROOT, "tools", "clips.json")))
    only = set(a for a in sys.argv[2:] if not a.startswith("--"))
    run = lambda sec: not only or sec in only
    if run("sounds"): build_sounds()
    jobs = []
    if run("words"): jobs += [(k, w + ".", .85) for k, w in C["words"].items()]
    if run("stretched"): jobs += [(k, w + ".", .5) for k, w in C["stretched"].items()]
    if run("chunks"): jobs += [(k, t + ".", .8) for k, t in C.get("chunks", {}).items()]
    if run("sentences"): jobs += [(k, t, .9) for k, t in C["sentences"].items()]
    if run("phrases"): jobs += [("p_" + k, t, .92) for k, t in C["phrases"].items()]
    for sec in ("defs", "math", "geo", "labels"):
        if run(sec): jobs += [(k, t + ("!" if sec == "labels" else ""), .92) for k, t in C.get(sec, {}).items()]
    for i, (name, text, speed) in enumerate(jobs):
        if want(name): save(name, clean(tts(text, speed)))
        if i % 200 == 0: print(i, "/", len(jobs), flush=True)

main()
print("clips:", len(os.listdir(OUT)))
