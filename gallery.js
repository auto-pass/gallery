// gallery.js
// Usage:
// https://auto-pass.github.io/gallery/?plate=SK3827B
// or
// https://auto-pass.github.io/gallery/SK3827B

(() => {
  const BACKEND_BASE = 'https://autopass-backend.onrender.com';
  const API_CARS = `${BACKEND_BASE}/cars`;
  const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/auto-pass/gallery/main';

  const galleryEl = document.getElementById('gallery');

  // Utility: get plate from either query ?plate= or path /PLATE
  function getPlateFromUrl() {
    // Try query param first
    const qp = new URLSearchParams(location.search).get('plate');
    if (qp) return qp.trim();
    // Fallback: path after last slash. Works if file served as /gallery/PLATE or /PLATE
    const path = (location.pathname || '').replace(/\/+$/, ''); // remove trailing slash
    const parts = path.split('/');
    const last = parts[parts.length - 1] || parts[parts.length - 2] || '';
    // if served as index.html, last may be 'gallery' – check second last
    if (!last) return null;
    // If last looks like filename (contains .html), ignore and check previous
    if (last.includes('.html')) {
      const prev = parts[parts.length - 2] || '';
      return prev || null;
    }
    // last might be the folder name; return it
    return last || null;
  }

  function showMessage(text) {
    galleryEl.innerHTML = `<div class="msg">${text}</div>`;
  }

  async function fetchCars() {
    try {
      const res = await fetch(API_CARS, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    } catch (err) {
      throw new Error(`Failed to fetch cars API: ${err.message}`);
    }
  }

  function buildImageElements(plate, picCount) {
    const nodes = [];
    for (let i = 1; i <= picCount; i++) {
      const imgUrl = `${GITHUB_RAW_BASE}/${encodeURIComponent(plate)}/${i}.jpg`;
      // create wrapper and image
      const wrapper = document.createElement('div');
      wrapper.className = 'photo';
      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = `${plate} ${i}`;
      // If an image fails, hide its container to keep page clean
      img.onerror = () => { wrapper.style.display = 'none'; };
      // Use lazy loading to avoid huge bandwidth on first paint, but original size is preserved
      img.loading = 'lazy';
      wrapper.appendChild(img);
      nodes.push(wrapper);
    }
    return nodes;
  }

  async function run() {
    const rawPlate = getPlateFromUrl();
    const plate = rawPlate ? rawPlate.trim().toUpperCase() : null;

    if (!plate) {
      showMessage('❌ No plate provided in URL. Use ?plate=SK3827B or .../SK3827B');
      return;
    }

    // Fetch cars list
    let cars;
    try {
      cars = await fetchCars();
    } catch (err) {
      showMessage(`❌ ${err.message}`);
      return;
    }

    // Find car by plate (case-insensitive)
    const car = cars.find(c => String(c.PlateNumber || '').toUpperCase() === plate);
    if (!car) {
      showMessage(`❌ Car not found: ${plate}`);
      return;
    }

    const picCount = Number(car.PicCount || car.Piccount || car.PicCount || 0);
    if (!picCount || picCount <= 0) {
      showMessage(`❌ No photos defined for ${plate}`);
      return;
    }

    // Build and append images in order
    const nodes = buildImageElements(plate, picCount);
    // Clear and append
    galleryEl.innerHTML = '';
    nodes.forEach(n => galleryEl.appendChild(n));

    // Set page title for usability
    document.title = `${plate} — Gallery`;
  }

  // Start
  run();
})();