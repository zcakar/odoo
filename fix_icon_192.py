#!/usr/bin/env python3
"""Fix sodoo-icon-192x192.png to be exactly 192x192 square"""
from PIL import Image

icon_path = '/tmp/sodoo-icon-192x192.png'
output_path = '/tmp/sodoo-icon-192x192-fixed.png'

# Open the current image (192x72)
img = Image.open(icon_path)
print(f"Current size: {img.size}")

# Create new 192x192 image with transparent background
new_img = Image.new('RGBA', (192, 192), (0, 0, 0, 0))

# Calculate position to center the original image
x = (192 - img.width) // 2
y = (192 - img.height) // 2

# Paste original image centered
new_img.paste(img, (x, y), img if img.mode == 'RGBA' else None)

# Save
new_img.save(output_path, 'PNG')
print(f"✅ Icon resized to: {new_img.size}")
print(f"✅ Saved to: {output_path}")

