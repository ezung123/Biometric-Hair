from PIL import Image
import numpy as np
import os

def isolate_hair_to_png(src_jpg_path, out_png_path, threshold=242):
    img = Image.open(src_jpg_path).convert("RGBA")
    arr = np.array(img)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    
    # White background mask: pixels where r, g, and b are all high and close to neutral
    is_white = (r > threshold) & (g > threshold) & (b > threshold)
    
    # Feather alpha around edges
    alpha = np.where(is_white, 0, 255).astype(np.uint8)
    
    # Semi-transparent blending for edge fringe
    grey_diff = np.maximum.reduce([np.abs(r.astype(int) - g.astype(int)), np.abs(g.astype(int) - b.astype(int)), np.abs(r.astype(int) - b.astype(int))])
    is_fringe = (~is_white) & (r > 200) & (g > 200) & (b > 200) & (grey_diff < 20)
    alpha[is_fringe] = (255 - np.mean([r[is_fringe], g[is_fringe], b[is_fringe]], axis=0)).clip(0, 255).astype(np.uint8)
    
    arr[:, :, 3] = alpha
    out_img = Image.fromarray(arr, "RGBA")
    out_img.save(out_png_path, "PNG")
    print(f"Saved: {out_png_path} ({os.path.getsize(out_png_path)} bytes)")

convert_map = [
    (r"C:\Users\Zaren\.gemini\antigravity-ide\brain\1219cb89-abff-4784-acf7-df68ca060930\hair_layered_waves_1793338671891.jpg", r"C:\biometric_hair\assets\images\hair_layered_waves.png"),
    (r"C:\Users\Zaren\.gemini\antigravity-ide\brain\1219cb89-abff-4784-acf7-df68ca060930\hair_french_bob_1793338711010.jpg", r"C:\biometric_hair\assets\images\hair_french_bob.png"),
    (r"C:\Users\Zaren\.gemini\antigravity-ide\brain\1219cb89-abff-4784-acf7-df68ca060930\hair_sleek_pixie_1793338729679.jpg", r"C:\biometric_hair\assets\images\hair_sleek_pixie.png"),
    (r"C:\Users\Zaren\.gemini\antigravity-ide\brain\1219cb89-abff-4784-acf7-df68ca060930\hair_buzz_cut_1793338757817.jpg", r"C:\biometric_hair\assets\images\hair_buzz_cut.png"),
]

for src, dst in convert_map:
    if os.path.exists(src):
        isolate_hair_to_png(src, dst)
    else:
        print(f"Missing src: {src}")
