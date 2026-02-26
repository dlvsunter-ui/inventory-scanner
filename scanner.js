const RETURN_URL = './index.html';
let html5QrCode;
let currentCamId;

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnBack').onclick  = () => window.location = RETURN_URL;
  document.getElementById('startBtn').onclick = startScan;
  document.getElementById('camList').onchange = e => currentCamId = e.target.value;
  loadCameras();
});

async function loadCameras() {
  try {
    const devices = await Html5Qrcode.getCameras();
    const list = document.getElementById('camList');

    if (!devices || devices.length === 0) {
      document.getElementById('status').innerText = 'Tidak ada kamera terdeteksi.';
      return;
    }

    list.innerHTML = devices.map((d,i) =>
      `<option value="${d.id}">${d.label || 'Kamera ' + (i+1)}</option>`).join('');

    const back = devices.find(d => /back|rear|environment/i.test(d.label));
    currentCamId = back?.id || devices[0].id;
    list.value = currentCamId;

    document.getElementById('status').innerText = 'Pilih kamera lalu tekan Mulai Scan.';
  } catch (err) {
    document.getElementById('status').innerText = 'Gagal memuat kamera.';
  }
}

async function startScan() {
  try {
    document.getElementById('status').innerText = 'Mengaktifkan kamera...';
    html5QrCode = new Html5Qrcode('reader');

    await html5QrCode.start(
      { deviceId: { exact: currentCamId } },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        html5QrCode.stop().then(() => {
          window.location = `${RETURN_URL}?code=${encodeURIComponent(decodedText)}`;
        });
      }
    );

    document.getElementById('status').innerText = 'Arahkan kamera ke barcode.';
  } catch (err) {
    document.getElementById('status').innerText = 'Gagal membuka kamera. Pastikan izin diberikan.';
  }
}
