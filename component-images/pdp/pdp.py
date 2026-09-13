"""CTRE Power Distribution Panel (PDP, original -- not PDP 2.0).

Drawn in PORTRAIT orientation: the board is rotated 90 degrees clockwise from
the CTRE product photo so the main battery input sits at the BOTTOM.

That rotation maps the photo's edges as follows:
    photo left end  (roboRIO / VRM / PCM power)  -> TOP
    photo back row  (channels 7..0, left->right) -> RIGHT edge, top->bottom
    photo front row (channels 8..15, left->right)-> LEFT edge, top->bottom
    photo right end (battery, CAN, status)       -> BOTTOM

Channel facts from the CTRE diagram:
    40A channels: 0-3 and 12-15      30A channels: 4-11
Numbering runs continuously around the board -- 0 at one corner up to 7, then
8 through 15 back down the other side.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------- editable ----------------
SLOT_BG, SLOT_TEXT = C["board2"], C["text"]
BREAKERS = {i: {"text": "40A" if i in (0, 1, 2, 3, 12, 13, 14, 15) else "30A",
                "fill": SLOT_BG, "color": SLOT_TEXT} for i in range(16)}
FUSE_20A = {"text": "20A", "fill": (206, 176, 40), "color": (52, 42, 8)}    # VRM/PCM, ATO yellow
FUSE_10A = {"text": "10A", "fill": (188, 54, 46), "color": (250, 232, 228)} # roboRIO, ATO red
LED_STAT, LED_COMM = "green", "off"
CAN_TERM_ON = True

# ---------------- geometry ----------------
W, H = 620, 900
BOARD = (22, 18, 598, 882)

CH_TOP, CH_PITCH, CH_H = 202, 60, 44
LEFT_CH  = [8, 9, 10, 11, 12, 13, 14, 15]   # left edge, top -> bottom
RIGHT_CH = [7, 6, 5, 4, 3, 2, 1, 0]         # right edge, top -> bottom
L_EDGE, R_EDGE = 30, 590

TOP_ROWS = [("roboRIO", 58), ("VRM", 196), ("PCM", 334)]   # x of each connector
TOP_Y = 76
BAT_CX = (438, 528)
BAT_CY = 786
CAN_X0, CAN_PITCH, CAN_Y = 76, 38, 768

PORT_EDGES = {}
for row, ch in enumerate(LEFT_CH):
    y = CH_TOP + row * CH_PITCH
    PORT_EDGES[f"CH{ch}+"] = ("left", L_EDGE, y + 11)
    PORT_EDGES[f"CH{ch}-"] = ("left", L_EDGE, y + 33)
for row, ch in enumerate(RIGHT_CH):
    y = CH_TOP + row * CH_PITCH
    PORT_EDGES[f"CH{ch}+"] = ("right", R_EDGE, y + 11)
    PORT_EDGES[f"CH{ch}-"] = ("right", R_EDGE, y + 33)
for name, x in TOP_ROWS:
    PORT_EDGES[f"{name}+"] = ("top", x + 26, TOP_Y)
    PORT_EDGES[f"{name}-"] = ("top", x + 76, TOP_Y)
PORT_EDGES["BATT+"] = ("bottom", BAT_CX[0], BAT_CY)
PORT_EDGES["BATT-"] = ("bottom", BAT_CX[1], BAT_CY)
for i, n in enumerate(("CAN_H_IN", "CAN_L_IN", "CAN_H_OUT", "CAN_L_OUT")):
    PORT_EDGES[n] = ("bottom", CAN_X0 + i * CAN_PITCH, CAN_Y)

im, d = canvas(W, H)

rr(d, BOARD, 12, fill=C["board"], outline=C["edge"], w=2)
for cx, cy in ((50, 46), (570, 46), (50, 854), (570, 854)):
    mount_hole(d, cx, cy, 10)

# ---- top: dedicated fused outputs ----
for name, x in TOP_ROWS:
    text(d, (x + 51, 58), name.upper() + " POWER", F(BOLD, 10), C["silk"])
    wago(d, (x, TOP_Y, x + 102, TOP_Y + 44), holes=2)
for cfg, y in ((FUSE_10A, TOP_Y), (FUSE_20A, TOP_Y + 52)):
    rr(d, (472, y, 566, y + 38), 4, fill=C["white"], outline=C["white_d"], w=2)
    rect(d, (480, y + 7, 558, y + 31), fill=cfg["fill"])
    text(d, (519, y + 19), cfg["text"], F(BOLD, 13), cfg["color"])
text(d, (519, 58), "FUSES", F(BOLD, 10), C["silk"])
line(d, (30, 178), (590, 178), C["edge"], 2)

# ---- channels ----
f_num = F(BOLD, 13)
for row in range(8):
    y = CH_TOP + row * CH_PITCH
    for ch, wx, bx, tx in ((LEFT_CH[row], L_EDGE, 96, 160),
                           (RIGHT_CH[row], R_EDGE - 56, 468, 426)):
        # red WAGO wire terminal pair (holes stacked toward the board edge)
        rr(d, (wx, y, wx + 56, y + CH_H), 4,
           fill=(178, 44, 38), outline=(126, 28, 24), w=2)
        for k in (11, 33):
            circ(d, wx + 28, y + k, 8, fill=(40, 18, 16))
        # breaker
        cfg = BREAKERS[ch]
        rr(d, (bx, y, bx + 56, y + CH_H), 4, fill=cfg["fill"], outline=C["edge"], w=2)
        rect(d, (bx + 7, y + 5, bx + 49, y + 17), fill=(178, 44, 38))
        if cfg["text"]:
            text(d, (bx + 28, y + 32), cfg["text"], F(BOLD, 12), cfg["color"])
        # green silkscreen channel tag
        rr(d, (tx, y + 9, tx + 34, y + 35), 3, fill=(126, 196, 78))
        text(d, (tx + 17, y + 22), str(ch), f_num, (24, 46, 16))

text(d, (310, 316), "30A   left 8-11   \u00b7   right 4-7", F(REG, 11), C["silk"])
text(d, (310, 556), "40A   left 12-15   \u00b7   right 0-3", F(REG, 11), C["silk"])
text(d, (310, 424), "CTRE", F(BOLD, 14), C["text"])
text(d, (310, 446), "POWER DISTRIBUTION", F(BOLD, 13), C["text"])
text(d, (310, 468), "PANEL", F(BOLD, 13), C["text"])

# ---- bottom: battery, CAN, status ----
line(d, (30, 700), (590, 700), C["edge"], 2)

text(d, (133, 726), "CAN BUS", F(BOLD, 11), C["silk"])
rr(d, (52, 742, 214, 794), 4, fill=C["white"], outline=C["white_d"], w=2)
for i, col in enumerate((C["yellow"], C["canlgrn"], C["yellow"], C["canlgrn"])):
    x = CAN_X0 + i * CAN_PITCH
    rect(d, (x - 12, 750, x + 12, 786), fill=C["board2"])
    rect(d, (x - 12, 798, x + 12, 808), fill=col)

rr(d, (238, 742, 348, 786), 5, fill=C["board2"], outline=C["edge"], w=2)
rect(d, (246, 750, 292, 778), fill=C["orange"] if CAN_TERM_ON else C["grey"])
text(d, (320, 764), "TERM", F(BOLD, 10), C["silk"])
text(d, (293, 800), "CAN TERM. RESISTOR", F(REG, 9), C["silk"])

for i, (lab, st) in enumerate((("STAT", LED_STAT), ("COMM", LED_COMM))):
    x = 84 + i * 64
    col = (86, 214, 96) if st == "green" else C["red"] if st == "red" else (58, 62, 70)
    rr(d, (x, 828, x + 56, 862), 5, fill=col, outline=C["edge"], w=2)
    text(d, (x + 28, 845), lab, F(BOLD, 11), (18, 46, 16) if st != "off" else C["silk"])

text(d, (483, 726), "MAIN BATTERY INPUT", F(BOLD, 11), C["silk"])
for cx, pos, sign in ((BAT_CX[0], True, "+"), (BAT_CX[1], False, "-")):
    bolt_lug(d, cx, BAT_CY, 26, positive=pos)
    text(d, (cx, BAT_CY + 52), sign, F(BOLD, 20), C["silk"])

text(d, (310, 872), "WWW.CROSSTHEROADELECTRONICS.COM", F(REG, 8), (108, 168, 96))

save(im, os.path.join(HERE, "pdp.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "pdp-ports.json"))