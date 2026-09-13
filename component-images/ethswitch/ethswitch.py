"""Generic 5-port unmanaged Ethernet switch -- legacy component, kept for
teams still running an OpenMesh-style radio without built-in switching
(the VH-109 radio makes this optional). Top view: 2-pin power input,
5x RJ45, per-port link LEDs.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

W, H = 420, 180
BODY = (20, 20, 400, 160)

PWR_X, PWR_Y, TERM_W, TERM_H = 30, 44, 76, 34
ETH_Y, ETH_X0, ETH_PITCH, ETH_W = 44, 140, 46, 38

PORT_EDGES = {
    "PWR+": ("top", PWR_X + TERM_W * 0.28, PWR_Y),
    "PWR-": ("top", PWR_X + TERM_W * 0.72, PWR_Y),
}
for i in range(5):
    PORT_EDGES[f"ETH{i + 1}"] = ("top", ETH_X0 + i * ETH_PITCH + ETH_W / 2, ETH_Y)

im, d = canvas(W, H)

rr(d, BODY, 10, fill=(22, 24, 28), outline=C["edge"], w=2)
for cx, cy in ((36, 142), (384, 142)):
    mount_hole(d, cx, cy, 6)

text(d, (210, 100), "5-PORT SWITCH", F(BOLD, 13), C["text"])
text(d, (210, 118), "unmanaged  ·  optional w/ VH-109", F(REG, 9), C["silk"])

wago(d, (PWR_X, PWR_Y, PWR_X + TERM_W, PWR_Y + TERM_H), holes=2)
text(d, (PWR_X + TERM_W / 2, PWR_Y - 10), "PWR", F(REG, 9), C["silk"])
text(d, (PWR_X + TERM_W * 0.28, PWR_Y + TERM_H + 12), "+", F(BOLD, 11), C["silk"])
text(d, (PWR_X + TERM_W * 0.72, PWR_Y + TERM_H + 12), "-", F(BOLD, 11), C["silk"])

for i in range(5):
    x = ETH_X0 + i * ETH_PITCH
    rj45(d, (x, ETH_Y, x + ETH_W, ETH_Y + TERM_H))
    circ(d, x + ETH_W - 6, ETH_Y - 6, 3, fill=(86, 214, 96))
    text(d, (x + ETH_W / 2, ETH_Y - 12), str(i + 1), F(REG, 9), C["silk"])

save(im, os.path.join(HERE, "ethswitch.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "ethswitch-ports.json"))
