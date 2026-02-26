// ==== KONFIG ====  <<<--- GANTI DI SINI
const API_URL = "https://script.google.com/macros/s/AKfycbxdbC6l1GKBT-EYeCbm6hPfIUnEaCNLB6TBDxyvuBY_3QnCm0XCztubbPyuCRRMoURtxQ/exec";

// simpan agar chart.html bisa pakai juga
localStorage.setItem('API_URL', API_URL);

// ====== STATE ======
let master = [];

// ====== INIT ======
window.addEventListener('DOMContentLoaded', () => {
  // Tombol
  document.getElementById('btnScan').onclick   = openScannerTabAuto;
  document.getElementById('btnSimpan').onclick = simpan;
  document.getElementById('btnExcel').onclick  = downloadExcel;
  document.getElementById('fabChart').onclick  = () => window.location = 'chart.html';
  document.getElementById('btnStok').onclick   = openStokModal;
  document.getElementById('closeStok').onclick = closeStokModal;

  // Input
  document.getElementById('namaBarang').addEventListener('change', setBarang);

  // Load awal
  loadData();
});

// ====== FUNGSI ======
async function loadData() {
  const res = await fetch(API_URL);
  const data = await res.json();
  master = data.db; // {id,nama,kategori,satuan,stok,safety,img}

  // isi datalist
  document.getElementById('listBarang').innerHTML =
    master.map(m => `<option value="${m.nama}">`).join('');

  // kritis
  document.getElementById('kritisList').innerHTML =
    data.kritis.map(k => `<div class="card-kritis"><b>${k.nama}</b><br>Sisa: ${k.stok}</div>`).join('');

  // history
  document.getElementById('historyList').innerHTML =
    data.history.map(h => `
      <div class="history-item">
        <span class="badge" style="background:${h.tipe==='Masuk'?'#16a34a':'#dc2626'}">${h.tipe}</span>
        <b>${h.nama}</b> (${h.qty})<br/>
        <small>${h.tgl} | ${h.cust}</small>
      </div>
    `).join('');

  // render modal stok (bergambar)
  renderStockGrid(master);

  // kalau kembali dari scanner dengan ?code=...
  const code = new URLSearchParams(location.search).get('code');
  if (code) {
    afterScan(code);
  }
}

function setBarang() {
  const nama = document.getElementById('namaBarang').value;
  const item = master.find(m => m.nama === nama);
  if (!item) return;

  document.getElementById('idBarang').value = item.id;
  document.getElementById('stokDisplay').innerText = item.stok;
  document.getElementById('namaDisplay').innerText = item.nama;
}

async function simpan() {
  const payload = {
    id:   document.getElementById('idBarang').value,
    nama: document.getElementById('namaBarang').value,
    tipe: document.getElementById('tipe').value,
    qty:  document.getElementById('qty').value,
    cust: document.getElementById('cust').value
  };

  if (!payload.id || !payload.qty) {
    alert('⚠️ Pilih barang & isi Qty.');
    return;
  }

  await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });

  alert('✅ Tersimpan!');
  // Reset
  document.getElementById('namaBarang').value = '';
  document.getElementById('idBarang').value   = '';
  document.getElementById('qty').value        = '';
  document.getElementById('cust').value       = '';
  document.getElementById('stokDisplay').innerText = '-';
  document.getElementById('namaDisplay').innerText = 'Pilih barang untuk cek stok';

  loadData();
}

function afterScan(code) {
  const item = master.find(m => m.id === code);
  if (!item) { alert('Barcode tidak ditemukan'); return; }

  document.getElementById('namaBarang').value = item.nama;
  setBarang();
  document.getElementById('qty').focus();

  // bersihkan query
  history.replaceState({}, '', 'index.html');
}

// ==== DATA STOK (modal bergambar) ====
function openStokModal(){ document.getElementById('modalStok').style.display = 'flex'; }
function closeStokModal(){ document.getElementById('modalStok').style.display = 'none'; }
function renderStockGrid(list){
  const el = document.getElementById('stockGrid');
  const iconSVG = (cat) => {
    // Ikon default berdasarkan kategori (fallback)
    return `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#2563eb" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4h16v2H4V4zm0 4h10v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z"/>
      </svg>`;
  };

  el.innerHTML = list.map(m => `
    <div class="stock-card">
      <div class="stock-thumb">
        ${m.img ? `<img src="${m.img}" alt="${m.nama}">` : iconSVG(m.kategori)}
      </div>
      <div class="stock-info">
        <div class="stock-name">${m.nama}</div>
        <div class="stock-meta">Stok: <b>${m.stok}</b> ${m.satuan || ''}</div>
      </div>
      <button class="btn btn-blue" style="width:auto;padding:8px 10px"
              onclick="pilihBarang('${encodeURIComponent(m.nama)}')">Pilih</button>
    </div>
  `).join('');
}
function pilihBarang(nmEncoded){
  const nm = decodeURIComponent(nmEncoded);
  document.getElementById('namaBarang').value = nm;
  setBarang();
  closeStokModal();
  document.getElementById('qty').focus();
}

// ==== EXPORT (CSV ringan) ====
function downloadExcel() {
  const rows = [['ID','Nama','Satuan','Stok'],
    ...master.map(m => [m.id, m.nama, m.satuan, m.stok])];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'Stok_Warehouse.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ==== SCAN: buka TAB BARU & auto-start ====
function openScannerTabAuto(){
  // kirim autostart=1 agar scanner mencoba langsung start kamera
  window.open('./scanner.html?autostart=1', '_blank');
}
