#!/bin/bash

# Optimize images: resize any JPG file larger than 200KB
# Reads from current directory, outputs to images folder

OUTPUT_DIR="images"
MAX_SIZE=200  # in KB
MAX_SIZE_BYTES=$((MAX_SIZE * 1024))

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick (convert) is not installed"
    echo "Install with: sudo apt-get install imagemagick (Linux) or brew install imagemagick (macOS)"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Counter
total=0
optimized=0

# Find all JPG files in current directory (not recursive)
while IFS= read -r -d '' file; do
    total=$((total + 1))
    filename=$(basename "$file")
    output_file="$OUTPUT_DIR/$filename"
    
    file_size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
    file_size_kb=$((file_size / 1024))
    
    if [ "$file_size" -gt "$MAX_SIZE_BYTES" ]; then
        echo "Optimizing: $filename ($file_size_kb KB)"
        
        # Create temporary file
        temp_file="$OUTPUT_DIR/${filename}.tmp"
        
        optimized_successfully=false
        
        # Try different resize and quality combinations
        for resize_percent in 100 90 80 70 60 50 40 30; do
            for quality in 85 75 65 55 45 35 25; do
                # Apply resize and quality compression
                convert "$file" \
                    -resize "${resize_percent}%" \
                    -quality "$quality" \
                    "$temp_file"
                
                new_size=$(stat -c%s "$temp_file" 2>/dev/null || stat -f%z "$temp_file" 2>/dev/null)
                
                if [ "$new_size" -le "$MAX_SIZE_BYTES" ]; then
                    mv "$temp_file" "$output_file"
                    new_size_kb=$((new_size / 1024))
                    echo "  ✓ Optimized to $new_size_kb KB (resize: $resize_percent%, quality: $quality)"
                    optimized=$((optimized + 1))
                    optimized_successfully=true
                    break 2
                fi
            done
        done
        
        # If still not optimized, apply most aggressive settings
        if [ "$optimized_successfully" = false ]; then
            convert "$file" \
                -resize 20% \
                -quality 20 \
                "$temp_file"
            
            new_size=$(stat -c%s "$temp_file" 2>/dev/null || stat -f%z "$temp_file" 2>/dev/null)
            
            if [ "$new_size" -le "$MAX_SIZE_BYTES" ]; then
                mv "$temp_file" "$output_file"
                new_size_kb=$((new_size / 1024))
                echo "  ✓ Optimized to $new_size_kb KB (resize: 20%, quality: 20 - aggressive)"
                optimized=$((optimized + 1))
            else
                new_size_kb=$((new_size / 1024))
                echo "  ✗ Failed to optimize below 200KB (final size: $new_size_kb KB)"
                [ -f "$temp_file" ] && rm -f "$temp_file"
            fi
        fi
    else
        # Copy files smaller than 200KB directly
        cp "$file" "$output_file"
        echo "Copying: $filename ($file_size_kb KB)"
    fi
done < <(find . -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) -print0)

echo ""
echo "✓ Optimization complete"
echo "  Processed: $total files"
echo "  Optimized: $optimized files"
echo "  Output directory: $OUTPUT_DIR"
echo "  Max size: $MAX_SIZE KB"
