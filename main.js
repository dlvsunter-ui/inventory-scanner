// Baca parameter ?return=<web app url>
const params = new URLSearchParams(location.search);
const RETURN_URL = params.get('return') || '';
const DEFAULT_RETURN_URL = ''; // opsional fallback

const statusEl = document.getElementById('status');
const selectEl = document.getElementById('cameraSelect');
const backBtn  = document.getElementById('backBtn');

let html5QrCode;
let currentCamId;

function goBack() {
  const target = RETURN_URL || DEFAULT_RETURN_URL;
  if (target) location.href = target;
  else alert('Tidak ada URL aplikasi utama. Buka halaman ini dari tombol "SCAN (GitHub)" di aplikasi.');
}

backBtn.addEventListener('click', goBack);

async function listCameras() {
  try {
    const devices = await Html5Qrcode.getCameras();
    selectEl.innerHTML = '';
    devices.forEach((d, i) => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.label || `Kamera ${i + 1}`;
      selectEl.appendChild(opt);
    });
    const back = devices.find(d => /back|rear|environment/i.test(d.label));
    currentCamId = back?.id || devices[0]?.id;
    if (currentCamId) selectEl.value = currentCamId;
  } catch (e) {
    statusEl.textContent = 'Gagal membaca daftar kamera: ' + e;
  }
}

selectEl.addEventListener('change', () => {
  currentCamId = selectEl.value;
  try { html5QrCode?.stop().then(() => start()); } catch(_) {}
});

async function start() {
  try {
    if (!currentCamId) { await listCameras(); }
    if (!currentCamId) { statusEl.textContent = 'Tidak ada kamera ditemukan.'; return; }

    statusEl.textContent = 'Membuka kamera...';
    html5QrCode = html5QrCode || new Html5Qrcode("reader");

    await html5QrCode.start(
      { deviceId: { exact: currentCamId } },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        html5QrCode.stop().then(() => {
          try { navigator.vibrate?.(50); } catch(_) {}
          const target = (RETURN_URL || DEFAULT_RETURN_URL);
          if (!target) {
            alert('Berhasil scan: ' + decodedText + '\nTetapi URL kembali tidak diketahui.');
            return;
          }
          location.replace(target + '?code=' + encodeURIComponent(decodedText));
        });
      },
      () => { /* ignore frame tanpa barcode */ }
    );
    statusEl.textContent = 'Arahkan ke barcode/QR.';
  } catch (e) {
    statusEl.textContent = 'Tidak bisa memulai kamera: ' + e;
  }
}

// 🚀 Auto-start ketika halaman dibuka
(async () => {
  await listCameras();
  await start();
})();
