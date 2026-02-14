#!/bin/bash

# Organize images by date
# Extracts date from filename pattern: YYYYMMDD_HHMMSS
# Creates date folders (YYYY-MM-DD) and moves images

count=0
skipped=0

# Find all JPG files in current directory
for file in *.jpg *.jpeg; do
    [ -f "$file" ] || continue
    
    # Extract date and time from filename (format: YYYYMMDD_HHMMSS)
    if [[ "$file" =~ ^([0-9]{4})([0-9]{2})([0-9]{2})_([0-9]{6}) ]]; then
        year="${BASH_REMATCH[1]}"
        month="${BASH_REMATCH[2]}"
        day="${BASH_REMATCH[3]}"
        timestamp="${BASH_REMATCH[4]}"
        
        # Create folder name in YYYY-MM-DD format
        folder_name="${year}-${month}-${day}"
        
        # Create folder if it doesn't exist
        mkdir -p "$folder_name"
        
        # Move file to folder
        if mv "$file" "$folder_name/$file"; then
            echo "✓ Moved: $file → $folder_name/"
            count=$((count + 1))
        else
            echo "✗ Failed to move: $file"
        fi
    else
        echo "⊘ Skipped (invalid format): $file"
        skipped=$((skipped + 1))
    fi
done

echo ""
echo "✓ Organization complete"
echo "  Moved: $count files"
echo "  Skipped: $skipped files"
