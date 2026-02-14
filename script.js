let map;
let locationsByCoords = {}; // Group entries by lat,lng
let allImages = []; // Array to store all images from all folders
let currentFolderImages = []; // Array to store images for current folder being viewed
let currentImageIndex = 0; // Current image index in lightbox
let imageToFolderMap = {}; // Maps image src to folder path for scoped navigation

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
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#e11d48'>
    <path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/>
  </svg>
`),
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

  // Reset allImages array and folder map for this gallery
  allImages = [];
  imageToFolderMap = {};

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
            // Add to allImages array for navigation
            allImages.push(imgSrc);
            // Map this image to its folder path for scoped navigation
            imageToFolderMap[imgSrc] = encodedDir;
            
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
  // Get the folder path for this image
  const imageFolder = imageToFolderMap[imageSrc];
  
  // If image is not mapped to a folder, handle gracefully
  if (!imageFolder) {
    console.warn('Image not found in folder map:', imageSrc);
    // Show just this image with no navigation
    currentFolderImages = [imageSrc];
    currentImageIndex = 0;
  } else {
    // Filter allImages to only include images from the same folder
    currentFolderImages = allImages.filter(img => imageToFolderMap[img] === imageFolder);
    
    // Find the index of the clicked image within its folder
    currentImageIndex = currentFolderImages.indexOf(imageSrc);
    
    // If image not found in filtered list, this indicates a mapping issue
    if (currentImageIndex === -1) {
      console.warn('Image found in folder map but not in filtered list. This may indicate a data inconsistency:', imageSrc);
      currentFolderImages.push(imageSrc);
      allImages.push(imageSrc);
      imageToFolderMap[imageSrc] = imageFolder;
      currentImageIndex = currentFolderImages.length - 1;
    }
  }
  
  $("#lightboxImage").attr("src", imageSrc);
  $("#lightbox").removeClass("hidden").addClass("flex");
  
  // Show/hide navigation arrows based on available images
  updateNavigationArrows();
  
  // Setup autohide for arrows
  setupArrowAutohide();
}

function updateNavigationArrows() {
  if (currentFolderImages.length <= 1) {
    $("#prevImage, #nextImage").addClass("hidden");
  } else {
    $("#prevImage, #nextImage").removeClass("hidden");
    
    // Hide prev arrow if on first image
    if (currentImageIndex === 0) {
      $("#prevImage").addClass("hidden");
    }
    
    // Hide next arrow if on last image
    if (currentImageIndex === currentFolderImages.length - 1) {
      $("#nextImage").addClass("hidden");
    }
  }
}

function showNextImage() {
  if (currentImageIndex < currentFolderImages.length - 1) {
    currentImageIndex++;
    $("#lightboxImage").attr("src", currentFolderImages[currentImageIndex]);
    updateNavigationArrows();
    setupArrowAutohide(); // Re-setup autohide when navigating
  }
}

function showPreviousImage() {
  if (currentImageIndex > 0) {
    currentImageIndex--;
    $("#lightboxImage").attr("src", currentFolderImages[currentImageIndex]);
    updateNavigationArrows();
    setupArrowAutohide(); // Re-setup autohide when navigating
  }
}

let arrowHideTimeout;
let mouseMoveThrottle;

function setupArrowAutohide() {
  // Show arrows
  $("#prevImage, #nextImage").removeClass("arrow-hidden");
  
  // Clear any existing timeout
  if (arrowHideTimeout) {
    clearTimeout(arrowHideTimeout);
  }
  
  // Hide arrows after 2 seconds of inactivity
  arrowHideTimeout = setTimeout(() => {
    $("#prevImage, #nextImage").addClass("arrow-hidden");
  }, 2000);
}

function closeGallery() {
  $("#galleryModal").addClass("hidden").removeClass("flex");
}

function closeLightbox() {
  $("#lightbox").addClass("hidden").removeClass("flex");
  // Clear arrow hide timeout when closing lightbox
  if (arrowHideTimeout) {
    clearTimeout(arrowHideTimeout);
  }
  // Clear mousemove throttle
  if (mouseMoveThrottle) {
    clearTimeout(mouseMoveThrottle);
    mouseMoveThrottle = null;
  }
}

// Event handlers for closing modals
$(document).on("click", "#closeGallery", closeGallery);
$(document).on("click", "#closeLightbox", closeLightbox);

// Event handlers for navigation arrows
$(document).on("click", "#nextImage", showNextImage);
$(document).on("click", "#prevImage", showPreviousImage);

// Close lightbox when clicking outside the image
$(document).on("click", "#lightbox", function(e) {
  if (e.target.id === "lightbox") {
    closeLightbox();
  }
});

// Keyboard navigation
$(document).on("keydown", function(e) {
  if (e.key === "Escape") {
    closeGallery();
    closeLightbox();
  } else if ($("#lightbox").hasClass("flex")) {
    // Navigation only works when lightbox is open
    if (e.key === "ArrowRight") {
      showNextImage();
    } else if (e.key === "ArrowLeft") {
      showPreviousImage();
    }
  }
});

// Show arrows on mouse move in lightbox (throttled to reduce excessive calls)
$(document).on("mousemove", "#lightbox", function() {
  if ($("#lightbox").hasClass("flex")) {
    // Throttle mousemove events to run at most once every 200ms
    if (!mouseMoveThrottle) {
      setupArrowAutohide();
      mouseMoveThrottle = setTimeout(() => {
        mouseMoveThrottle = null;
      }, 200);
    }
  }
});

// Touch/Swipe support for image navigation
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;
let touchIdentifier = null;

$(document).on("touchstart", "#lightbox", function(e) {
  if ($("#lightbox").hasClass("flex") && e.touches.length === 1) {
    const touch = e.touches[0];
    touchStartX = touch.screenX;
    touchStartY = touch.screenY;
    touchIdentifier = touch.identifier;
  }
});

$(document).on("touchend", "#lightbox", function(e) {
  if ($("#lightbox").hasClass("flex") && touchIdentifier !== null) {
    // Find the touch that matches our stored identifier
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdentifier) {
        touchEndX = e.changedTouches[i].screenX;
        touchEndY = e.changedTouches[i].screenY;
        handleSwipeGesture();
        touchIdentifier = null;
        break;
      }
    }
  }
});

function handleSwipeGesture() {
  const swipeThreshold = 50; // Minimum distance for a swipe
  const swipeDistanceX = touchEndX - touchStartX;
  const swipeDistanceY = Math.abs(touchEndY - touchStartY);
  
  // Only trigger swipe if horizontal movement is greater than vertical
  // This prevents accidental swipes when scrolling
  if (Math.abs(swipeDistanceX) > swipeThreshold && Math.abs(swipeDistanceX) > swipeDistanceY) {
    if (swipeDistanceX > 0) {
      // Swipe right - show previous image
      showPreviousImage();
    } else {
      // Swipe left - show next image
      showNextImage();
    }
  }
}
