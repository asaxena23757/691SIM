"""CTRE Pigeon 2 -- CAN-connected IMU puck. Top view: square housing with
a forward-direction arrow silkscreened on top (orientation matters for
mounting), 4 corner mounting holes, one JST-4 connector merged into
the housing edge (a small flange built into the body silhouette, not a
separate floating connector).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

W, H = 260, 240
BODY = (20, 20, 200, 200)
FLANGE = (170, 86, 220, 134)

PORT_EDGES = {
    "PWR+": ("right", FLANGE[2], 96),
    "PWR-": ("right", FLANGE[2], 108),
    "CAN_H": ("right", FLANGE[2], 120),
    "CAN_L": ("right", FLANGE[2], 132),
}

im, d = canvas(W, H)

# flange first so the body overlaps its left edge -- one continuous shape
rr(d, FLANGE, 5, fill=(30, 32, 36), outline=(12, 13, 15), w=2)

rr(d, BODY, 12, fill=(30, 36, 22), outline=C["edge"], w=3)
rr(d, (BODY[0] + 10, BODY[1] + 10, BODY[2] - 10, BODY[3] - 10), 8,
   fill=(22, 27, 16), outline=(52, 62, 38), w=1)
for cx, cy in ((38, 38), (182, 38), (38, 182), (182, 182)):
    mount_hole(d, cx, cy, 7)

cx, cy = (BODY[0] + BODY[2]) / 2, (BODY[1] + BODY[3]) / 2
poly(d, [(cx, cy - 38), (cx - 16, cy - 6), (cx - 6, cy - 6), (cx - 6, cy + 30),
         (cx + 6, cy + 30), (cx + 6, cy - 6), (cx + 16, cy - 6)],
     fill=(163, 230, 53))
text(d, (cx, cy + 54), "Pigeon 2", F(BOLD, 13), C["text"])
text(d, (cx, cy + 72), "CTRE  ·  FWD ↑", F(REG, 9), C["silk"])

for lab, y in (("+", 96), ("-", 108), ("CH", 120), ("CL", 132)):
    circ(d, FLANGE[0] + 10, y, 4, fill=(190, 176, 90))
    text(d, (FLANGE[0] + 22, y), lab, F(REG, 9), C["silk"], anchor="lm")

save(im, os.path.join(HERE, "pigeon2.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "pigeon2-ports.json"))
