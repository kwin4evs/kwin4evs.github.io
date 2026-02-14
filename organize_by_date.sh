#!/bin/bash

# Organize images by date
# Reads images from images/ directory
# Extracts date from filename pattern: YYYYMMDD_HHMMSS
# Creates date folders (YYYY-MM-DD) and moves images

IMAGES_DIR="images"

# Check if images directory exists
if [ ! -d "$IMAGES_DIR" ]; then
    echo "Error: $IMAGES_DIR directory not found"
    exit 1
fi

count=0
skipped=0

# Find all JPG files in images directory
find "$IMAGES_DIR" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) | while read -r file; do
    filename=$(basename "$file")
    
    # Extract date and time from filename (format: YYYYMMDD_HHMMSS)
    if [[ "$filename" =~ ^([0-9]{4})([0-9]{2})([0-9]{2})_([0-9]{6}) ]]; then
        year="${BASH_REMATCH[1]}"
        month="${BASH_REMATCH[2]}"
        day="${BASH_REMATCH[3]}"
        timestamp="${BASH_REMATCH[4]}"
        
        # Create folder name in YYYY-MM-DD format
        folder_name="${IMAGES_DIR}/${year}-${month}-${day}"
        
        # Create folder if it doesn't exist
        mkdir -p "$folder_name"
        
        # Move file to folder
        if mv "$file" "$folder_name/$filename"; then
            echo "✓ Moved: $filename → ${year}-${month}-${day}/"
            count=$((count + 1))
        else
            echo "✗ Failed to move: $filename"
        fi
    else
        echo "⊘ Skipped (invalid format): $filename"
        skipped=$((skipped + 1))
    fi
done

echo ""
echo "✓ Organization complete"
echo "  Moved: $count files"
echo "  Skipped: $skipped files"
