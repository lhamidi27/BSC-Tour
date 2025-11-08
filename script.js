mapboxgl.accessToken = 'pk.eyJ1IjoibGhhbWlkaSIsImEiOiJjbHNsMHRtNTIwNmluMmpuMGcwYzBxbzFhIn0.FwPiicFAWPPYHUDC1-W_6w';

// Load basemap
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/lhamidi/cmh9r33dq00qm01sre58d36ru',
  center: [-122.255, 37.87],
  zoom: 14.5
});

// Intro page toggle
document.getElementById('start-map-button').addEventListener('click', () => {
  document.getElementById('intro-page').style.display = 'none';
  document.getElementById('map').style.display = 'block';
  map.resize();
});

// Sidebar setup
const sidebar = document.getElementById('sidebar');
const desc = document.getElementById('sidebar-desc');
const closeSidebar = document.getElementById('close-sidebar');

function openSidebar(html) {
  desc.innerHTML = html;
  sidebar.classList.add('open');
}

closeSidebar.addEventListener('click', () => sidebar.classList.remove('open'));

// Track first click for subtitle removal
let firstClick = true;

// Load GeoJSON and map layers
map.on('load', function () {
  const geojsonURL = 'https://raw.githubusercontent.com/lhamidi27/BSC-Tour/refs/heads/main/data/BSC_Tour.geojson';

  map.addSource('points-data', {
    type: 'geojson',
    data: geojsonURL
  });

  map.addLayer({
    id: 'coops',
    type: 'circle',
    source: 'points-data',
    paint: {
      'circle-color': [
        'match',
        ['get', 'Type'],
        'House', '#008767',
        'Apartment', '#a200ca',
        '#888888'
      ],
      'circle-radius': 8,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff'
    }
  });

  // Legend
  const legend = document.createElement('div');
  legend.id = 'legend';
  legend.innerHTML = `
    <div><span class="legend-key" style="background-color:#008767"></span> Co-op Houses</div>
    <div><span class="legend-key" style="background-color:#a200ca"></span> Co-op Apartments</div>
  `;
  map.getContainer().appendChild(legend);

  // Fetch data for linking between co-ops
  let coopData = null;
  fetch(geojsonURL)
    .then(res => res.json())
    .then(data => { coopData = data; });

  // Function to display sidebar info
  function showSidebar(feature) {
    const p = feature.properties;

    const link1 = p["Path 1 Link"] && p["Path 1 Text"]
      ? `<a href="#" class="sidebar-link" data-code="${p["Path 1 Link"]}">&#x279C; ${p["Path 1 Text"]}</a>`
      : '';

    const link2 = p["Path 2 Link"] && p["Path 2 Text"]
      ? `<a href="#" class="sidebar-link" data-code="${p["Path 2 Link"]}">&#x279C; ${p["Path 2 Text"]}</a>`
      : '';

    const sidebarHTML = `
      <h3>${p.Name}</h3>
      <p><strong>Address:</strong> ${p.Address}</p>
      <p><strong>Theme:</strong> ${p.Theme}</p>
      <p><strong>Capacity:</strong> ${p.Capacity}</p>
      <p>${p.Rooms || ''}</p>
      <p>${p.Description || ''}</p>
      <br>
      <p><strong>Next stops:</strong></p>
      ${link1 ? `<p>${link1}</p>` : ''}
      ${link2 ? `<p>${link2}</p>` : ''}
      <br>
      ${p.Link ? `
        <div class="button-text">
          <button class="sidebar-link-btn" onclick="window.open('${p.Link}', '_blank')">
            Learn more at bsc.coop
          </button>
        </div>` : ''}
      <hr>
    `;

    openSidebar(sidebarHTML);

    // Handle sidebar internal links
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetCode = e.target.getAttribute('data-code');
        if (!coopData) return;
        const targetFeature = coopData.features.find(f => f.properties.Code === targetCode);
        if (targetFeature) {
          showSidebar(targetFeature);
          map.flyTo({ center: targetFeature.geometry.coordinates, zoom: 18 });
        } else {
          alert('Target co-op not found: ' + targetCode);
        }
      });
    });
  }

  // Marker click event — outside of showSidebar!
  map.on('click', 'coops', (e) => {
    const feature = e.features[0];
    showSidebar(feature);
    map.flyTo({ center: feature.geometry.coordinates, zoom: 18 });

    // Hide subtitle on first click
    if (firstClick) {
      const subtitle = document.getElementById('map-subtitle'); // ✅ make sure ID matches HTML
      if (subtitle) {
        subtitle.style.display = 'none';
      }
      firstClick = false;
    }
  });
});
