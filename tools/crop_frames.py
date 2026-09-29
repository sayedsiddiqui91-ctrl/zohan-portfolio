"""Crop every cut-out frame in a sequence folder to the pixels that show him.

Usage:  python tools/crop_frames.py site/assets/seq-hd

The frames are mostly transparent, and a full-size frame costs the same GPU memory
whether it is empty or not. Cropping each one to its alpha bounding box (plus a
small margin) cuts decoded memory by more than half. The offsets go into
meta.json as `crops` ([x, y, w, h] in full-frame pixels), and the page draws each
cropped frame back at its original position. Safe to run again: frames that are
already cropped keep their stored offsets.
"""
import glob, json, os, sys
from PIL import Image

PAD = 2

def main(folder):
    meta_path = os.path.join(folder, 'meta.json')
    meta = json.load(open(meta_path))
    W, H = meta['w'], meta['h']
    old = meta.get('crops') or []
    crops, before, after = [], 0, 0
    for i, path in enumerate(sorted(glob.glob(os.path.join(folder, 'f*.webp')))):
        im = Image.open(path).convert('RGBA')
        if im.size != (W, H):                      # cropped on an earlier run
            crops.append(old[i]); after += im.width * im.height; before += W * H
            continue
        box = im.getchannel('A').point(lambda a: 255 if a > 2 else 0).getbbox() or (0, 0, 1, 1)
        x0, y0 = max(0, box[0] - PAD), max(0, box[1] - PAD)
        x1, y1 = min(W, box[2] + PAD), min(H, box[3] + PAD)
        im.crop((x0, y0, x1, y1)).save(path, 'WEBP', quality=82, method=6)
        crops.append([x0, y0, x1 - x0, y1 - y0])
        before += W * H; after += (x1 - x0) * (y1 - y0)
    meta['crops'] = crops
    json.dump(meta, open(meta_path, 'w'), separators=(',', ':'))
    print(f'{len(crops)} frames, decoded pixels {before / 1e6:.0f}M -> {after / 1e6:.0f}M ({after / before:.0%})')

if __name__ == '__main__':
    main(sys.argv[1])
