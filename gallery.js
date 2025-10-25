(() => {
  const BACKEND_BASE = 'https://autopass-backend.onrender.com';
  const API_CARS = `${BACKEND_BASE}/cars`;
  const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/auto-pass/gallery/main';

  const galleryEl = document.getElementById('gallery');

  function getPlateFromUrl() {
    // 1) check ?plate=
    const qp = new URLSearchParams(location.search).get('plate');
    if (qp) return qp.trim();

    // 2) fallback: last segment of path /gallery/PLATE
    const path = location.pathname.replace(/\/+$/, ''); // remove trailing slash
    const parts = path.split('/');
    const last = parts[parts.length - 1];

    // if last is index.html → treat previous as plate
    if (last.toLowerCase().endsWith('.html')) {
      return parts.length > 1 ? parts[parts.length - 2] : null;
    }

    // otherwise last IS the plate
    return last;
  }

  function showMessage(text) {
    galleryEl.innerHTML = `<div class="msg">${text}</div>`;
  }

  async function fetchCars() {
    const res = await fetch(API_CARS, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  }

  function buildImageElements(plate, picCount) {
    const nodes = [];
    for (let i = 1; i <= picCount; i++) {
      const url = `${GITHUB_RAW_BASE}/${encodeURIComponent(plate)}/${i}.jpg`;
      const wrap = document.createElement('div');
      wrap.className = 'photo';
      const img = document.createElement('img');
      img.src = url;
      img.alt = `${plate} ${i}`;
      img.loading = 'lazy';
      img.onerror = () => (wrap.style.display = 'none');
      wrap.appendChild(img);
      nodes.push(wrap);
    }
    return nodes;
  }

  async function run() {
    const plate = (getPlateFromUrl() || '').toUpperCase();

    if (!plate) {
      showMessage('❌ Provide plate in URL: ?plate=SK3827B or /gallery/SK3827B');
      return;
    }

    let cars;
    try {
      cars = await fetchCars();
    } catch (e) {
      showMessage(`❌ ${e.message}`);
      return;
    }

    const car = cars.find(c => String(c.PlateNumber || '').toUpperCase() === plate);
    if (!car) {
      showMessage(`❌ Car not found: ${plate}`);
      return;
    }

    const picCount = Number(car.PicCount || 0);
    if (!picCount) {
      showMessage(`❌ No photos for ${plate}`);
      return;
    }

    const nodes = buildImageElements(plate, picCount);
    galleryEl.innerHTML = '';
    nodes.forEach(n => galleryEl.appendChild(n));
    document.title = `${plate} — Gallery`;
  }

  run();
})();
