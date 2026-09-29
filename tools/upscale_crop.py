# AI-upscale only the part of each frame that shows him (the backdrop is cut out
# later anyway), composite onto a Lanczos-resized frame at 1920x1080.
#
# Usage: python tools/upscale_crop.py <workdir> <sd meta.json>
#   <workdir>/hd_in/hNNN.png   source frames (1280x720)
#   <workdir>/hd_x4/hNNN.png   output (1920x1080)
#   <workdir>/esrgan/          realesrgan-ncnn-vulkan.exe + models
#
# Real-ESRGAN's Vulkan build can return solid black tiles on integrated GPUs. Every
# result is checked for them; a bad one is retried with smaller tiles and, if it
# still fails, that frame falls back to a plain Lanczos resize. Existing outputs are
# re-checked too, so running the script again repairs a damaged set.
import json, os, subprocess, sys
import numpy as np
from PIL import Image

SP = sys.argv[1]
meta = json.load(open(sys.argv[2]))
exe = os.path.join(SP, 'esrgan', 'realesrgan-ncnn-vulkan.exe')
S = 1920 / 1280

def has_black_tiles(im, size=32):
    """True if any size x size block is pure black (a failed GPU tile, not a dark suit)."""
    a = np.asarray(im.convert('RGB')).max(axis=2) < 4
    h, w = (a.shape[0] // size) * size, (a.shape[1] // size) * size
    return bool(a[:h, :w].reshape(h // size, size, w // size, size).all(axis=(1, 3)).any())

def upscale(crop_path, up_path):
    for tile in ('256', '128', '64'):
        subprocess.run([exe, '-i', crop_path, '-o', up_path, '-n', 'realesrgan-x4plus', '-t', tile],
                       cwd=os.path.join(SP, 'esrgan'), capture_output=True, check=True)
        up = Image.open(up_path).convert('RGB')
        if not has_black_tiles(up): return up, tile
        print(f'  black tiles with -t {tile}, retrying', flush=True)
    return None, None

for i in range(96):
    out = os.path.join(SP, 'hd_x4', f'h{i:03d}.png')
    if os.path.exists(out) and not has_black_tiles(Image.open(out)): continue
    src = Image.open(os.path.join(SP, 'hd_in', f'h{i:03d}.png')).convert('RGB')
    b = meta['boxes'][min(2 * i, len(meta['boxes']) - 1)]
    m = 24
    x0 = max(0, int(b[0] * 1280) - m); y0 = max(0, int(b[1] * 720) - m)
    x1 = min(1280, int(b[2] * 1280) + m); y1 = min(720, int(b[3] * 720) + m)
    crop = os.path.join(SP, 'crop.png'); upp = os.path.join(SP, 'up.png')
    src.crop((x0, y0, x1, y1)).save(crop)
    big = src.resize((1920, 1080), Image.LANCZOS)
    up, tile = upscale(crop, upp)
    if up is not None:
        big.paste(up.resize((round((x1 - x0) * S), round((y1 - y0) * S)), Image.LANCZOS), (round(x0 * S), round(y0 * S)))
    big.save(out)
    print('done', i, f'(tile {tile})' if up is not None else '(AI failed, Lanczos fallback)', flush=True)
print('ALLDONE')
