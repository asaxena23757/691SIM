"""Generic USB vision camera as commonly run under PhotonVision (e.g. an
Arducam/ELP-style board camera) -- PhotonVision itself is coprocessor
software, not a specific board, so this represents the camera module
that plugs into a coprocessor's USB port. Front view: lens + small PCB
with 2 mounting holes and a USB port recessed into the bottom edge
(nothing extends past the body outline).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

W, H = 260, 240
BODY = (30, 30, 230, 210)
LENS_CX, LENS_CY, LENS_R = 130, 96, 46
USB_BOX = (110, 178, 150, 200)

PORT_EDGES = {
    "USB": ("bottom", 130, 200),
}

im, d = canvas(W, H)

rr(d, BODY, 10, fill=(24, 26, 30), outline=C["edge"], w=2)
for mx, my in ((46, 46), (214, 46)):
    mount_hole(d, mx, my, 6)

circ(d, LENS_CX, LENS_CY, LENS_R, fill=(16, 16, 18), outline=(70, 74, 80), w=4)
circ(d, LENS_CX, LENS_CY, LENS_R * 0.5, fill=(8, 40, 46))
circ(d, LENS_CX, LENS_CY, LENS_R * 0.18, fill=(2, 2, 3))

text(d, (130, 20), "Vision Camera", F(BOLD, 13), C["text"])
text(d, (130, 158), "USB (PhotonVision)", F(REG, 9), C["silk"])

rr(d, USB_BOX, 4, fill=(216, 218, 222), outline=(150, 152, 158), w=1)
rect(d, (USB_BOX[0] + 8, USB_BOX[1] + 6, USB_BOX[2] - 8, USB_BOX[3] - 6), fill=(60, 62, 68))

save(im, os.path.join(HERE, "photonvision.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "photonvision-ports.json"))
