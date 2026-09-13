"""REV Power Distribution Hub (PDH).

Per REV / WPILib docs: 20 high-current channels (40A max, ch 0-19),
3 low-current channels (15A max, ch 20-22), and 1 SWITCHABLE low-current
channel (ch 23). Toolless WAGO lever terminals, LED voltage display,
CAN and USB-C for the REV Hardware Client.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

# =============================================================================
#  EDITABLE VALUES
# =============================================================================
BATTERY_VOLTAGE = "xx.x"

SLOT_BG   = C["board2"]
SLOT_TEXT = C["text"]

# Fuse / breaker slot contents.
#   text  : string drawn inside the slot ("" leaves it blank)
#   fill  : slot interior color   color : text color
# 0-19 high current (40A max), 20-22 low current (15A max), 23 switchable.
FUSE_SLOTS = {i: {"text": "40A", "fill": SLOT_BG, "color": SLOT_TEXT} for i in range(20)}
for i in range(20, 24):
    FUSE_SLOTS[i] = {"text": "15A", "fill": SLOT_BG, "color": SLOT_TEXT}

# =============================================================================
#  GEOMETRY CONSTANTS (design units; PNG saved 1:1 so these are pixels)
# =============================================================================
W, H = 620, 1400
BOARD = (20, 14, 600, 1386)

HC_TOP, HC_PITCH = 82, 98
HC_LEVER_H = 38
HC_LEFT_EDGE, HC_RIGHT_EDGE = 26, 594

LC_TOP, LC_PITCH = 1094, 42
LC_LEVER_H = 17
LC_LEFT_EDGE = 26

EY0, EY1 = 1284, 1372
USBC_CX = 103
CAN_X0, CAN_PITCH, CAN_W = 160, 48, 40
BAT_X0, BAT_PITCH, BAT_W = 420, 68, 60

# =============================================================================
#  PORT EDGE COORDINATES -- wire attachment points, derived from the constants
#  above so they can't drift from the drawing. Format: (side, x, y).
#  Channels 0-9 and 20-23 exit LEFT, 10-19 exit RIGHT, rest exit BOTTOM.
#  "+" is the upper lever of each pair (verify against a real board).
# =============================================================================
PORT_EDGES = {}
for i in range(10):
    y_top = HC_TOP + i * HC_PITCH
    PORT_EDGES[f"CH{i}+"]      = ("left",  HC_LEFT_EDGE,  y_top + HC_LEVER_H / 2)
    PORT_EDGES[f"CH{i}-"]      = ("left",  HC_LEFT_EDGE,  y_top + 44 + HC_LEVER_H / 2)
    PORT_EDGES[f"CH{i + 10}+"] = ("right", HC_RIGHT_EDGE, y_top + HC_LEVER_H / 2)
    PORT_EDGES[f"CH{i + 10}-"] = ("right", HC_RIGHT_EDGE, y_top + 44 + HC_LEVER_H / 2)
for i in range(4):
    y_top = LC_TOP + i * LC_PITCH
    PORT_EDGES[f"CH{i + 20}+"] = ("left", LC_LEFT_EDGE, y_top + LC_LEVER_H / 2)
    PORT_EDGES[f"CH{i + 20}-"] = ("left", LC_LEFT_EDGE, y_top + 20 + LC_LEVER_H / 2)
PORT_EDGES["USB-C"] = ("bottom", USBC_CX, EY1)
for i, name in enumerate(["CAN_H_IN", "CAN_L_IN", "CAN_H_OUT", "CAN_L_OUT"]):
    PORT_EDGES[name] = ("bottom", CAN_X0 + i * CAN_PITCH + CAN_W / 2, EY1)
PORT_EDGES["BATT+"] = ("bottom", BAT_X0 + BAT_W / 2, EY1)
PORT_EDGES["BATT-"] = ("bottom", BAT_X0 + BAT_PITCH + BAT_W / 2, EY1)

# Resolved values, for reference without running the file:
#
#   CH0+  left    26.0,  101.0     CH10+ right  594.0,  101.0
#   CH0-  left    26.0,  145.0     CH10- right  594.0,  145.0
#   CH1+  left    26.0,  199.0     CH11+ right  594.0,  199.0
#   CH1-  left    26.0,  243.0     CH11- right  594.0,  243.0
#   CH2+  left    26.0,  297.0     CH12+ right  594.0,  297.0
#   CH2-  left    26.0,  341.0     CH12- right  594.0,  341.0
#   CH3+  left    26.0,  395.0     CH13+ right  594.0,  395.0
#   CH3-  left    26.0,  439.0     CH13- right  594.0,  439.0
#   CH4+  left    26.0,  493.0     CH14+ right  594.0,  493.0
#   CH4-  left    26.0,  537.0     CH14- right  594.0,  537.0
#   CH5+  left    26.0,  591.0     CH15+ right  594.0,  591.0
#   CH5-  left    26.0,  635.0     CH15- right  594.0,  635.0
#   CH6+  left    26.0,  689.0     CH16+ right  594.0,  689.0
#   CH6-  left    26.0,  733.0     CH16- right  594.0,  733.0
#   CH7+  left    26.0,  787.0     CH17+ right  594.0,  787.0
#   CH7-  left    26.0,  831.0     CH17- right  594.0,  831.0
#   CH8+  left    26.0,  885.0     CH18+ right  594.0,  885.0
#   CH8-  left    26.0,  929.0     CH18- right  594.0,  929.0
#   CH9+  left    26.0,  983.0     CH19+ right  594.0,  983.0
#   CH9-  left    26.0, 1027.0     CH19- right  594.0, 1027.0
#
#   CH20+ left    26.0, 1102.5     CH22+ left    26.0, 1186.5
#   CH20- left    26.0, 1122.5     CH22- left    26.0, 1206.5
#   CH21+ left    26.0, 1144.5     CH23+ left    26.0, 1228.5
#   CH21- left    26.0, 1164.5     CH23- left    26.0, 1248.5
#
#   USB-C     bottom  103.0, 1372     CAN_H_OUT bottom  276.0, 1372
#   CAN_H_IN  bottom  180.0, 1372     CAN_L_OUT bottom  324.0, 1372
#   CAN_L_IN  bottom  228.0, 1372     BATT+     bottom  450.0, 1372
#                                     BATT-     bottom  518.0, 1372

# =============================================================================
#  DRAWING
# =============================================================================
im, d = canvas(W, H)


def slot(ch, outer, inner, fsize):
    cfg = FUSE_SLOTS.get(ch, {"text": "", "fill": SLOT_BG, "color": SLOT_TEXT})
    rr(d, outer, 5 if fsize > 12 else 4, fill=C["white"], outline=C["white_d"], w=2)
    rect(d, inner, fill=cfg["fill"])
    if cfg["text"]:
        text(d, ((inner[0] + inner[2]) / 2, (inner[1] + inner[3]) / 2),
             cfg["text"], F(BOLD, fsize), cfg["color"])


rr(d, BOARD, 14, fill=C["board"], outline=C["edge"], w=2)
for (tx, ty) in [(20, 14), (556, 14), (20, 1342), (556, 1342)]:
    rr(d, (tx, ty, tx + 44, ty + 44), 10, fill=C["orange_d"])
    circ(d, tx + 22, ty + 22, 9, fill=C["board2"])

rect(d, (20, 58, 600, 60), fill=C["edge"])
text(d, (80, 36), "REV", F(BOLD, 17), C["orange"], anchor="lm")
text(d, (542, 36), "POWER DISTRIBUTION HUB", F(BOLD, 14), C["text"], anchor="rm")

f_ch = F(MONO, 13)
for i in range(10):
    y = HC_TOP + i * HC_PITCH
    for yy in (y, y + 44):
        lever(d, (HC_LEFT_EDGE, yy, 112, yy + HC_LEVER_H))
        lever(d, (508, yy, HC_RIGHT_EDGE, yy + HC_LEVER_H))
    ly = y + 20
    slot(i, (146, ly, 288, ly + 42), (156, ly + 10, 278, ly + 32), 15)
    text(d, (130, ly + 21), str(i), f_ch, C["silk"], anchor="rm")
    slot(i + 10, (332, ly, 474, ly + 42), (342, ly + 10, 464, ly + 32), 15)
    text(d, (490, ly + 21), str(i + 10), f_ch, C["silk"], anchor="lm")

rect(d, (20, 1068, 600, 1070), fill=C["edge"])

text(d, (26, 1082), "LOW CURRENT", F(REG, 10), C["silk"], anchor="lm")
f_sm = F(MONO, 12)
for i in range(4):
    y = LC_TOP + i * LC_PITCH
    lever(d, (LC_LEFT_EDGE, y, 96, y + LC_LEVER_H), r=4)
    lever(d, (LC_LEFT_EDGE, y + 20, 96, y + 20 + LC_LEVER_H), r=4)
    slot(i + 20, (106, y + 2, 168, y + 35), (113, y + 9, 161, y + 28), 11)
    text(d, (178, y + 18), str(20 + i), f_sm, C["silk"], anchor="lm")
    if i == 3:
        text(d, (198, y + 18), "SW", F(BOLD, 10), C["orange"], anchor="lm")

rr(d, (296, 1090, 464, 1180), 8, fill=C["reddark"], outline=C["edge"], w=2)
text(d, (380, 1133), BATTERY_VOLTAGE, F(MONO, 40), C["red"])
text(d, (380, 1194), "BATTERY VOLTAGE", F(REG, 10), C["silk"])

rr(d, (500, 1094, 572, 1160), 6, fill=C["black"], outline=C["grey"], w=2)
rect(d, (516, 1106, 556, 1132), fill=C["orange"])
text(d, (536, 1146), "ON", F(BOLD, 11), C["silk"])
text(d, (536, 1176), "SWITCH", F(REG, 10), C["silk"])

text(d, (USBC_CX, 1268), "USB-C", F(REG, 10), C["silk"])
rr(d, (82, EY0, 124, EY1), 6, fill=C["board2"], outline=C["grey"], w=2)
rr(d, (94, EY0 + 14, 112, EY1 - 14), 9, fill=C["black"], outline=C["grey"], w=2)
rect(d, (100, EY0 + 22, 106, EY1 - 22), fill=C["grey"])

text(d, (252, 1250), "CAN", F(BOLD, 11), C["silk"])
for i, (col, lab) in enumerate([(C["yellow"], "H"), (C["canlgrn"], "L"),
                                (C["yellow"], "H"), (C["canlgrn"], "L")]):
    x = CAN_X0 + i * CAN_PITCH
    text(d, (x + CAN_W / 2, 1268), lab, F(BOLD, 11), C["silk"])
    lever(d, (x, EY0, x + CAN_W, EY1), r=6, vertical=True)
    rr(d, (x + 8, EY1 - 26, x + CAN_W - 8, EY1 - 10), 3, fill=col)

text(d, (484, 1268), "BATTERY INPUT", F(REG, 10), C["silk"])
for i, sign in enumerate(("+", "-")):
    x = BAT_X0 + i * BAT_PITCH
    lever(d, (x, EY0, x + BAT_W, EY1), r=7, vertical=True)
    text(d, (x + BAT_W / 2, EY1 - 22), sign, F(BOLD, 24), (60, 28, 6))

save(im, os.path.join(HERE, "pdh.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "pdh-ports.json"))