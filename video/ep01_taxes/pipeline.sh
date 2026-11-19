#!/bin/bash
set -o pipefail
cd /home/user/raea-studio/fine-print-money/projects/ep01-taxes
export PATH=$HOME/.local/bin:$PATH
LOG=out/pipeline.log
echo "STAGE voice $(date +%T)" > $LOG
/home/user/tts/cbx/bin/python -u assets/build_voice_chatterbox.py 2>&1 | grep --line-buffered -E "^\s+[a-z]+ +seg|voice.wav|Traceback|Error" >> $LOG || { echo "FAILED voice" >> $LOG; exit 1; }
echo "STAGE audio $(date +%T)" >> $LOG
(cd assets && python3 build_audio.py) >> $LOG 2>&1 || { echo "FAILED audio" >> $LOG; exit 1; }
echo "STAGE render $(date +%T)" >> $LOG
raea render compositions/ep01-taxes.tsx -o out/ep01-taxes-v2.mp4 --quality high --manifest out/render-v2.json > out/render-v2.log 2>&1 || { echo "FAILED render" >> $LOG; grep -v usvg out/render-v2.log | tail -5 >> $LOG; exit 1; }
echo "STAGE share $(date +%T)" >> $LOG
ffmpeg -hide_banner -loglevel error -y -i out/ep01-taxes-v2.mp4 -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart out/ep01-taxes-v2-share.mp4 || { echo "FAILED share" >> $LOG; exit 1; }
echo "DONE $(date +%T)" >> $LOG
