#!/usr/bin/env bash
# Clean a voice recording the same way as "تجربة_محسّنة_٢":
# high-pass + de-click, spectral noise gate (strength 1.6), pause trimming, loudness -16 LUFS.
# usage: tools/process_recording.sh input.(m4a|mp3|wav|ogg) output.mp3
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"; tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
ffmpeg -v error -y -i "$1" -ac 1 -af "highpass=f=90,lowpass=f=12000,adeclick" -ar 48000 "$tmp/pre.wav"
python3 "$here/clean_voice.py" "$tmp/pre.wav" "$tmp/den.wav" 1.6
ffmpeg -v error -y -i "$tmp/den.wav" -af "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.15:stop_periods=-1:stop_duration=0.6:stop_threshold=-50dB:stop_silence=0.4,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.25,areverse,loudnorm=I=-16:TP=-1.5:LRA=11" -ar 44100 -c:a libmp3lame -b:a 128k "$2"
