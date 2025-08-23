#!/usr/bin/env python3
"""
Fashion Image Downloader for Bogart Fashion Store
Downloads appropriate images for men's fashion products from free sources
"""

import os
import requests
from urllib.parse import urljoin
import time

# Create the base uploads directory
UPLOADS_DIR = "backend/uploads"

# Image URLs from free sources (Unsplash, Pexels, etc.)
FASHION_IMAGES = {
    # Men Clothing
    "mens-clothing/white-tshirt.jpg": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    "mens-clothing/denim-jacket.jpg": "https://images.unsplash.com/photo-1544022613-e87ca540a84a?w=400&h=400&fit=crop",
    "mens-clothing/polo-shirt.jpg": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&h=400&fit=crop",
    
    # Accessories
    "accessories/leather-belt.jpg": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    "accessories/silk-tie.jpg": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop",
    "accessories/leather-wallet.jpg": "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop",
    
    # Footwear
    "footwear/oxford-shoes.jpg": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
    "footwear/casual-sneakers.jpg": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    "footwear/leather-boots.jpg": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
    
    # Watches
    "watches/analog-watch.jpg": "https://images.unsplash.com/photo-1524592094714-0f0681ab5a91?w=400&h=400&fit=crop",
    "watches/digital-watch.jpg": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    
    # Sportswear
    "sportswear/athletic-shorts.jpg": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
    "sportswear/sports-jersey.jpg": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
    
    # Formal Wear
    "formal-wear/black-suit.jpg": "https://images.unsplash.com/photo-1593030761757-71cae45d48e7?w=400&h=400&fit=crop",
    "formal-wear/navy-blazer.jpg": "https://images.unsplash.com/photo-1593030761757-71cae45d48e7?w=400&h=400&fit=crop",
    "formal-wear/white-dress-shirt.jpg": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop"
}

def download_image(url, filepath):
    """Download an image from URL and save it to filepath"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Save the image
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        print(f"✅ Downloaded: {filepath}")
        return True
    except Exception as e:
        print(f"❌ Failed to download {filepath}: {e}")
        return False

def main():
    print("🔄 Starting Fashion Image Download...")
    print("=" * 50)
    
    # Ensure uploads directory exists
    if not os.path.exists(UPLOADS_DIR):
        os.makedirs(UPLOADS_DIR)
        print(f"📁 Created directory: {UPLOADS_DIR}")
    
    success_count = 0
    total_count = len(FASHION_IMAGES)
    
    for image_path, image_url in FASHION_IMAGES.items():
        full_path = os.path.join(UPLOADS_DIR, image_path)
        
        if download_image(image_url, full_path):
            success_count += 1
        
        # Be respectful to the servers
        time.sleep(0.5)
    
    print("=" * 50)
    print(f"🎉 Download Complete!")
    print(f"✅ Successfully downloaded: {success_count}/{total_count} images")
    print(f"📁 Images saved to: {UPLOADS_DIR}")
    
    if success_count < total_count:
        print("⚠️  Some images failed to download. You may need to manually add them.")

if __name__ == "__main__":
    main()
