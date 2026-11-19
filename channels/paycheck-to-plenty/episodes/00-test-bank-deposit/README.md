# 00 · Test — "How to deposit cash at a bank" (30 s)

A test of the full pipeline: the owner's Sam artwork animated as a jointed puppet, an AI voice,
a code-drawn bank with a background cast, rendered by **raea**.

## Script (voice: Kokoro `am_michael`, free and local)
1. Got cash at home? Let's put it in the bank, step by step.
2. Step one. Grab a deposit slip, and fill it in. Your name, your account number, and the amount. Today, two hundred dollars.
3. Step two. Take the slip and your cash to the teller.
4. She counts it, and adds it to your account.
5. Step three. Keep your receipt. That's your proof. Easy, right, little bro?

Alternative voices to compare: `audio/sample_am_puck.wav`, `audio/sample_am_fenrir.wav`.

## How it is built
| Step | File | What it does |
|---|---|---|
| Puppet | `tools/puppet.py`, `tools/mouths.py` | Cuts the owner's reference sheets into parts (head, torso, upper arm, forearm, hand, thigh, shin) and makes closed / half / open talking mouths |
| Bank | `tools/bank.py` | Draws the bank as layers (back wall, teller counter, deposit desk) |
| Cast | `sprites.py` (+ `tools/rig.py`) | Teller, second teller, customer, guard, waiting customer as animated sprites |
| Sound | `audio_mix.py` | Places the voice lines, a soft lo-fi bed and light SFX; lip-sync curve; mastered to −14 LUFS |
| Animation + render | `raea/edit.tsx` | raea composition: camera, Sam's poses every frame (joints), the cast, on-screen text, audio |

## Rebuild
```bash
# one time: raea (Linux release) + a CPU Vulkan driver when there is no GPU
curl -L -o raea.tar.gz https://github.com/shinyobjectz/raea/releases/download/v0.1.6/raea-0.1.6-linux-x86_64.tar.gz
apt-get install -y mesa-vulkan-drivers libasound2t64 libfontconfig1
pip install kokoro-onnx soundfile opencv-python-headless
# assets
python3 ../../tools/puppet.py && python3 ../../tools/mouths.py && python3 ../../tools/bank.py
node ../../tools/render_svg.js 2 layers/bank_back.svg layers/bank_counter.svg layers/bank_desk.svg
python3 sprites.py && python3 audio_mix.py && python3 make_tiles.py
# render (VK_ICD_FILENAMES only needed without a GPU)
cd raea && VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/lvp_icd.json raea render edit.tsx -o out/bank-deposit-test.mp4 --quality high
```
Run `python3 make_tiles.py` after the sprites and before rendering (raea's image atlas is 8192 px).
