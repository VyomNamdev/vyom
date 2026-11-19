import sys; sys.path.insert(0, '.')
from rig import *
b = ['<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect width="1920" height="1080" fill="#F6F2EA"/>']
b.append(character_front(SAM, ex="neutral", x=220, y=60, scale=0.82))
b.append(character_profile(SAM, ex="neutral", x=520, y=60, scale=0.82, facing=1))
b.append(character_front(TELLER_A, ex="neutral", x=820, y=110, scale=0.82))
b.append(character_front(TELLER_B, ex="neutral", x=1080, y=90, scale=0.82))
b.append(character_front(GUARD, ex="serious", x=1340, y=60, scale=0.82))
b.append(character_front(CUSTOMER_E, ex="neutral", x=1580, y=80, scale=0.82, pose=dict(ru=-20, rf=150, rh=170, rhand="fist", rheld="phone")))
b.append(character_profile(CUSTOMER_C, x=1800, y=110, scale=0.82, facing=1))
b.append('</svg>')
open('/tmp/claude-0/-home-user-vyom/cdf396e7-096a-50d3-9ca3-232af1f8c299/scratchpad/cast.svg','w').write(''.join(b))
# face closeups
c = ['<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect width="1920" height="1080" fill="#FFFFFF"/>']
for i, e in enumerate(["neutral","happy","excited","sad","grumpy","surprised","thoughtful","confused","serious","smirk","wink","neutral"]):
    m = 0.8 if i == 11 else 0
    c.append(f'<g transform="translate({170+(i%6)*315},{90+(i//6)*500}) scale(2.0)">{head_front(SAM, e, m)}</g>')
c.append('</svg>')
open('/tmp/claude-0/-home-user-vyom/cdf396e7-096a-50d3-9ca3-232af1f8c299/scratchpad/faces.svg','w').write(''.join(c))
