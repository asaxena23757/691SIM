"""CTRE Voltage Regulator Module (VRM).

Layout taken from the CTRE product photo: square module, 12Vin connector on
the top edge, 12V rails on the LEFT terminal block, 5V rails on the RIGHT,
two status LEDs (12V and 5V) along the bottom.

Two independent SEPIC regulators (one 5V, one 12V), each with a 500mA and a
2A current-limited rail. Every labelled rail has TWO connector pairs and the
current limit is the COMBINED total across both pairs, not per pair. The
12V/2A figure is a peak rating -- keep continuous draw under ~1.5A.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------- editable ----------------
LED_12V = "on"      # "on" | "off"  (off = that rail's 500mA breaker tripped)
LED_5V  = "on"

# ---------------- geometry ----------------
W, H = 560, 560
BOARD = (18, 18, 542, 542)

BLK_W = 92
L_X, R_X = 52, 416                    # terminal block left edges
BLK_TOP, TERM_PITCH = 148, 40         # 8 terminal positions per block
VIN = (238, 40, 322, 92)

RAILS = [("12V", "2A", 0), ("12V", "500mA", 4)]     # left block
RAILS_R = [("5V", "2A", 0), ("5V", "500mA", 4)]     # right block

PORT_EDGES = {
    "VIN+": ("top", VIN[0] + 21, VIN[1]),
    "VIN-": ("top", VIN[2] - 21, VIN[1]),
}
for (v, a, off), (side, x) in [(RAILS[0], ("left", L_X)), (RAILS[1], ("left", L_X)),
                               (RAILS_R[0], ("right", R_X + BLK_W)),
                               (RAILS_R[1], ("right", R_X + BLK_W))]:
    for pair in (0, 1):
        base = BLK_TOP + (off + pair * 2) * TERM_PITCH + TERM_PITCH / 2
        PORT_EDGES[f"{v}_{a}_{pair + 1}+"] = (side, x, base)
        PORT_EDGES[f"{v}_{a}_{pair + 1}-"] = (side, x, base + TERM_PITCH)

im, d = canvas(W, H)

rr(d, BOARD, 10, fill=(30, 32, 37), outline=C["edge"], w=2)
for cx, cy in ((44, 44), (516, 44), (44, 516), (516, 516)):
    mount_hole(d, cx, cy, 9)

# 12V input
rr(d, VIN, 5, fill=C["black"], outline=C["grey"], w=2)
rect(d, (VIN[0] + 10, VIN[1] + 10, VIN[0] + 32, VIN[3] - 10), fill=C["posred"])
rect(d, (VIN[2] - 32, VIN[1] + 10, VIN[2] - 10, VIN[3] - 10), fill=(60, 62, 68))
text(d, (280, 108), "12V in", F(BOLD, 13), C["text"])

# terminal blocks
for x, rails, accent, side in ((L_X, RAILS, C["orange"], "L"),
                               (R_X, RAILS_R, C["blue"], "R")):
    rr(d, (x, BLK_TOP, x + BLK_W, BLK_TOP + 8 * TERM_PITCH), 4,
       fill=(214, 216, 220), outline=C["white_d"], w=2)
    for i in range(8):
        y = BLK_TOP + i * TERM_PITCH
        rect(d, (x + 12, y + 8, x + BLK_W - 12, y + 32), fill=C["board2"])
        circ(d, x + BLK_W / 2, y + 20, 7, fill=(150, 154, 162))
    for v, a, off in rails:
        y0 = BLK_TOP + off * TERM_PITCH
        rect(d, (x - 12, y0 + 4, x - 6, y0 + 4 * TERM_PITCH - 4) if side == "L"
             else (x + BLK_W + 6, y0 + 4, x + BLK_W + 12, y0 + 4 * TERM_PITCH - 4),
             fill=accent)
        lx = x + BLK_W + 22 if side == "L" else x - 22
        text(d, (lx, y0 + 2 * TERM_PITCH), f"{v}/{a}", F(BOLD, 13), C["text"],
             anchor="lm" if side == "L" else "rm")

text(d, (280, 300), "Voltage", F(BOLD, 16), C["text"])
text(d, (280, 324), "Regulator", F(BOLD, 16), C["text"])
text(d, (280, 348), "Module", F(BOLD, 16), C["text"])


# status LEDs
for i, (lab, st) in enumerate((("12V", LED_12V), ("5V", LED_5V))):
    cx = 246 + i * 68
    text(d, (cx, 442), lab, F(BOLD, 12), C["text"])
    circ(d, cx, 476, 17, fill=(70, 210, 100) if st == "on" else (58, 62, 70),
         outline=C["edge"], w=2)

text(d, (280, 516), "rail limit = both pairs combined", F(REG, 10), C["silk"])

save(im, os.path.join(HERE, "vrm.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "vrm-ports.json"))