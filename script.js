let map;
let locationsByCoords = {}; // Group entries by lat,lng

async function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 5,
    center: { lat: 12.8797, lng: 121.7740 }
  });

  const res = await fetch("manifest.json");
  let locations = await res.json();

  // Group locations by coordinates (lat, lng)
  locations.forEach(loc => {
    const key = `${loc.lat},${loc.lng}`;
    if (!locationsByCoords[key]) {
      locationsByCoords[key] = {
        lat: loc.lat,
        lng: loc.lng,
        name: loc.name,
        dates: []
      };
    }
    locationsByCoords[key].dates.push({
      date: loc.date,
      path: loc.path,
      description: loc.description
    });
  });

  // Sort dates in descending order for each location
  Object.keys(locationsByCoords).forEach(key => {
    locationsByCoords[key].dates.sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  // Create markers for each unique location
  const markers = Object.keys(locationsByCoords).map(key => {
    const locData = locationsByCoords[key];
    const marker = new google.maps.Marker({
      position: { lat: locData.lat, lng: locData.lng },
      icon: {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='url(#gradient)'>
            <defs>
              <linearGradient id='gradient' x1='0%' y1='0%' x2='0%' y2='100%'>
                <stop offset='0%' style='stop-color:#f43f5e;stop-opacity:1' />
                <stop offset='100%' style='stop-color:#e11d48;stop-opacity:1' />
              </linearGradient>
            </defs>
            <path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/>
          </svg>`),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 40)
      },
      animation: google.maps.Animation.DROP
    });

    marker.addListener("click", () => openGallery(locData));
    return marker;
  });

  new markerClusterer.MarkerClusterer({ map, markers });
}

function openGallery(locData) {
  // locData contains: lat, lng, name, dates[]
  $("#gallery").empty().removeClass('grid').addClass('flex flex-col');

  // Set location name
  $("#locationName").text(locData.name);

  // Set date label - show all dates
  let dateLabel = "Multiple visits";
  if (locData.dates.length === 1) {
    const dateObj = new Date(locData.dates[0].date);
    dateLabel = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } else {
    // Show date range
    const firstDate = new Date(locData.dates[locData.dates.length - 1].date);
    const lastDate = new Date(locData.dates[0].date);
    const firstStr = firstDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const lastStr = lastDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    dateLabel = `${firstStr} to ${lastStr} (${locData.dates.length} visits)`;
  }
  $("#locationLabel").text(dateLabel);

  // Combine descriptions from all dates
  const descriptions = locData.dates
    .filter(d => d.description && d.description.trim())
    .map(d => d.description)
    .filter((desc, index, arr) => arr.indexOf(desc) === index); // Remove duplicates
  
  if (descriptions.length > 0) {
    $("#locationDescription").text(descriptions[0]).show();
  } else {
    $("#locationDescription").hide();
  }

  // Load images from all dates, grouped by date
  locData.dates.forEach(dateEntry => {
    const dir = `images/${dateEntry.path}`;
    const encodedDir = encodeURI(dir);
    const dateObj = new Date(dateEntry.date);
    const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Add date section wrapper - each date gets its own section
    const dateSection = $(`<div class='w-full mb-8'></div>`);
    
    // Add date header - full width, on its own line
    const dateHeader = $(`<h3 class='text-lg font-semibold text-pink-700 mb-4 w-full block'>${dateStr}</h3>`);
    dateSection.append(dateHeader);

    // Add date container for images with proper grid - 5 per row
    const dateContainer = $(`<div class='grid grid-cols-5 gap-4 w-full'></div>`);
    
    fetch(`${encodedDir}/index.json`)
      .then(response => response.json())
      .then(images => {
        if (images.length === 0) {
          dateContainer.html('<p class="text-gray-500">No images for this date.</p>');
        } else {
          images.forEach(imageName => {
            const imgSrc = `${encodedDir}/${imageName}`;
            const img = $('<img />', {
              src: imgSrc,
              class: 'rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow w-full h-32 object-cover',
              click: function() {
                openLightbox(this.src);
              }
            });
            dateContainer.append(img);
          });
        }
      })
      .catch(error => {
        console.error('Error loading images for date:', dateEntry.date, error);
        dateContainer.html('<p class="text-gray-500">Error loading images.</p>');
      });
    
    dateSection.append(dateContainer);
    $("#gallery").append(dateSection);
  });

  $("#galleryModal").removeClass("hidden").addClass("flex");
}

function openLightbox(imageSrc) {
  $("#lightboxImage").attr("src", imageSrc);
  $("#lightbox").removeClass("hidden").addClass("flex");
}

function closeGallery() {
  $("#galleryModal").addClass("hidden").removeClass("flex");
}

function closeLightbox() {
  $("#lightbox").addClass("hidden").removeClass("flex");
}

// Event handlers for closing modals
$(document).on("click", "#closeGallery", closeGallery);
$(document).on("click", "#closeLightbox", closeLightbox);

// Close lightbox when clicking outside the image
$(document).on("click", "#lightbox", function(e) {
  if (e.target.id === "lightbox") {
    closeLightbox();
  }
});

// Close gallery when pressing Escape key
$(document).on("keydown", function(e) {
  if (e.key === "Escape") {
    closeGallery();
    closeLightbox();
  }
});
