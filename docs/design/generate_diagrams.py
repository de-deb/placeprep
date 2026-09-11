"""Generate docs/design diagrams with PIL (no external services).
Run: python3 docs/design/generate_diagrams.py
"""
from PIL import Image, ImageDraw, ImageFont
import os

HERE = os.path.dirname(os.path.abspath(__file__))

def font(size=28):
    # DejaVu is bundled with most systems; fall back to default.
    for p in ["/System/Library/Fonts/Helvetica.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def box(d, xy, text, sub=None, fill=(255, 255, 255), outline=(79, 70, 229)):
    d.rounded_rectangle(xy, radius=18, fill=fill, outline=outline, width=4)
    f, fs = font(30), font(22)
    x0, y0, x1, y1 = xy
    # title (possibly multiline)
    lines = text.split("\n")
    ty = y0 + 18
    for ln in lines:
        bb = d.textbbox((0, 0), ln, font=f)
        d.text(((x0 + x1 - (bb[2] - bb[0])) / 2, ty), ln, fill=(17, 24, 39), font=f)
        ty += (bb[3] - bb[1]) + 6
    if sub:
        bb = d.textbbox((0, 0), sub, font=fs)
        d.text(((x0 + x1 - (bb[2] - bb[0])) / 2, ty + 4), sub, fill=(100, 116, 139), font=fs)

def arrow(d, x1, y1, x2, y2, label=None):
    d.line([(x1, y1), (x2, y2)], fill=(100, 116, 139), width=4)
    # head
    import math
    ang = math.atan2(y2 - y1, x2 - x1)
    for da in (2.6, -2.6):
        d.line([(x2, y2), (x2 - 18 * math.cos(ang + da), y2 - 18 * math.sin(ang + da))], fill=(100, 116, 139), width=4)
    if label:
        f = font(20)
        bb = d.textbbox((0, 0), label, font=f)
        d.text(((x1 + x2 - (bb[2] - bb[0])) / 2, (y1 + y2) / 2 - 30), label, fill=(79, 70, 229), font=f)

def architecture():
    W, H = 1600, 1100
    img = Image.new("RGB", (W, H), (248, 250, 252))
    d = ImageDraw.Draw(img)
    d.text((60, 30), "PlacePrep — Layered Architecture (actual implementation)", fill=(17, 24, 39), font=font(36))
    # vertical stack
    layers = [
        ("Student / Admin\n(browser)", "React + Router"),
        ("React Frontend\nVite + TS + Tailwind", "pages → services → axios"),
        ("Express API\ncontrollers → routes", "auth middleware + zod"),
        ("Services\nbusiness logic", "auth / profile / dashboard / catalog / prep / admin"),
        ("Prisma ORM", "typed data access"),
        ("PostgreSQL", "10 models, relations"),
    ]
    y, x0, x1, bh, gap = 130, 450, 1150, 110, 28
    prev_bottom = None
    for title, sub in layers:
        box(d, (x0, y, x1, y + bh), title, sub)
        if prev_bottom is not None:
            arrow(d, (x0 + x1) // 2, prev_bottom, (x0 + x1) // 2, y)
        prev_bottom = y + bh
        y += bh + gap
    d.text((60, H - 60), "HTTP/REST + JWT  •  docker compose: frontend :5173, backend :5000, postgres :5432", fill=(100, 116, 139), font=font(22))
    img.save(os.path.join(HERE, "architecture.png"))

def components():
    W, H = 1600, 1000
    img = Image.new("RGB", (W, H), (248, 250, 252))
    d = ImageDraw.Draw(img)
    d.text((60, 30), "PlacePrep — Component / Module Map (matches repo layout)", fill=(17, 24, 39), font=font(36))
    # frontend modules
    box(d, (60, 120, 500, 300), "frontend/src", "pages / components/ui\nservices / context / hooks")
    box(d, (60, 340, 500, 520), "UI kit", "Button Card Input Badge\nModal Table States")
    box(d, (60, 560, 500, 740), "Student flows", "dashboard profile\ndrives coding aptitude")
    # backend modules
    box(d, (620, 120, 1060, 300), "backend/src", "routes / controllers\nservices / middleware")
    box(d, (620, 340, 1060, 520), "Catalog modules", "companies drives\nresources announcements")
    box(d, (620, 560, 1060, 740), "Prep + Admin", "coding aptitude\nadmin overview/students")
    # db
    box(d, (1140, 120, 1540, 520), "PostgreSQL\n(via Prisma)", "User StudentProfile\nCompany Drive Application\nResource Announcement\nCoding* Aptitude*")
    arrow(d, 500, 210, 620, 210, "REST / JWT")
    arrow(d, 1060, 210, 1140, 210, "SQL")
    arrow(d, 280, 300, 280, 340)
    arrow(d, 280, 520, 280, 560)
    arrow(d, 840, 300, 840, 340)
    arrow(d, 840, 520, 840, 560)
    d.text((60, H - 60), "High cohesion per module  •  low coupling via services + REST envelopes {success,data}", fill=(100, 116, 139), font=font(22))
    img.save(os.path.join(HERE, "component-diagram.png"))

if __name__ == "__main__":
    architecture()
    components()
    print("wrote architecture.png + component-diagram.png")
