#!/usr/bin/env python3
"""Strong voice clean-up: spectral noise gate + silence gate between phrases.

usage: clean_voice.py in.wav out.wav [strength]
strength ~1.0 (normal) .. 2.0 (aggressive)
"""
import sys
import numpy as np
import scipy.io.wavfile as wf
from scipy.signal import stft, istft
from scipy.ndimage import uniform_filter, uniform_filter1d

src, dst = sys.argv[1], sys.argv[2]
k = float(sys.argv[3]) if len(sys.argv) > 3 else 1.5

sr, x = wf.read(src)
x = x.astype(np.float32) / 32768.0
if x.ndim > 1:
    x = x.mean(axis=1)

nper = 2048
f, t, X = stft(x, sr, nperseg=nper, noverlap=nper * 3 // 4)
mag = np.abs(X)

# noise profile from the quietest 15% of frames
fe = mag.mean(axis=0)
quiet = fe <= np.percentile(fe, 15)
nmean = mag[:, quiet].mean(axis=1, keepdims=True)
nstd = mag[:, quiet].std(axis=1, keepdims=True)
thresh = nmean + k * 1.5 * nstd

# soft spectral gate, smoothed over time and frequency to avoid "musical" artefacts
mask = np.clip((mag - thresh) / (mag + 1e-9), 0, 1)
mask = uniform_filter(mask, size=(5, 7))
floor = 10 ** (-(18 + 8 * k) / 20)
mask = floor + (1 - floor) * mask
Y = X * mask
_, y = istft(Y, sr, nperseg=nper, noverlap=nper * 3 // 4)
y = y[: len(x)]

# frame-level gate: push the gaps between phrases close to silence
hop = int(sr * 0.01)
n = len(y) // hop
e = np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2)) + 1e-9 for i in range(n)])
db = 20 * np.log10(e)
speech = db > np.percentile(db, 10) + 14
# hold 120 ms after / 60 ms before speech so word edges are not clipped
held = uniform_filter1d(speech.astype(float), size=19) > 0
g = np.where(held, 1.0, 10 ** (-40 / 20))
g = uniform_filter1d(g, size=5)  # 50 ms ramps
gain = np.repeat(g, hop)
gain = np.concatenate([gain, np.full(len(y) - len(gain), gain[-1])])
y = y * gain

y = np.clip(y, -1, 1)
wf.write(dst, sr, (y * 32767).astype(np.int16))
