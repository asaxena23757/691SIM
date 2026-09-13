"""Limelight 3 vision camera. Front view: lens + IR/white LED ring in a
housing with the characteristic triangular 3-hole mount pattern.

NOTE: mount-hole spacing is not yet confirmed against a real unit /
reference photo -- the triangular pattern here is carried over from
the previous pass. Ping with an actual product photo to correct the
hole positions if this is wrong.

Connector panel (12V barrel power, Ethernet, USB-C config) is a
recessed strip built into the bottom edge of the case rather than
free-floating connectors below it.
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

W, H = 340, 320
BODY = (30, 30, 310, 280)
LENS_CX, LENS_CY, LENS_R = 170, 128, 60

PANEL = (60, 240, 280, 272)
PWR_CX = 100
ETH_X = 150
USB_X = 220

PORT_EDGES = {
    "PWR+": ("bottom", PWR_CX - 6, PANEL[3]),
    "PWR-": ("bottom", PWR_CX + 6, PANEL[3]),
    "ETH": ("bottom", ETH_X + 18, PANEL[3]),
    "USB_C": ("bottom", USB_X + 15, PANEL[3]),
}

im, d = canvas(W, H)

rr(d, BODY, 16, fill=(20, 22, 26), outline=C["edge"], w=3)

# triangular 3-hole mount pattern (characteristic Limelight footprint)
for mx, my in ((170, 46), (60, 262), (280, 262)):
    mount_hole(d, mx, my, 8)

circ(d, LENS_CX, LENS_CY, LENS_R, fill=(10, 10, 12), outline=(60, 64, 70), w=4)
circ(d, LENS_CX, LENS_CY, LENS_R * 0.55, fill=(6, 60, 68))
circ(d, LENS_CX, LENS_CY, LENS_R * 0.2, fill=(2, 2, 3))
for a in range(0, 360, 30):
    lx = LENS_CX + LENS_R * 0.85 * math.cos(math.radians(a))
    ly = LENS_CY + LENS_R * 0.85 * math.sin(math.radians(a))
    circ(d, lx, ly, 4, fill=(120, 220, 230))

text(d, (170, 18), "Limelight 3", F(BOLD, 14), C["text"])

# recessed connector panel built into the bottom edge
rr(d, PANEL, 4, fill=(10, 11, 13), outline=(4, 4, 5), w=2)

barrel_jack(d, PWR_CX, (PANEL[1] + PANEL[3]) / 2, 11)
text(d, (PWR_CX, PANEL[1] - 8), "12V", F(REG, 8), C["silk"])

rj45(d, (ETH_X, PANEL[1] + 5, ETH_X + 36, PANEL[3] - 5))
text(d, (ETH_X + 18, PANEL[1] - 8), "ETH", F(REG, 8), C["silk"])

rr(d, (USB_X, PANEL[1] + 8, USB_X + 30, PANEL[3] - 8), 3,
   fill=(216, 218, 222), outline=(150, 152, 158), w=1)
rect(d, (USB_X + 6, PANEL[1] + 13, USB_X + 24, PANEL[3] - 13), fill=(60, 62, 68))
text(d, (USB_X + 15, PANEL[1] - 8), "USB-C", F(REG, 8), C["silk"])

save(im, os.path.join(HERE, "limelight.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "limelight-ports.json"))
