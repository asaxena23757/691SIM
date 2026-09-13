"""CTRE SystemCore -- announced successor to the roboRIO for the 2027 FRC
season. Runs Linux on an embedded SoC instead of the roboRIO's FPGA.

SPECULATIVE / PLACEHOLDER: full pinout has not been published at the time
this was drawn. Modeled as a Linux-class controller with dual Ethernet
(no external radio needed the way roboRIO does), CAN FD, USB-C power and
data, and a reduced DIO/PWM header versus roboRIO. Update this file once
CTRE publishes final mechanical/electrical specs.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------- editable ----------------
LED_PWR, LED_STATUS, LED_CANFD = "green", "green", "off"

# ---------------- geometry ----------------
W, H = 620, 700
BOARD = (20, 14, 600, 686)

TERM_Y, TERM_H, TERM_W = 60, 40, 110
PWR_X, CAN_X = 76, 264

CHIP = (150, 176, 470, 320)

EDGE_X0, EDGE_W, EDGE_H = 552, 40, 40
ETH1_Y, ETH2_Y, USBC_Y = 176, 232, 288

HDR_X0, HDR_PITCH = 150, 30
DIO_Y, PWM_Y = 400, 452

PORT_EDGES = {
    "PWR+": ("top", PWR_X + TERM_W * 0.28, TERM_Y),
    "PWR-": ("top", PWR_X + TERM_W * 0.72, TERM_Y),
    "CAN_H": ("top", CAN_X + TERM_W * 0.28, TERM_Y),
    "CAN_L": ("top", CAN_X + TERM_W * 0.72, TERM_Y),
    "ETH1": ("right", EDGE_X0 + EDGE_W, ETH1_Y + EDGE_H / 2),
    "ETH2": ("right", EDGE_X0 + EDGE_W, ETH2_Y + EDGE_H / 2),
    "USB_C": ("right", EDGE_X0 + EDGE_W, USBC_Y + EDGE_H / 2),
}
for i in range(8):
    PORT_EDGES[f"DIO{i}"] = ("bottom", HDR_X0 + i * HDR_PITCH, DIO_Y)
for i in range(8):
    PORT_EDGES[f"PWM{i}"] = ("bottom", HDR_X0 + i * HDR_PITCH, PWM_Y)

im, d = canvas(W, H)

rr(d, BOARD, 14, fill=(22, 24, 30), outline=C["edge"], w=2)
for tx, ty in ((46, 40), (574, 40), (46, 660), (574, 660)):
    mount_hole(d, tx, ty, 9)

text(d, (310, 36), "CTRE SystemCore", F(BOLD, 17), C["text"])

for x, label in ((PWR_X, "PWR IN"), (CAN_X, "CAN FD")):
    text(d, (x + TERM_W / 2, TERM_Y - 10), label, F(REG, 10), C["silk"])
    wago(d, (x, TERM_Y, x + TERM_W, TERM_Y + TERM_H), holes=2)
text(d, (PWR_X + 27, TERM_Y + TERM_H + 14), "+", F(BOLD, 13), C["silk"])
text(d, (PWR_X + 83, TERM_Y + TERM_H + 14), "-", F(BOLD, 13), C["silk"])
text(d, (CAN_X + 27, TERM_Y + TERM_H + 14), "H", F(BOLD, 12), C["silk"])
text(d, (CAN_X + 83, TERM_Y + TERM_H + 14), "L", F(BOLD, 12), C["silk"])

for y, label in ((ETH1_Y, "ETH1"), (ETH2_Y, "ETH2")):
    rj45(d, (EDGE_X0, y, EDGE_X0 + EDGE_W, y + EDGE_H))
    text(d, (EDGE_X0 - 8, y + EDGE_H / 2), label, F(REG, 10), C["silk"], anchor="rm")
rr(d, (EDGE_X0, USBC_Y, EDGE_X0 + EDGE_W, USBC_Y + EDGE_H), 6,
   fill=(216, 218, 222), outline=(150, 152, 158), w=1)
rect(d, (EDGE_X0 + 8, USBC_Y + 14, EDGE_X0 + EDGE_W - 8, USBC_Y + EDGE_H - 14), fill=(60, 62, 68))
text(d, (EDGE_X0 - 8, USBC_Y + EDGE_H / 2), "USB-C", F(REG, 10), C["silk"], anchor="rm")

rr(d, CHIP, 8, fill=(18, 20, 24), outline=C["edge"], w=2)
text(d, (310, 226), "Linux SoC", F(BOLD, 14), (90, 94, 102))
text(d, (310, 258), "SYSTEMCORE", F(BOLD, 22), C["text"])
text(d, (310, 286), "Cross The Road Electronics", F(REG, 11), C["silk"])

for i, (lab, st) in enumerate((("PWR", LED_PWR), ("STATUS", LED_STATUS), ("CAN FD", LED_CANFD))):
    cx = 250 + i * 70
    col = (86, 214, 96) if st == "green" else C["red"] if st == "red" else (52, 55, 61)
    circ(d, cx, 350, 10, fill=col, outline=C["edge"], w=1)
    text(d, (cx, 372), lab, F(REG, 9), C["silk"])

text(d, (HDR_X0 - 16, DIO_Y), "DIO", F(BOLD, 11), C["silk"], anchor="rm")
for i in range(8):
    gx = HDR_X0 + i * HDR_PITCH
    pin_header(d, gx, DIO_Y, 1, HDR_PITCH)
    text(d, (gx, DIO_Y + 16), str(i), F(REG, 8), C["silk"])
text(d, (HDR_X0 - 16, PWM_Y), "PWM", F(BOLD, 11), C["silk"], anchor="rm")
for i in range(8):
    gx = HDR_X0 + i * HDR_PITCH
    pin_header(d, gx, PWM_Y, 1, HDR_PITCH)
    text(d, (gx, PWM_Y + 16), str(i), F(REG, 8), C["silk"])

text(d, (310, 520), "SPECULATIVE -- 2027 season, pinout not yet finalized", F(REG, 11), C["orange"])

save(im, os.path.join(HERE, "systemcore.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "systemcore-ports.json"))
