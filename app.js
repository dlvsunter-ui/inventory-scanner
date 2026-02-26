// ==== KONFIG ====
// Ganti dengan URL Web App (/exec) Apps Script Mas
const API_URL = "https://script.google.com/macros/s/AKfycbxdbC6l1GKBT-EYeCbm6hPfIUnEaCNLB6TBDxyvuBY_3QnCm0XCztubbPyuCRRMoURtxQ/exec";

// ====== STATE ======
let master = [];

// ====== INIT ======
window.addEventListener('DOMContentLoaded', () => {
  // Tombol
  document.getElementById('btnScan').onclick   = () => window.open('./scanner.html', '_blank');
  document.getElementById('btnSimpan').onclick = simpan;
  document.getElementById('btnExcel').onclick  = downloadExcel;
  document.getElementById('fabChart').onclick  = () => alert('Halaman chart (opsional).');

  // Input
  document.getElementById('namaBarang').addEventListener('change', setBarang);

  // Load awal
  loadData();
});

// ====== FUNGSI ======
async function loadData() {
  const res = await fetch(API_URL);
  const data = await res.json();
  master = data.db; // [{id,nama,satuan,stok,safety}]

  // isi datalist
  document.getElementById('listBarang').innerHTML =
    master.map(m => `<option value="${m.nama}">`).join('');

  // kritis
  document.getElementById('kritisList').innerHTML =
    data.kritis.map(k => `<div class="card-kritis"><b>${k.nama}</b><br>Sisa: ${k.stok}</div>`).join('');

  // history (5 terakhir dari API)
  document.getElementById('historyList').innerHTML =
    data.history.map(h => `
      <div class="history-item">
        <span class="badge" style="background:${h.tipe==='Masuk'?'#16a34a':'#dc2626'}">${h.tipe}</span>
        <b>${h.nama}</b> (${h.qty})<br/>
        <small>${h.tgl} | ${h.cust}</small>
      </div>
    `).join('');

  // jika kembali dari scanner dengan ?code=...
  const code = new URLSearchParams(location.search).get('code');
  if (code) afterScan(code);
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

// export CSV cepat dari master
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
