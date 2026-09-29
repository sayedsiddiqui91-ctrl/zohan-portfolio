"""Cut Zohan out of each video frame for the scroll hero.

Usage: python tools/cutout.py <dir of PNG frames> <output dir>
Writes f000.webp... (transparent backdrop), backdrop.jpg and meta.json.
"""
import sys, glob, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def fit_bg(a, mask_bg):
    H, W, _ = a.shape
    ys, xs = np.nonzero(mask_bg)
    sel = np.random.default_rng(0).choice(len(ys), min(40000, len(ys)), replace=False)
    ys, xs = ys[sel], xs[sel]
    X = xs / W - 0.5; Y = ys / H - 0.5
    A = np.stack([np.ones_like(X), X, Y, X * X, Y * Y, X * Y, X**3, Y**3, X*X*Y, X*Y*Y], 1)
    gy, gx = np.mgrid[0:H, 0:W]
    GX = gx / W - 0.5; GY = gy / H - 0.5
    G = np.stack([np.ones_like(GX), GX, GY, GX * GX, GY * GY, GX * GY, GX**3, GY**3, GX*GX*GY, GX*GY*GY], -1)
    bg = np.zeros_like(a, dtype=float)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, a[ys, xs, c], rcond=None)
        bg[..., c] = G @ coef
    return bg

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

def process(src, dst):
    a = np.asarray(Image.open(src).convert('RGB')).astype(float)
    H, W, _ = a.shape
    # pass 1: border band as backdrop sample
    band = np.zeros((H, W), bool)
    band[:int(H * 0.08)] = True; band[:, :int(W * 0.06)] = True; band[:, -int(W * 0.06):] = True
    sat = a.max(-1) - a.min(-1)
    lum = a.mean(-1)
    band &= (lum > 140) & (sat < 30)
    bg = fit_bg(a, band)
    diff = np.abs(a - bg).max(-1)
    # pass 2: refit on everything that looks like backdrop
    bg = fit_bg(a, (diff < 8) & (lum > 120))
    diff = np.abs(a - bg).max(-1)
    hard = Image.fromarray(((diff > 15) * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
    # flood the backdrop from the frame edge; whatever it can't reach is subject (fills holes)
    pad = Image.new('L', (W + 2, H + 2), 0); pad.paste(hard, (1, 1))
    # he always touches the bottom edge: seal it so the fill can't leak up through the shirt
    ImageDraw.Draw(pad).line([(0, H + 1), (W + 1, H + 1)], fill=255)
    ImageDraw.floodfill(pad, (0, 0), 128, thresh=0)
    filled = (np.asarray(pad)[1:-1, 1:-1] != 128)
    # drop small islands (noise) by keeping components touching a big area: erode/dilate
    f_img = Image.fromarray((filled * 255).astype(np.uint8))
    core = np.asarray(f_img.filter(ImageFilter.MinFilter(5))) > 127       # eroded
    near = np.asarray(f_img.filter(ImageFilter.MaxFilter(5))) > 127       # dilated
    soft = smooth(6, 20, diff)
    alpha = np.maximum(core.astype(float), soft * near)
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))) / 255.0
    rgba = np.dstack([a, alpha * 255]).clip(0, 255).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(dst, 'WEBP', quality=82, method=6)
    ys, xs = np.nonzero(filled)
    box = [xs.min() / W, ys.min() / H, xs.max() / W, ys.max() / H] if len(xs) else [0, 0, 1, 1]
    return box, bg

if __name__ == '__main__':
    src_dir, out_dir = sys.argv[1], sys.argv[2]
    files = sorted(glob.glob(src_dir + '/*.png'))
    W, H = Image.open(files[0]).size
    meta = []
    for i, f in enumerate(files):
        box, bg = process(f, f'{out_dir}/f{i:03d}.webp')
        meta.append([round(float(v), 4) for v in box])
        if i == len(files) // 2:  # the backdrop plate is taken from the middle of the move
            Image.fromarray(bg.clip(0, 255).astype(np.uint8)).save(f'{out_dir}/backdrop.jpg', quality=90)
        if i % 24 == 0: print(i, box, flush=True)
    json.dump({'count': len(files), 'w': W, 'h': H, 'boxes': meta}, open(f'{out_dir}/meta.json', 'w'))
