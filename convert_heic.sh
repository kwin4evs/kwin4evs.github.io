#!/bin/bash

find . -type f -iname "*.heic" | while read -r file; do
    output="${file%.*}.jpg"

    # Skip if JPG already exists
    if [ -f "$output" ]; then
        echo "Skipping (already exists): $output"
        continue
    fi

    echo "Converting: $file"

    convert "$file" \
        -quality 100 \
        -sampling-factor 4:4:4 \
        "$output"

    if [ $? -eq 0 ]; then
        echo "✓ Success: $output"
    else
        echo "✗ Failed: $file"
    fi
done

echo "Done."