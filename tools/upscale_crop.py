# AI-upscale only the part of each frame that shows him (the backdrop is cut out
# later anyway), composite onto a Lanczos-resized frame at 1920x1080.
import json, os, subprocess, sys
from PIL import Image
SP = sys.argv[1]
meta = json.load(open(sys.argv[2]))
exe = os.path.join(SP, 'esrgan', 'realesrgan-ncnn-vulkan.exe')
S = 1920 / 1280
for i in range(96):
    out = os.path.join(SP, 'hd_x4', f'h{i:03d}.png')
    if os.path.exists(out): continue
    src = Image.open(os.path.join(SP, 'hd_in', f'h{i:03d}.png')).convert('RGB')
    b = meta['boxes'][min(2 * i, len(meta['boxes']) - 1)]
    m = 24
    x0 = max(0, int(b[0] * 1280) - m); y0 = max(0, int(b[1] * 720) - m)
    x1 = min(1280, int(b[2] * 1280) + m); y1 = min(720, int(b[3] * 720) + m)
    crop = os.path.join(SP, 'hd_x4', 'crop.png'); up = os.path.join(SP, 'hd_x4', 'up.png')
    src.crop((x0, y0, x1, y1)).save(crop)
    subprocess.run([exe, '-i', crop, '-o', up, '-n', 'realesrgan-x4plus', '-t', '256'], cwd=os.path.join(SP, 'esrgan'), capture_output=True, check=True)
    big = src.resize((1920, 1080), Image.LANCZOS)
    u = Image.open(up).convert('RGB').resize((round((x1 - x0) * S), round((y1 - y0) * S)), Image.LANCZOS)
    big.paste(u, (round(x0 * S), round(y0 * S)))
    big.save(out)
    print('done', i, flush=True)
print('ALLDONE')
