"""NI roboRIO 2.0 -- FRC main robot controller.

Top view, redrawn against a real product photo. Layout, corner to
corner:
  top edge, left->right:   CAN (2-pin), DC power IN (V+/V-, 2-pin),
                            USB-B device port, 4x USB-A host (2x2),
                            Ethernet, SPI (small header, decorative)
  right edge:               status LED column (POWER/STATUS/RADIO/
                            COMM/MODE/RSL), then a 10-pin PWM header
  left edge:                I2C header, RS-232 header (both
                            decorative), then a 10-pin DIO header
  bottom edge, left->right: RSL (2-pin), RELAY (4 x fwd/rev = 8 pins),
                            ANALOG IN (4-pin), small expansion header
  center:                   NI / LabVIEW branding, MXP expansion strip

I2C, RS-232 and SPI are drawn for realism but not broken into
individual wire ports (rarely field-wired in FRC). DIO/PWM channel
order (which physical pin is index 0) is drawn top-to-bottom,
left-column-then-right-column, matching the photo's visual flow -- not
yet cross-checked against the NI pinout diagram pin-for-pin.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from style import *

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------- editable ----------------
LED_POWER, LED_STATUS, LED_RADIO, LED_COMM, LED_MODE, LED_RSL = \
    "green", "green", "off", "off", "off", "off"

# ---------------- geometry ----------------
W, H = 680, 620
BOARD = (20, 14, 660, 606)

TOP_Y, TOP_H = 50, 34
CAN_X = 42
VIN_X = 122
USBB_X = 190
USBA_X0, USBA_PITCH = 236, 40
ETH_X = 372
SPI_X = 560

LED_X, LED_Y0, LED_PITCH = 596, 96, 34
PWM_X0, PWM_Y0, PWM_COLS, PWM_ROWS, PWM_PITCH = 588, 320, 2, 5, 24

I2C_X, I2C_Y = 40, 100
RS232_X, RS232_Y = 40, 148
DIO_X0, DIO_Y0, DIO_COLS, DIO_ROWS, DIO_PITCH = 40, 216, 2, 5, 24

RSL_X, RSL_Y = 40, 560
RELAY_X0, RELAY_Y = 150, 566
AI_X0, AI_Y = 370, 566
EXP_X, EXP_Y = 560, 560

MXP = (200, 456, 480, 496)

PORT_EDGES = {
    "CAN_H": ("top", CAN_X + 16, TOP_Y),
    "CAN_L": ("top", CAN_X + 44, TOP_Y),
    "V+": ("top", VIN_X + 12, TOP_Y),
    "V-": ("top", VIN_X + 34, TOP_Y),
    "USB_DEVICE": ("top", USBB_X + 17, TOP_Y),
    "ETH": ("top", ETH_X + 22, TOP_Y),
}
for i in range(4):
    PORT_EDGES[f"USB_HOST{i + 1}"] = ("top", USBA_X0 + i * USBA_PITCH + 17, TOP_Y)
for i in range(6):
    pass  # LEDs are indicators, not wire ports
for r in range(PWM_ROWS):
    for c in range(PWM_COLS):
        idx = r * PWM_COLS + c
        PORT_EDGES[f"PWM{idx}"] = ("right", PWM_X0 + c * 26, PWM_Y0 + r * PWM_PITCH)
for r in range(DIO_ROWS):
    for c in range(DIO_COLS):
        idx = r * DIO_COLS + c
        PORT_EDGES[f"DIO{idx}"] = ("left", DIO_X0 + c * 26, DIO_Y0 + r * DIO_PITCH)
PORT_EDGES["RSL+"] = ("bottom", RSL_X + 10, RSL_Y + 20)
PORT_EDGES["RSL-"] = ("bottom", RSL_X + 32, RSL_Y + 20)
for i in range(4):
    for j, suf in enumerate(("F", "R")):
        PORT_EDGES[f"RELAY{i}_{suf}"] = ("bottom", RELAY_X0 + (2 * i + j) * 22, RELAY_Y + 16)
for i in range(4):
    PORT_EDGES[f"AI{i}"] = ("bottom", AI_X0 + i * 22, AI_Y + 16)
PORT_EDGES["I2C_SDA"] = ("left", I2C_X + 10, I2C_Y)
PORT_EDGES["I2C_SCL"] = ("left", I2C_X + 30, I2C_Y)

im, d = canvas(W, H)

rr(d, BOARD, 16, fill=(48, 50, 54), outline=(24, 25, 28), w=3)
for tx, ty in ((44, 40), (636, 40), (44, 580), (636, 580)):
    mount_hole(d, tx, ty, 8)

# ---- top edge connectors ----
wago(d, (CAN_X, TOP_Y, CAN_X + 60, TOP_Y + TOP_H), holes=2)
text(d, (CAN_X + 30, TOP_Y - 10), "CAN", F(REG, 9), C["silk"])

wago(d, (VIN_X, TOP_Y, VIN_X + 44, TOP_Y + TOP_H), holes=2)
text(d, (VIN_X + 22, TOP_Y - 10), "V+  V-", F(REG, 8), C["silk"])

usb(d, (USBB_X, TOP_Y, USBB_X + 34, TOP_Y + TOP_H), kind="B")
text(d, (USBB_X + 17, TOP_Y - 10), "USB", F(REG, 9), C["silk"])

for i in range(4):
    x = USBA_X0 + i * USBA_PITCH
    usb(d, (x, TOP_Y, x + 34, TOP_Y + TOP_H), kind="A")
text(d, (USBA_X0 + 1.5 * USBA_PITCH, TOP_Y - 10), "USB HOST x4", F(REG, 9), C["silk"])

rj45(d, (ETH_X, TOP_Y, ETH_X + 44, TOP_Y + TOP_H))
text(d, (ETH_X + 22, TOP_Y - 10), "ETHERNET", F(REG, 9), C["silk"])

pin_header(d, SPI_X, TOP_Y + TOP_H / 2, 2, 16, horizontal=True)
text(d, (SPI_X + 8, TOP_Y - 10), "SPI", F(REG, 9), C["silk"])

# ---- right edge: LEDs then PWM ----
for i, (lab, st) in enumerate((("POWER", LED_POWER), ("STATUS", LED_STATUS), ("RADIO", LED_RADIO),
                                ("COMM", LED_COMM), ("MODE", LED_MODE), ("RSL", LED_RSL))):
    y = LED_Y0 + i * LED_PITCH
    col = (86, 214, 96) if st == "green" else C["red"] if st == "red" else (30, 32, 36)
    circ(d, LED_X, y, 7, fill=col, outline=(20, 21, 24), w=1)
    text(d, (LED_X + 14, y), lab, F(REG, 9), C["silk"], anchor="lm")

text(d, (PWM_X0 + 13, PWM_Y0 - 18), "PWM", F(BOLD, 10), C["silk"])
for r in range(PWM_ROWS):
    for c in range(PWM_COLS):
        idx = r * PWM_COLS + c
        gx, gy = PWM_X0 + c * 26, PWM_Y0 + r * PWM_PITCH
        pin_header(d, gx, gy, 1, PWM_PITCH)
        text(d, (gx, gy + 13), str(idx), F(REG, 8), C["silk"])

# ---- left edge: I2C, RS-232, DIO ----
pin_header(d, I2C_X, I2C_Y, 2, 20, horizontal=True)
text(d, (I2C_X, I2C_Y - 12), "I2C", F(REG, 9), C["silk"])

pin_header(d, RS232_X, RS232_Y, 2, 20, horizontal=True)
text(d, (RS232_X, RS232_Y - 12), "RS-232", F(REG, 9), C["silk"])

text(d, (DIO_X0 + 13, DIO_Y0 - 18), "DIO", F(BOLD, 10), C["silk"])
for r in range(DIO_ROWS):
    for c in range(DIO_COLS):
        idx = r * DIO_COLS + c
        gx, gy = DIO_X0 + c * 26, DIO_Y0 + r * DIO_PITCH
        pin_header(d, gx, gy, 1, DIO_PITCH)
        text(d, (gx, gy + 13), str(idx), F(REG, 8), C["silk"])

# ---- bottom edge: RSL, RELAY, ANALOG IN, expansion ----
wago(d, (RSL_X, RSL_Y, RSL_X + 42, RSL_Y + 32), holes=2)
text(d, (RSL_X + 21, RSL_Y - 10), "RSL", F(REG, 9), C["silk"])

text(d, (RELAY_X0 + 66, RELAY_Y - 12), "RELAY", F(BOLD, 10), C["silk"])
for i in range(4):
    for j, suf in enumerate(("F", "R")):
        gx = RELAY_X0 + (2 * i + j) * 22
        pin_header(d, gx, RELAY_Y + 16, 1, 22)
        text(d, (gx, RELAY_Y + 32), f"{i}{suf}", F(REG, 7), C["silk"])

text(d, (AI_X0 + 33, AI_Y - 12), "ANALOG IN", F(BOLD, 10), C["silk"])
for i in range(4):
    gx = AI_X0 + i * 22
    pin_header(d, gx, AI_Y + 16, 1, 22)
    text(d, (gx, AI_Y + 32), str(i), F(REG, 7), C["silk"])

pin_header(d, EXP_X, EXP_Y + 16, 2, 16, horizontal=True)

# ---- center branding ----
cx, cy = 340, 260
text(d, (cx, cy - 20), "NI roboRIO", F(BOLD, 22), C["text"])
circ(d, cx, cy + 40, 34, fill=(28, 30, 34), outline=(70, 74, 82), w=2)
poly(d, [(cx - 12, cy + 24), (cx - 12, cy + 56), (cx + 16, cy + 40)], fill=(220, 222, 226))
text(d, (cx, cy + 92), "NATIONAL INSTRUMENTS", F(BOLD, 12), C["silk"])
text(d, (cx, cy + 110), "LabVIEW", F(REG, 10), (150, 154, 160))

rr(d, MXP, 4, fill=(20, 21, 24), outline=(8, 9, 10), w=2)
text(d, ((MXP[0] + MXP[2]) / 2, MXP[1] - 10), "MXP", F(REG, 9), C["silk"])

save(im, os.path.join(HERE, "roborio.png"), W)
dump_ports(PORT_EDGES, os.path.join(HERE, "roborio-ports.json"))
