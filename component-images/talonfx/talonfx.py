"""CTRE Talon FX-family integrated brushless motor+controller (Falcon
500 / Kraken X60 form factor).

Redrawn against a real product photo of the connector-end cap: a
circular black cap with cooling slots, the green "TALON FX" wordmark,
2 alignment/mounting holes, and 4 exposed silver pin studs along the
bottom -- in order "-", "H" (CAN high), "L" (CAN low), "+". Everything
(studs, holes, slots) is inset within the circular body -- nothing
extends past the silhouette.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------- editable ----------------
LED_STATE = "off"

# ---------------- geometry ----------------
W, H = 340, 340
CX, CY, R = 170, 170, 150

PIN_Y = CY + R * 0.62
PIN_XS = (CX - 90, CX - 30, CX + 30, CX + 90)
PIN_LABELS = ("-", "H", "L", "+")
PIN_COLORS = ((150, 152, 156), (120, 200, 90), (90, 160, 230), (150, 152, 156))

PORT_EDGES = {
    "PWR-": ("bottom", PIN_XS[0], PIN_Y + 15),
    "CAN_H": ("bottom", PIN_XS[1], PIN_Y + 15),
    "CAN_L": ("bottom", PIN_XS[2], PIN_Y + 15),
    "PWR+": ("bottom", PIN_XS[3], PIN_Y + 15),
}

im, d = canvas(W, H)

circ(d, CX, CY, R, fill=(32, 33, 36), outline=(14, 15, 16), w=3)

# cooling slots, inset near the top of the circle
for dx in (-48, -16, 16):
    rr(d, (CX + dx, CY - R * 0.62, CX + dx + 20, CY - R * 0.30), 8, fill=(20, 21, 23))

# mounting / alignment holes, inset well within the circle
for mx in (CX - R * 0.5, CX + R * 0.5):
    mount_hole(d, mx, CY - R * 0.55, 9)

text(d, (CX, CY - 8), "TALON", F(BOLD, 20), (140, 214, 60))
text(d, (CX, CY + 16), "FX", F(BOLD, 20), (140, 214, 60))

status_col = (86, 214, 96) if LED_STATE == "green" else C["red"] if LED_STATE == "red" else (60, 62, 66)
circ(d, CX, CY + 48, 6, fill=status_col, outline=(14, 15, 16), w=1)

# pin studs, inset above the bottom of the circle
for x, lab, col in zip(PIN_XS, PIN_LABELS, PIN_COLORS):
    circ(d, x, PIN_Y, 15, fill=(150, 154, 162), outline=(100, 104, 112), w=2)
    circ(d, x, PIN_Y, 7, fill=(190, 192, 196))
    text(d, (x, PIN_Y - 26), lab, F(BOLD, 13), col)

save(im, os.path.join(HERE, "talonfx.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "talonfx-ports.json"))
