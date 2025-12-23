#!/usr/bin/env python3
"""Create SODOO and SODOOC favicons from SVG"""
from PIL import Image, ImageDraw, ImageFont
import os

# SODOO SVG
sodoo_svg = '''<svg width="287" height="287" viewBox="0 0 287 287" xmlns="http://www.w3.org/2000/svg" xml:space="preserve">
  <g>
    <path d="M 10 53.33 C 10 29.4 29.4 10 53.33 10 L 226.67 10 C 250.6 10 270 29.4 270 53.33 L 270 226.67 C 270 250.6 250.6 270 226.67 270 L 53.33 270 C 29.4 270 10 250.6 10 226.67 Z" stroke="#8F8F8F" stroke-width="6.875" stroke-miterlimit="8" fill="#714B67" fill-rule="evenodd"/>
    <text fill="#7F7F7F" font-family="Arial Black,Arial Black_MSFontService,sans-serif" font-weight="900" font-size="110" x="105" y="177">&gt;</text>
    <text fill="#DD4814" font-family="Arial Black,Arial Black_MSFontService,sans-serif" font-weight="900" font-size="110" x="57.5" y="100">SO</text>
    <text fill="#DD4814" font-family="Arial Black,Arial Black_MSFontService,sans-serif" font-weight="900" font-size="110" x="46" y="258">OO</text>
  </g>
</svg>'''

# SODOOC SVG
sodooc_svg = '''<svg width="287" height="287" viewBox="0 0 287 287" xmlns="http://www.w3.org/2000/svg" xml:space="preserve">
  <g>
    <path d="M 10 53.33 C 10 29.4 29.4 10 53.33 10 L 226.67 10 C 250.6 10 270 29.4 270 53.33 L 270 226.67 C 270 250.6 250.6 270 226.67 270 L 53.33 270 C 29.4 270 10 250.6 10 226.67 Z" stroke="#8F8F8F" stroke-width="6.875" stroke-miterlimit="8" fill="#714B67" fill-rule="evenodd"/>
    <text fill="#7F7F7F" font-family="Arial Black,Arial Black_MSFontService,sans-serif" font-weight="900" font-size="110" x="105" y="177">&gt;</text>
    <text fill="#DD4814" font-family="Arial Black,Arial Black_MSFontService,sans-serif" font-weight="900" font-size="110" x="57.5" y="100">SO</text>
    <text fill="#DD4814" font-family="Arial Black,Arial Black_MSFontService,sans-serif" font-weight="900" font-size="110" x="32" y="258">O</text>
    <text fill="#8BB955" font-family="Arial Black,Arial Black_MSFontService,sans-serif" font-weight="900" font-size="110" x="105" y="258">O</text>
    <text fill="#446995" font-family="Arial Black,Arial Black_MSFontService,sans-serif" font-weight="900" font-size="110" x="178" y="258">&lt;</text>
  </g>
</svg>'''

# Save SVG files first
print("💾 Saving SVG files...")
with open('/tmp/sodoo-favicon.svg', 'w') as f:
    f.write(sodoo_svg)
print("✅ Created: /tmp/sodoo-favicon.svg")

with open('/tmp/sodooc-favicon.svg', 'w') as f:
    f.write(sodooc_svg)
print("✅ Created: /tmp/sodooc-favicon.svg")

print("\n📦 SVG files ready!")
print("   - /tmp/sodoo-favicon.svg")
print("   - /tmp/sodooc-favicon.svg")
print("\n⚠️  Use online converter or ImageMagick to create PNG/ICO files from SVG")

