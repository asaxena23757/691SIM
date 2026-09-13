"""FRC robot battery -- 12V 18Ah sealed lead acid.

Multiple part numbers are legal (MK ES17-12, Duracell DURA12-18NB, etc.);
the game manual carries the current approved list. Front view, terminals up.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------- editable ----------------
CAPACITY   = "18Ah"
NOMINAL_V  = "12V"
LABEL_LINE = "SEALED LEAD ACID"
STATE_TEXT = ""           # e.g. "CHARGED"; "" leaves it blank
CASE_COLOR = (38, 40, 46)

W, H = 620, 480
POST_Y0, POST_Y1 = 62, 132
POST_W = 62
POS_CX, NEG_CX = 178, 442
CASE = (58, 128, 562, 448)

PORT_EDGES = {
    "BATT+": ("top", POS_CX, POST_Y0),
    "BATT-": ("top", NEG_CX, POST_Y0),
}
# Resolved:  BATT+ top 178, 62      BATT- top 442, 62

im, d = canvas(W, H)

rr(d, CASE, 10, fill=CASE_COLOR, outline=C["edge"], w=2)
rect(d, (58, 128, 562, 186), fill=(48, 51, 58))
line(d, (58, 186), (562, 186), C["edge"], 2)

for cx, pos, sign in ((POS_CX, True, "+"), (NEG_CX, False, "-")):
    col = C["posred"] if pos else C["black"]
    rr(d, (cx - POST_W / 2, POST_Y0, cx + POST_W / 2, POST_Y1), 6,
       fill=col, outline=C["edge"], w=2)
    circ(d, cx, POST_Y0 + 20, 15, fill=C["brass"], outline=C["brass_d"], w=2)
    circ(d, cx, POST_Y0 + 20, 7, fill=C["board2"])
    text(d, (cx, 158), sign, F(BOLD, 26), C["text"])

rr(d, (112, 224, 508, 400), 6, fill=C["cream"], outline=(180, 176, 166), w=2)
text(d, (310, 268), NOMINAL_V + "  " + CAPACITY, F(BOLD, 40), (40, 42, 48))
text(d, (310, 312), LABEL_LINE, F(REG, 16), (86, 90, 96))
line(d, (150, 336), (470, 336), (190, 186, 176), 2)
text(d, (310, 364), "FRC ROBOT BATTERY", F(BOLD, 15), (110, 114, 120))
if STATE_TEXT:
    text(d, (310, 424), STATE_TEXT, F(BOLD, 15), C["silk"])

save(im, os.path.join(HERE, "battery.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "battery-ports.json"))