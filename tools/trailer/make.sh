#!/bin/bash
# Build the EmberCrown trailer: record frames from the real game, synthesise the score, encode an MP4.
# Usage: tools/trailer/make.sh [out.mp4]   (needs node + playwright, python3 + numpy, ffmpeg)
set -e
HERE="$(cd "$(dirname "$0")" && pwd)";ROOT="$HERE/../..";OUT="${1:-$ROOT/docs/trailer/embercrown-trailer.mp4}"
TMP="$(mktemp -d)";mkdir -p "$(dirname "$OUT")"
node "$HERE/record.js" "$TMP/frames"
N=$(ls "$TMP/frames" | wc -l);SECS=$(python3 -c "print($N/30)")
# scene cut times must match the scene lengths in record.js
python3 "$HERE/music.py" "$TMP/score.wav" "$SECS" 3.4 8.6 13.2 18.0 22.6 28.2 32.6 37.0 42.6 46.4 51.0
ffmpeg -y -loglevel error -framerate 30 -i "$TMP/frames/%05d.jpg" -i "$TMP/score.wav" \
  -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k -shortest "$OUT"
rm -rf "$TMP";echo "trailer: $OUT"
