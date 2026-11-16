#!/usr/bin/env python3
"""Mute breaths and room tone between phrases, leaving speech untouched.

usage: breath_gate.py in.wav out.wav [threshold_db]
Frames quieter than (speech level - threshold_db, default 28 dB) that are not
next to speech are pulled down by 60 dB, with short ramps so nothing clicks.
"""
import sys
import numpy as np
import scipy.io.wavfile as wf
from scipy.ndimage import uniform_filter1d

src, dst = sys.argv[1], sys.argv[2]
th = float(sys.argv[3]) if len(sys.argv) > 3 else 28.0

sr, x = wf.read(src)
x = x.astype(np.float32) / 32768.0
if x.ndim > 1:
    x = x.mean(axis=1)

hop = int(sr * 0.01)
win = int(sr * 0.03)
n = max(1, (len(x) - win) // hop)
db = np.array([10 * np.log10(np.mean((x[i * hop:i * hop + win] * np.hanning(win)) ** 2) + 1e-12) for i in range(n)])
rel = db - np.percentile(db, 90)
loud = rel > -th

# merge speech separated by tiny gaps (<200 ms), drop isolated blips (<120 ms)
seg = loud.copy()
i = 0
while i < n:
    if seg[i]:
        j = i
        while j < n and (seg[j] or (j + 20 < n and seg[j:j + 20].any())):
            j += 1
        seg[i:j] = (j - i) >= 12
        i = j
    else:
        i += 1

# keep 30 ms before and 80 ms after each phrase so word edges survive
keep = seg.copy()
idx = np.flatnonzero(seg)
for k in idx:
    keep[max(0, k - 3):min(n, k + 8)] = True

g = np.where(keep, 1.0, 10 ** (-60 / 20))
g = uniform_filter1d(g, size=4)  # 40 ms ramps
gain = np.interp(np.arange(len(x)), np.arange(n) * hop + win // 2, g)
y = np.clip(x * gain, -1, 1)
wf.write(dst, sr, (y * 32767).astype(np.int16))
