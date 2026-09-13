"""Vivid-Hosting VH-109 FRC radio -- replaces the OpenMesh radio. Has 4
built-in Ethernet ports (roboRIO, coprocessors, driver station uplink)
so it needs neither a separate Ethernet switch nor the VRM to power one.

Redrawn against a real product photo (3/4 view of the glossy black
case): a column of small status LEDs runs down the left edge, and the
connectors -- Ethernet ports plus a small power connector -- sit along
the bottom edge, inset within the case outline (nothing hangs below
the body).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------- editable ----------------
LEDS = ["green", "green", "off", "off", "off"]

W, H = 420, 280
BODY = (20, 20, 400, 260)

LED_X, LED_Y0, LED_PITCH = 46, 66, 26

PWR_X, PWR_Y, TERM_W, TERM_H = 100, 200, 66, 30
ETH_Y, ETH_X0, ETH_PITCH, ETH_W, ETH_H = 200, 200, 44, 36, 30

PORT_EDGES = {
    "PWR+": ("bottom", PWR_X + TERM_W * 0.28, PWR_Y + TERM_H),
    "PWR-": ("bottom", PWR_X + TERM_W * 0.72, PWR_Y + TERM_H),
}
for i in range(4):
    PORT_EDGES[f"ETH{i + 1}"] = ("bottom", ETH_X0 + i * ETH_PITCH + ETH_W / 2, ETH_Y + ETH_H)

im, d = canvas(W, H)

rr(d, BODY, 14, fill=(18, 19, 22), outline=(6, 6, 8), w=2)
rr(d, (BODY[0] + 6, BODY[1] + 6, BODY[2] - 6, BODY[3] - 6), 10, fill=(26, 27, 31))

text(d, (232, 56), "VH-109", F(BOLD, 18), C["text"])
text(d, (232, 80), "Vivid-Hosting  ·  FRC Radio", F(REG, 10), C["silk"])

# status LED column, left edge (inset)
for i in range(5):
    y = LED_Y0 + i * LED_PITCH
    st = LEDS[i] if i < len(LEDS) else "off"
    col = (86, 214, 96) if st == "green" else C["red"] if st == "red" else (46, 48, 54)
    circ(d, LED_X, y, 6, fill=col, outline=(10, 11, 13), w=1)

# power terminal, inset above the bottom edge
wago(d, (PWR_X, PWR_Y, PWR_X + TERM_W, PWR_Y + TERM_H), holes=2)
text(d, (PWR_X + TERM_W / 2, PWR_Y - 10), "PWR IN", F(REG, 9), C["silk"])
text(d, (PWR_X + TERM_W * 0.28, PWR_Y + TERM_H + 10), "+", F(BOLD, 10), C["silk"])
text(d, (PWR_X + TERM_W * 0.72, PWR_Y + TERM_H + 10), "-", F(BOLD, 10), C["silk"])

# 4 ethernet ports, inset above the bottom edge
for i in range(4):
    x = ETH_X0 + i * ETH_PITCH
    rj45(d, (x, ETH_Y, x + ETH_W, ETH_Y + ETH_H))
    text(d, (x + ETH_W / 2, ETH_Y - 10), f"ETH{i + 1}", F(REG, 9), C["silk"])

for cx, cy in ((374, 60), (374, 170)):
    circ(d, cx, cy, 10, fill=(46, 48, 54), outline=(20, 21, 24), w=2)
    circ(d, cx, cy, 4, fill=(200, 202, 206))
    text(d, (cx, cy + 20 if cy < 100 else cy - 20), "ANT", F(REG, 8), C["silk"])

save(im, os.path.join(HERE, "radio.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "radio-ports.json"))
