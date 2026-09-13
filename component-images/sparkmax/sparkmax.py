"""REV SPARK MAX brushed/brushless motor controller.

Front-face view, redrawn against a real product photo: white plastic
case, a small data-port header near the top (config/PWM/limit switch
cable), three motor phase pads (A/B/C) near the top edge, "SPARK MAX"
wordmark across the middle, STATUS and MODE buttons (each with an LED)
side by side below the wordmark, and the battery input screw terminals
(V+/V-) near the bottom. Two mounting holes sit inset near the left
and right edges. Everything is drawn inside the case outline -- no
wires or tabs extend past the body silhouette.

CAN is carried on the same small data-port header as PWM/limit
switches on a real board (not broken out separately here) -- treated
as one bundled "DATA" port since the individual pinout on that header
has not been verified against a physical unit.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------- editable ----------------
LED_STATUS, LED_MODE = "red", "off"

# ---------------- geometry ----------------
W, H = 300, 460
BODY = (24, 20, 276, 440)

DATA_X, DATA_Y = 150, 40
PHASE_Y = 78
PHASE_XS = (108, 150, 192)

M_Y = 400
TERM = (96, M_Y, 204, M_Y + 26)

PORT_EDGES = {
    "DATA": ("top", DATA_X, DATA_Y),
    "PHASE_A": ("top", PHASE_XS[0], PHASE_Y),
    "PHASE_B": ("top", PHASE_XS[1], PHASE_Y),
    "PHASE_C": ("top", PHASE_XS[2], PHASE_Y),
    "V+": ("bottom", 116, TERM[3]),
    "V-": ("bottom", 184, TERM[3]),
}

im, d = canvas(W, H)

rr(d, BODY, 16, fill=(232, 234, 236), outline=(184, 186, 190), w=2)
rr(d, (BODY[0] + 6, BODY[1] + 6, BODY[2] - 6, BODY[3] - 6), 12, fill=(244, 245, 246))

# mounting holes, inset near the left/right edges (no protruding ears)
for mx in (BODY[0] + 16, BODY[2] - 16):
    mount_hole(d, mx, 220, 7)

# three brushless phase pads, inset near the top edge
for x, lab in zip(PHASE_XS, "ABC"):
    circ(d, x, PHASE_Y, 6, fill=(30, 30, 32))
    line(d, (x, BODY[1] + 10), (x, PHASE_Y - 6), (30, 30, 32), 4)
    text(d, (x, BODY[1] + 4), lab, F(BOLD, 10), (60, 62, 66))

# data port header (CAN / PWM / limit switches, bundled)
rr(d, (DATA_X - 26, DATA_Y - 8, DATA_X + 26, DATA_Y + 8), 3, fill=(40, 42, 46))
for i in range(6):
    circ(d, DATA_X - 20 + i * 8, DATA_Y, 2.4, fill=(180, 182, 186))

text(d, (150, 130), "REV ROBOTICS", F(BOLD, 11), (90, 92, 96))
text(d, (150, 180), "SPARK", F(BOLD, 30), (24, 25, 28))
text(d, (150, 212), "MAX", F(BOLD, 24), (24, 25, 28))

for cx, lab, st in ((118, "STATUS", LED_STATUS), (182, "MODE", LED_MODE)):
    col = {"green": (86, 214, 96), "red": C["red"], "off": (150, 152, 156)}[st]
    circ(d, cx, 258, 8, fill=col, outline=(120, 122, 126), w=1)
    circ(d, cx, 282, 11, fill=(210, 212, 214), outline=(160, 162, 166), w=2)
    circ(d, cx, 282, 5, fill=(150, 152, 156))
    text(d, (cx, 304), lab, F(BOLD, 9), (70, 72, 76))

text(d, (150, 340), "REV ROBOTICS", F(REG, 9), (140, 142, 146))

# battery input screw terminals, inset near the bottom edge
line(d, (116, TERM[1] - 20), (116, TERM[1]), C["posred"], 6)
line(d, (184, TERM[1] - 20), (184, TERM[1]), (24, 25, 28), 6)
rr(d, TERM, 4, fill=(40, 42, 46), outline=(16, 17, 19), w=2)
circ(d, 116, (TERM[1] + TERM[3]) / 2, 6, fill=(190, 176, 90))
circ(d, 184, (TERM[1] + TERM[3]) / 2, 6, fill=(190, 176, 90))
text(d, (116, TERM[3] + 12), "V+", F(BOLD, 10), (70, 72, 76))
text(d, (184, TERM[3] + 12), "V-", F(BOLD, 10), (70, 72, 76))

save(im, os.path.join(HERE, "sparkmax.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "sparkmax-ports.json"))
