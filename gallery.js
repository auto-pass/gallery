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
      // fullscreen on tap
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

    // Render header info above photos
    const header = document.createElement('div');
    header.style.width = '100%';
    header.style.maxWidth = '1400px';
    header.style.margin = '0 auto 16px';
    header.style.padding = '12px';
    header.style.background = 'rgba(255,255,255,0.04)';
    header.style.borderRadius = '8px';
    header.style.boxSizing = 'border-box';
    header.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div style="min-width:0">
          <div style="font-weight:800;font-size:18px;margin-bottom:6px">
            ${(car.Brand||'').toUpperCase()} ${(car.Model||'').toUpperCase()} ${(car.Spec||'').toUpperCase()} ${(car.Year||'')}
          </div>
          ${fmtNumber(car.OTR) ? `<div style="font-weight:700;margin-bottom:6px">RM ${fmtNumber(car.OTR)}</div>` : ''}
          <div style="font-weight:600;color:#ddd">BULANAN ${car.Monthly || '-'} UTK ${car.Tenure || '-'} TAHUN</div>
        </div>
        <div style="text-align:right;">
          ${car.Status ? `<div style="color:#ff6b6b;font-weight:800">${car.Status}</div>` : ''}
          ${car.Description ? `<div style="color:#bbb;margin-top:8px;max-width:380px">${String(car.Description).slice(0,220)}</div>` : ''}
        </div>
      </div>
    `;
    galleryEl.innerHTML = '';
    galleryEl.appendChild(header);

    const nodes = buildImageElements(plate, picCount);
    nodes.forEach(n => galleryEl.appendChild(n));
    document.title = `${plate} — Gallery`;

    // Floating back button bottom-left (option C)
    const returnParam = getQuery('return'); // e.g. 1700
    const backBtn = document.createElement('a');
    backBtn.href = returnParam ? `./index-${encodeURIComponent(returnParam)}.html` : 'javascript:history.back()';
    backBtn.textContent = '⬅ Kembali';
    Object.assign(backBtn.style, {
      position: 'fixed',
      left: '16px',
      bottom: '20px',
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

  run();
})();
