"""Shared drawing helpers for the 691SIM flat top-down component diagrams.

Coordinate system: every part file writes coordinates in DESIGN UNITS at
1:1 with its own declared canvas size (W, H). canvas() allocates a PIL
image at S times that size so everything is drawn oversized, and save()
shrinks it back down with LANCZOS resampling for anti-aliased edges.

Palette C, font loader F(), the primitive wrappers (rr, rect, circ, text,
line, poly), the connector primitives (lever, wago, bolt_lug, hex_bolt,
mount_hole, breaker), save() and dump_ports() all live here so every part
script can just do "from style import *".
"""
import json
import os

from PIL import Image, ImageDraw, ImageFont

S = 3  # supersample factor; design units == output pixels after save()

# ---------------------------------------------------------------------------
# Palette
# ---------------------------------------------------------------------------
C = {
    "board":    (26, 28, 32),
    "board2":   (36, 39, 44),
    "edge":     (74, 78, 86),
    "text":     (228, 230, 234),
    "silk":     (182, 186, 192),
    "white":    (240, 240, 238),
    "white_d":  (198, 198, 194),
    "black":    (18, 18, 20),
    "grey":     (112, 116, 124),
    "orange":   (255, 140, 32),
    "orange_d": (176, 92, 20),
    "red":      (232, 64, 56),
    "reddark":  (54, 20, 18),
    "yellow":   (226, 190, 44),
    "canlgrn":  (120, 200, 90),
    "blue":     (70, 130, 220),
    "posred":   (188, 40, 34),
    "brass":    (196, 162, 84),
    "brass_d":  (140, 112, 52),
    "cream":    (238, 232, 214),
}

# ---------------------------------------------------------------------------
# Fonts
# ---------------------------------------------------------------------------
REG, BOLD, MONO = "regular", "bold", "mono"

if os.uname().sysname == "Darwin":
    FD = {
        REG:  "/System/Library/Fonts/Supplemental/Arial.ttf",
        BOLD: "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        MONO: "/System/Library/Fonts/Supplemental/Andale Mono.ttf",
    }
else:
    FD = {
        REG:  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        BOLD: "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        MONO: "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    }

_font_cache = {}


