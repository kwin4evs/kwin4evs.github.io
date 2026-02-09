let map;

async function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 5,
    center: { lat: 12.8797, lng: 121.7740 }
  });

  const res = await fetch("manifest.json");
  const locations = await res.json();

  const markers = locations.map(loc => {
    const marker = new google.maps.Marker({
      position: { lat: loc.lat, lng: loc.lng },
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

    marker.addListener("click", () => openGallery(loc));
    return marker;
  });

  new markerClusterer.MarkerClusterer({ map, markers });
}

function openGallery(loc) {
  const dir = `images/${loc.path}`;
  $("#gallery").empty();

  // Set location name if available, otherwise use coordinates
  const locationName = loc.name || `${loc.lat.toFixed(4)}°, ${loc.lng.toFixed(4)}°`;
  $("#locationName").text(locationName);

  // Set description if available
  if (loc.description) {
    $("#locationDescription").text(loc.description).show();
  } else {
    $("#locationDescription").hide();
  }

  for (let i = 1; i <= 5; i++) {
    $("#gallery").append(`<img src='${dir}/${i}.jpg' class='rounded-xl object-cover w-full h-48 shadow-md' />`);
  }

  $("#galleryModal").removeClass("hidden").addClass("flex");
}

$("#closeGallery").on("click", () => {
  $("#galleryModal").addClass("hidden").removeClass("flex");
});
