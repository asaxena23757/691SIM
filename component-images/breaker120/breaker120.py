"""120A main circuit breaker -- Cooper Bussmann / Eaton 285120, HI-AMP series.

Robot main power switch + downstream wiring protection. Wired in series with
the battery POSITIVE lead, between battery and the power distribution board.

Top view, drawn from the 285120 product photo:
  - Two silver hex-head studs on DIAGONALLY OPPOSITE edges (not the same edge).
  - Yellow RESET lever in the centre (this is the manual switch).
  - Small red trip / manual-off button beside it.
  - Two mounting holes, also diagonally placed.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------- editable ----------------
RATING    = "120A"
PART_TEXT = "285120  \u00b7  WATERPROOF"
BRAND     = "HI-AMP  Buss\u00ae"
TRIPPED   = False        # True swings the RESET lever down and lights the button

W, H = 620, 580
BODY = (96, 96, 524, 484)
INNER = (170, 148, 452, 432)

STUD_TOP_CX, STUD_TOP_CY = 246, 74       # top edge stud
STUD_BOT_CX, STUD_BOT_CY = 374, 506      # bottom edge stud

PORT_EDGES = {
    "STUD_BATT": ("top", STUD_TOP_CX, 40),      # from battery (+)
    "STUD_LOAD": ("bottom", STUD_BOT_CX, 540),  # to PDH / PDP (+) input
}
# Resolved:  STUD_BATT top 246, 40      STUD_LOAD bottom 374, 540

im, d = canvas(W, H)

# base plate
rr(d, BODY, 12, fill=(32, 33, 38), outline=C["edge"], w=2)
mount_hole(d, 132, 154, 20)
mount_hole(d, 488, 426, 20)

# raised centre body
rr(d, INNER, 10, fill=(44, 46, 52), outline=(62, 66, 74), w=2)

# terminal studs on opposite edges
for cx, cy, plate in ((STUD_TOP_CX, STUD_TOP_CY, (196, 40, 296, 152)),
                      (STUD_BOT_CX, STUD_BOT_CY, (324, 428, 424, 540))):
    rr(d, plate, 8, fill=(150, 154, 162), outline=(104, 108, 116), w=2)
    hex_bolt(d, cx, cy, 28)
text(d, (246, 176), "BAT", F(BOLD, 13), C["silk"])
text(d, (374, 404), "LOAD", F(BOLD, 13), C["silk"])

# diagonal moulded ridge
poly(d, [(186, 352), (386, 196), (404, 218), (204, 374)], fill=(38, 40, 46))

# ---- yellow RESET lever ----
if TRIPPED:
    lever_pts = [(214, 330), (330, 330), (330, 366), (214, 366)]      # swung down
else:
    lever_pts = [(214, 344), (322, 274), (344, 306), (236, 376)]      # raised
poly(d, lever_pts, fill=(226, 190, 44), outline=(168, 138, 24), w=2)
text(d, (279, 325), "RESET", F(BOLD, 12), (72, 58, 8))

# ---- red trip button ----
btn = (232, 62, 52) if TRIPPED else (176, 40, 34)
rr(d, (376, 208, 424, 286), 8, fill=btn, outline=(112, 26, 22), w=2)
rect(d, (386, 220, 414, 226), fill=(224, 96, 86))

text(d, (300, 214), BRAND, F(BOLD, 15), (198, 168, 72))
text(d, (300, 240), RATING, F(BOLD, 22), (208, 178, 80))
text(d, (238, 458), PART_TEXT, F(REG, 12), (172, 148, 70))
text(d, (310, 562), "in series with battery (+)", F(REG, 12), C["silk"])

save(im, os.path.join(HERE, "breaker120.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "breaker120-ports.json"))