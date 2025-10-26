(() => {
  const BACKEND_BASE = 'https://autopass-backend.onrender.com';
  const API_CARS = `${BACKEND_BASE}/cars`;
  const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/auto-pass/gallery/main';
  const galleryEl = document.getElementById('gallery');

  function getQuery(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function getPlateFromUrl() {
    const qp = getQuery('plate');
    if (qp) return qp.trim();
    const path = location.pathname.replace(/\/+$/, '');
    const parts = path.split('/');
    const last = parts[parts.length - 1];
    if (last.toLowerCase().endsWith('.html')) {
      return parts.length > 1 ? parts[parts.length - 2] : null;
    }
    return last;
  }

  function showMessage(text) {
    if (!galleryEl) {
      document.body.innerHTML = `<div style="padding:20px">${text}</div>`;
      return;
    }
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
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.borderRadius = '6px';
      img.onerror = () => (wrap.style.display = 'none');
      // simple fullscreen on tap (optional)
      img.onclick = () => {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(()=>{});
        } else {
          img.requestFullscreen().catch(()=>{});
        }
      };
      wrap.appendChild(img);
      nodes.push(wrap);
    }
    return nodes;
  }

  function fmtNumber(n){
    if (n === undefined || n === null || n === '') return null;
    const num = Number(String(n).replace(/[^0-9.-]/g,''));
    if (Number.isNaN(num)) return null;
    return num.toLocaleString();
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

    // Only PHOTO gallery — no details/header (Version 1 "old" behavior)
    galleryEl.innerHTML = ''; // clear
    const nodes = buildImageElements(plate, picCount);
    nodes.forEach(n => {
      const wrapper = document.createElement('div');
      wrapper.style.width = '100%';
      wrapper.style.display = 'flex';
      wrapper.style.justifyContent = 'center';
      wrapper.style.marginBottom = '14px';
      wrapper.appendChild(n);
      galleryEl.appendChild(wrapper);
    });

    document.title = `${plate} — Gallery`;

    // Floating Back button (bottom-left)
    const returnParam = getQuery('return'); // e.g. 1700
    const backBtn = document.createElement('a');
    backBtn.href = returnParam ? `./index-${encodeURIComponent(returnParam)}.html` : 'javascript:history.back()';
    backBtn.textContent = '⬅ Kembali';
    Object.assign(backBtn.style, {
      position: 'fixed',
      left: '14px',
      bottom: '18px',
      zIndex: 9999,
      background: '#111',
      color: '#fff',
      padding: '10px 14px',
      borderRadius: '999px',
      textDecoration: 'none',
      boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
      fontWeight: 700,
      fontSize: '14px',
      opacity: 0.95
    });
    document.body.appendChild(backBtn);
  }

  // run only after DOM loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
