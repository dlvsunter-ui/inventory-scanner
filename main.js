const params = new URLSearchParams(location.search);
const RETURN_URL = params.get("return") || "";

const statusEl = document.getElementById("status");
const selectEl = document.getElementById("cameraSelect");
const backBtn = document.getElementById("backBtn");

let html5QrCode;
let currentCamId;

backBtn.onclick = () => {
  if(RETURN_URL) location.href = RETURN_URL;
  else alert("Tidak ada URL aplikasi utama.");
};

async function listCameras(){
  const cams = await Html5Qrcode.getCameras();
  cams.forEach(c => {
    const o = document.createElement("option");
    o.value = c.id;
    o.innerText = c.label || "Kamera";
    selectEl.appendChild(o);
  });

  const back = cams.find(c => /back|rear|environment/i.test(c.label));
  currentCamId = back?.id || cams[0].id;
  selectEl.value = currentCamId;
}

selectEl.onchange = () => {
  currentCamId = selectEl.value;
  html5QrCode.stop().then(startScan);
};

async function startScan(){
  statusEl.innerText = "Mengaktifkan kamera...";

  html5QrCode = new Html5Qrcode("reader");

  await html5QrCode.start(
    { deviceId: { exact: currentCamId } },
    { fps: 10, qrbox: 250 },
    text => {
      html5QrCode.stop().then(() => {
        location.href = RETURN_URL + "?code=" + encodeURIComponent(text);
      });
    }
  );

  statusEl.innerText = "Arahkan ke barcode...";
}

// AUTO-START
(async () => {
  await listCameras();
  await startScan();
})();
