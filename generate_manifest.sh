#!/bin/bash

# Generate manifest.json from location and date folders
# Structure: images/LocationName (lat,lng)/YYYY-MM-DD/{images,description}

IMAGES_DIR="images"
MANIFEST_FILE="manifest.json"

# Check if images directory exists
if [ ! -d "$IMAGES_DIR" ]; then
    echo "Error: $IMAGES_DIR directory not found"
    exit 1
fi

# Collect all entries
entries=()

# Process each location folder
for location_folder in "$IMAGES_DIR"/*/; do
    if [ -d "$location_folder" ]; then
        folder_name=$(basename "$location_folder")
        
        # Skip script files
        if [[ "$folder_name" == *.sh ]]; then
            continue
        fi
        
        # Parse folder name format: "Name (lat,lng)"
        if [[ "$folder_name" =~ ^(.*)\(([0-9.]+),([0-9.]+)\)$ ]]; then
            name="${BASH_REMATCH[1]}"
            name="${name% }"  # Remove trailing space
            lat="${BASH_REMATCH[2]}"
            lng="${BASH_REMATCH[3]}"
            
            # Find all date folders (YYYY-MM-DD format) in this location
            for date_folder in "$location_folder"[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/; do
                if [ -d "$date_folder" ]; then
                    date=$(basename "$date_folder")
                    
                    # Read description from file
                    description=""
                    if [ -f "$date_folder/description" ]; then
                        description=$(cat "$date_folder/description")
                    fi
                    
                    # path is: "LocationName (lat,lng)/YYYY-MM-DD"
                    path="$folder_name/$date"
                    
                    # Generate index.json file with list of images in this folder
                    image_list=$(find "$date_folder" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | sort | sed "s|$date_folder||" | grep -v '^$')
                    
                    if [ -n "$image_list" ]; then
                        images_json="["
                        first=true
                        while IFS= read -r image; do
                            image="${image#/}"  # Remove leading slash
                            if [ ! "$first" = true ]; then
                                images_json="$images_json,"
                            fi
                            images_json="$images_json\"$image\""
                            first=false
                        done <<< "$image_list"
                        images_json="$images_json]"
                        
                        # Write index.json to the date folder
                        echo "$images_json" | if command -v jq &> /dev/null; then
                            jq '.' > "$date_folder/index.json"
                        else
                            cat > "$date_folder/index.json"
                        fi
                    fi
                    
                    # Create entry JSON for each date
                    entry=$(cat <<EOF
{
  "lat": $lat,
  "lng": $lng,
  "path": "$path",
  "name": "$name",
  "description": "$description",
  "date": "$date"
}
EOF
)
                    entries+=("$entry")
                fi
            done
        else
            echo "Warning: Skipping folder with invalid format: $folder_name"
        fi
    fi
done

# Sort entries by date (newest first) and combine by location
if [ ${#entries[@]} -gt 0 ]; then
    # Build JSON array first
    json="["
    for i in "${!entries[@]}"; do
        json="$json${entries[$i]}"
        if [ $i -lt $((${#entries[@]} - 1)) ]; then
            json="$json,"
        fi
    done
    json="$json]"
    
    # Format and sort with jq if available
    if command -v jq &> /dev/null; then
        echo "$json" | jq 'sort_by(.date) | reverse' > "$MANIFEST_FILE"
        count=$(jq 'length' "$MANIFEST_FILE")
    else
        echo "$json" > "$MANIFEST_FILE"
        count=${#entries[@]}
    fi
    
    echo "✓ manifest.json generated successfully with $count entry/entries"
else
    echo "No date folders found in location directories"
fi