def F(family, size):
    key = (family, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(FD[family], int(size * S))
    return _font_cache[key]


# ---------------------------------------------------------------------------
# Canvas
# ---------------------------------------------------------------------------
def canvas(w, h):
    im = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    return im, d


def _sc(box):
    return tuple(v * S for v in box)


# ---------------------------------------------------------------------------
# Primitive wrappers -- all take DESIGN UNIT coordinates
# ---------------------------------------------------------------------------
def rr(d, box, radius, fill=None, outline=None, w=1):
    d.rounded_rectangle(_sc(box), radius=radius * S, fill=fill, outline=outline,
                         width=w * S if outline else 0)


def rect(d, box, fill=None, outline=None, w=1):
    d.rectangle(_sc(box), fill=fill, outline=outline, width=w * S if outline else 0)


def circ(d, cx, cy, r, fill=None, outline=None, w=1):
    d.ellipse(_sc((cx - r, cy - r, cx + r, cy + r)), fill=fill, outline=outline,
              width=w * S if outline else 0)


def line(d, p0, p1, color, width=1):
    d.line((p0[0] * S, p0[1] * S, p1[0] * S, p1[1] * S), fill=color, width=max(1, int(width * S)))


def poly(d, points, fill=None, outline=None, w=1):
    pts = [(x * S, y * S) for x, y in points]
    d.polygon(pts, fill=fill, outline=outline, width=w * S if outline else 0)
    if outline and w:
        d.line(pts + [pts[0]], fill=outline, width=w * S)


_ANCHOR_MAP = {
    "mm": "mm", "lm": "lm", "rm": "rm", "mt": "mt", "mb": "mb",
    "lt": "lt", "rt": "rt", "lb": "lb", "rb": "rb",
}


def text(d, xy, s, font, color, anchor="mm"):
    d.text((xy[0] * S, xy[1] * S), s, font=font, fill=color,
            anchor=_ANCHOR_MAP.get(anchor, anchor))


# ---------------------------------------------------------------------------
# Connector primitives
# ---------------------------------------------------------------------------
def lever(d, box, r=5, vertical=False):
    """A WAGO-style toolless lever terminal: light housing + orange lever."""
    x0, y0, x1, y1 = box
    rr(d, box, r, fill=C["white"], outline=C["white_d"], w=1)
    if vertical:
        lx0, ly0, lx1, ly1 = x0 + 3, y0 + (y1 - y0) * 0.18, x1 - 3, y0 + (y1 - y0) * 0.55
    else:
        lx0, ly0, lx1, ly1 = x0 + (x1 - x0) * 0.18, y0 + 3, x0 + (x1 - x0) * 0.62, y1 - 3
    rr(d, (lx0, ly0, lx1, ly1), max(2, r - 2), fill=C["orange"], outline=C["orange_d"], w=1)


def wago(d, box, holes=2):
    """A small WAGO-style block with N through-holes, evenly spaced."""
    x0, y0, x1, y1 = box
    rr(d, box, 4, fill=(214, 216, 220), outline=C["white_d"], w=1)
    for i in range(holes):
        cx = x0 + (i + 0.5) * (x1 - x0) / holes
        cy = (y0 + y1) / 2
        circ(d, cx, cy, min((x1 - x0) / holes, y1 - y0) * 0.22, fill=C["board2"])


def bolt_lug(d, cx, cy, r, positive=True):
    """An M6 threaded battery-lug terminal, top view."""
    col = C["posred"] if positive else C["black"]
    circ(d, cx, cy, r, fill=col, outline=C["edge"], w=2)
    circ(d, cx, cy, r * 0.62, fill=C["brass"], outline=C["brass_d"], w=1)
    circ(d, cx, cy, r * 0.24, fill=C["board2"])


def hex_bolt(d, cx, cy, r):
    """A silver hex-head stud/bolt, top view."""
    import math
    pts = [(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
           for a in range(0, 360, 60)]
    poly(d, pts, fill=(196, 198, 204), outline=(120, 124, 132), w=1)
    circ(d, cx, cy, r * 0.42, fill=(150, 154, 162), outline=(104, 108, 116), w=1)


def mount_hole(d, cx, cy, r):
    """A screw mounting hole with a thin rim."""
    circ(d, cx, cy, r, fill=(14, 15, 17), outline=(70, 74, 82), w=1)
    circ(d, cx, cy, r * 0.4, fill=(40, 42, 47))


def breaker(d, cx, cy, w, h, tripped=False):
    """A small resettable breaker/switch nub -- yellow lever, black body."""
    rr(d, (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), 4,
       fill=C["black"], outline=C["grey"], w=2)
    lever_h = h * 0.4 if not tripped else h * 0.7
    rr(d, (cx - w * 0.3, cy + h / 2 - lever_h, cx + w * 0.3, cy + h / 2 - 3), 3,
       fill=C["yellow"], outline=C["orange_d"], w=1)


def rj45(d, box, vertical=False):
    """An Ethernet RJ45 jack, drawn as a plastic shell with a metal-tab plug slot."""
    rr(d, box, 3, fill=(56, 58, 64), outline=(28, 30, 34), w=2)
    x0, y0, x1, y1 = box
    inset = min(x1 - x0, y1 - y0) * 0.22
    rect(d, (x0 + inset, y0 + inset, x1 - inset, y1 - inset), fill=(20, 21, 24))


def usb(d, box, kind="A"):
    """A USB connector shell. kind: 'A' (host, wide) or 'B' (device, square-ish)."""
    rr(d, box, 2, fill=(216, 218, 222), outline=(150, 152, 158), w=1)
    x0, y0, x1, y1 = box
    inset = (x1 - x0) * (0.16 if kind == "A" else 0.22)
    rect(d, (x0 + inset, y0 + inset, x1 - inset, y1 - inset), fill=(60, 62, 68))


def jst(d, cx, cy, w, h, pins, vertical=False):
    """A small keyed JST-style pigtail connector housing with N crimp pins."""
    box = (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)
    rr(d, box, 2, fill=(30, 32, 36), outline=(12, 13, 15), w=1)
    for i in range(pins):
        if vertical:
            px = cx
            py = cy - h / 2 + (i + 0.5) * h / pins
        else:
            px = cx - w / 2 + (i + 0.5) * w / pins
            py = cy
        circ(d, px, py, min(w, h) / pins * 0.22, fill=(190, 176, 90))


def pin_header(d, x0, y0, n, pitch, horizontal=True, pin_r=2.6, box_w=None):
    """N square pin-header pins on a small silkscreen strip; returns list of centers."""
    box_w = box_w or pin_r * 3.4
    centers = []
    for i in range(n):
        cx = x0 + i * pitch if horizontal else x0
        cy = y0 if horizontal else y0 + i * pitch
        rect(d, (cx - box_w / 2, cy - box_w / 2, cx + box_w / 2, cy + box_w / 2),
             fill=(214, 216, 220), outline=(150, 152, 158), w=1)
        circ(d, cx, cy, pin_r, fill=(60, 62, 68))
        centers.append((cx, cy))
    return centers


def barrel_jack(d, cx, cy, r):
    """A coaxial barrel power jack, top view."""
    circ(d, cx, cy, r, fill=(40, 42, 47), outline=(18, 19, 22), w=2)
    circ(d, cx, cy, r * 0.55, fill=(190, 192, 196))
    circ(d, cx, cy, r * 0.22, fill=(40, 42, 47))


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------
def save(im, path, target_width):
    scale = target_width / im.width
    target_size = (target_width, round(im.height * scale))
    im.resize(target_size, Image.LANCZOS).save(path)


def dump_ports(port_edges, path):
    ports = {name: {"side": side, "x": x, "y": y}
             for name, (side, x, y) in port_edges.items()}
    with open(path, "w") as f:
        json.dump(ports, f, indent=2)
