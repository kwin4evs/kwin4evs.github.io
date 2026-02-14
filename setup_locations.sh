#!/bin/bash

# Setup location folder structure
# Creates location folders with names and coordinates in images/ directory

IMAGES_DIR="images"

# Array of locations: "Name: lat,lng"
locations=(
  "Edgewater: 10.8336474,122.9481364"
  "Gina's Seafood Restaurant: 10.6746303,122.9430732"
  "Arffogato Dog Cafe: 10.6930064,122.9749599"
  "Baywalk: 10.6723969,122.9380618"
  "Home: 10.6895694,122.9751623"
  "Playa del Puerto: 10.8818194,122.9808008"
  "NGC: 10.6584818,122.9665588"
  "KFC East: 10.6644496,122.9681646"
  "Bacolod Plaza: 10.6700006,122.9465416"
  "Hilltop: 10.5998062,123.0456296"
  "Cafe Jito: 10.6626791,123.0247713"
  "Ayala Capitol: 10.6767878,122.9476759"
  "Delicioso: 10.7012976,122.9595253"
  "Palawud: 10.7011207,122.9466785"
  "Gladylan: 10.7301697,122.9599343"
  "Lagoon: 10.6760181,122.9495896"
  "Uma: 10.679412,123.036135"
  "Hideout Cafe: 10.6675796,123.0345174"
  "Guimaras Manggahan: 10.5994501,122.5865709"
  "Urban Inn Iloilo: 10.7098072,122.563989"
  "Netong's Batchoy Iloilo: 10.7086773,122.5652656"
  "Garage Talabahan: 10.602452,122.9120962"
  "Conchita: 10.6619264,123.0240884"
  "Maria Kucina: 10.6854769,122.9513096"
  "Northland Resort Hotel: 10.9421693,123.1265095"
  "Nonna's Kitchen (with April): 10.6616737,122.9663644"
  "SM City Bacolod: 10.6707923,122.9400966"
  "E Gravino Recreational Hub (best mango shake jewk): 10.5874252,123.0646717"
  "Zaycoland Kabankalan: 9.849339,122.6510202"
  "Mag-Aso Falls Kabankalan: 9.9004413,122.8883402"
  "Mambukal: 10.5123393,123.101989"
  "Rolling Hills: 10.6606972,122.9862387"
  "Rockwell: 10.6918367,122.9794073"
  "Lion's Park: 10.6611388,122.940682"
  "Kansha: 10.6864965,122.9545562"
  "My Phaat: 10.6868201,122.954743"
  "Imbang Talisay River: 10.7738111,122.9964078"
  "Woofgang: 10.6762939,122.951321"
  "Punong Gary's: 10.8439416,122.9668396"
  "Lion's Park Viewing Deck: 10.5661528,123.1978512"
  "Pepper Lunch Bacolod: 10.6727893,122.9414609"
  "Campuestohan: 10.6605951,123.1398555"
  "Baybay Mangrove Eco Trail: 10.9162197,123.0585771"
  "Bantayan Park: 10.5376151,122.8267602"
  "Doc J DSB: 10.5735819,123.1757011"
  "Cabli Beach Resort: 10.842699,123.5656956"
  "Primera Parada: 10.5618694,123.1402786"
  "Beans Talk Granada: 10.665746,123.0219295"
  "Velmiro House: 10.6635178,123.0186195"
  "Bagong Dalan: 10.6756241,123.0136766"
  "Ilaya Highland Resort: 10.6917351,123.172043"
  "Cafe Gip: 10.6619275,123.1332494"
  "Pungko-Pungko Cebu: 10.3111424,123.8891935"
  "Guimaras Windmill: 10.597961,122.7021867"
  "Playa De Paraiso Guimaras: 10.6428177,122.7181916"
  "Alobijod Cove Guimaras: 10.533854,122.5144042"
  "Parola Cauayan: 9.9076633,122.409462"
  "Pearl Beach Resort Cauayan: 9.8626025,122.3987502"
)

# Create images directory if it doesn't exist
mkdir -p "$IMAGES_DIR"

count=0
# Create folders for each location
for location in "${locations[@]}"; do
    # Parse name and coordinates (format: "Name: lat,lng")
    name="${location%:*}"
    coords="${location#*: }"
    
    # Create folder name: "Name (lat,lng)"
    folder_name="$name ($coords)"
    folder_path="$IMAGES_DIR/$folder_name"
    
    if [ ! -d "$folder_path" ]; then
        mkdir -p "$folder_path"
        echo "✓ Created: $folder_name"
        count=$((count + 1))
    else
        echo "⊘ Already exists: $folder_name"
    fi
done

echo ""
echo "✓ Setup complete"
echo "  Created: $count location folders"
echo ""
echo "Next steps:"
echo "1. Add images to date folders (YYYY-MM-DD) within each location"
echo "2. Add a 'description' file in each date folder"
echo "3. Run: ./generate_manifest.sh"
