"""CTRE CANcoder -- magnetic absolute encoder puck, mounts concentric to a
shaft. Top view: round housing, 2 mounting screws on opposite sides,
one JST-4 connector merged into the housing edge (a small flange
built into the puck silhouette, not a separate floating connector).
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

W, H = 300, 260
CX, CY, R = 120, 130, 100
FLANGE = (CX + R * 0.55, CY - 24, CX + R + 10, CY + 24)

PORT_EDGES = {
    "PWR+": ("right", FLANGE[2], CY - 18),
    "PWR-": ("right", FLANGE[2], CY - 6),
    "CAN_H": ("right", FLANGE[2], CY + 6),
    "CAN_L": ("right", FLANGE[2], CY + 18),
}

im, d = canvas(W, H)

# flange drawn first so the puck body overlaps/merges its left edge -- one
# continuous silhouette, no gap or wire between them
rr(d, FLANGE, 6, fill=(30, 32, 36), outline=(12, 13, 15), w=2)

circ(d, CX, CY, R, fill=(34, 36, 41), outline=C["edge"], w=3)
circ(d, CX, CY, R * 0.78, fill=(24, 26, 30), outline=(50, 53, 59), w=2)
circ(d, CX, CY, R * 0.2, fill=(46, 49, 55))
for a in (90, 270):
    mx = CX + R * 0.9 * math.cos(math.radians(a))
    my = CY + R * 0.9 * math.sin(math.radians(a))
    mount_hole(d, mx, my, 8)

text(d, (CX, CY - 16), "CANcoder", F(BOLD, 14), C["text"])
text(d, (CX, CY + 6), "CTRE", F(REG, 10), C["silk"])

for lab, y in (("+", CY - 18), ("-", CY - 6), ("CH", CY + 6), ("CL", CY + 18)):
    circ(d, FLANGE[0] + 10, y, 4, fill=(190, 176, 90))
    text(d, (FLANGE[0] + 22, y), lab, F(REG, 9), C["silk"], anchor="lm")

save(im, os.path.join(HERE, "cancoder.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "cancoder-ports.json"))
