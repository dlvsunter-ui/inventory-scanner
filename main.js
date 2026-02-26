const params = new URLSearchParams(location.search);
const RETURN_URL = params.get("return") || "";

const statusEl = document.getElementById("status");
const selectEl = document.getElementById("cameraSelect");
const startBtn = document.getElementById("startBtn");
const backBtn = document.getElementById("backBtn");

let html5QrCode;
let currentCamId;

// kembali ke Apps Script
backBtn.onclick = () => {
  if (RETURN_URL) location.href = RETURN_URL;
  else alert("Tidak ada URL kembali.");
};

// tampilkan daftar kamera
async function loadCameras() {
  try {
    const devices = await Html5Qrcode.getCameras();

    if (!devices || devices.length === 0) {
      statusEl.innerText = "Tidak ada kamera terdeteksi.";
      return;
    }

    selectEl.innerHTML = "";
    devices.forEach((d, i) => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.innerText = d.label || `Kamera ${i+1}`;
      selectEl.appendChild(opt);
    });

    const backCam = devices.find(d => /back|rear|environment/i.test(d.label));
    currentCamId = backCam?.id || devices[0].id;
    selectEl.value = currentCamId;

    statusEl.innerText = "Pilih kamera lalu tekan Mulai Scan.";
  } catch (err) {
    statusEl.innerText = "Gagal memuat kamera.";
  }
}

selectEl.onchange = () => currentCamId = selectEl.value;

// mulai scan setelah user TAP tombol (agar kamera diizinkan)
startBtn.onclick = async () => {
  try {
    statusEl.innerText = "Mengaktifkan kamera...";
    startBtn.disabled = true;

    html5QrCode = new Html5Qrcode("reader");

    await html5QrCode.start(
      { deviceId: { exact: currentCamId } },
      { fps: 10, qrbox: 250 },
      decodedText => {
        html5QrCode.stop().then(() => {
          location.href = RETURN_URL + "?code=" + encodeURIComponent(decodedText);
        });
      }
    );

    statusEl.innerText = "Arahkan kamera ke barcode";
  } catch (err) {
    statusEl.innerText = "Gagal membuka kamera.";
    startBtn.disabled = false;
  }
};

// load kamera saat halaman dibuka
loadCameras();
