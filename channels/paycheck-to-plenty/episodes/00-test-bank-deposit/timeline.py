"""Shared timeline for the 30-second bank deposit test."""
FPS, DUR = 30, 30.0
N = int(FPS * DUR)

# voice lines (file, start second)
LINES = {1: 0.3, 2: 4.6, 3: 12.9, 4: 19.4, 5: 25.7}
SCRIPT = {
    1: "Got cash at home? Let's put it in the bank, step by step.",
    2: "Step one. Grab a deposit slip, and fill it in. Your name, your account number, and the amount. Today, two hundred dollars.",
    3: "Step two. Take the slip and your cash to the teller.",
    4: "She counts it, and adds it to your account.",
    5: "Step three. Keep your receipt. That's your proof. Easy, right, little bro?",
}

# scene cuts
S1, S2, S3, S4, S5 = 0.0, 4.3, 12.7, 17.4, 25.4

# world layout (bank is 3840 x 1080)
SAM_SCALE = 0.553             # puppet px (3x sheet) -> world px
DESK_NECK = (960, 290)        # Sam front view neck point at the desk
COUNTER_NECK = (2300, 290)    # Sam front view at the counter
HIP_Y = 639                   # Sam side-view hip height
WALK_FROM, WALK_TO = 960, 2300
WALK_T0, WALK_T1 = 13.0, 16.6
SLOT = (2640, 575)            # where hands meet at the counter

# key moments
WRITE = (6.0, 11.9)
NAME_T, ACCT_T, AMT_T = 7.8, 8.9, 11.1
GIVE = (18.3, 19.1, 19.4)     # Sam reaches, teller takes, Sam's arm returns
COUNT = (20.0, 22.4)
PLUS_T = 22.4
RECEIPT = (23.4, 24.3, 24.6)  # teller reaches, Sam takes, back


def ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def ramp(t, t0, t1):
    return ease((t - t0) / (t1 - t0)) if t1 > t0 else float(t >= t1)


def lerp(a, b, u):
    return a + (b - a) * u
