// ========================================================
// 1. LOGIKA MUSIK & SISTEM DASAR
// ========================================================

const audio = document.getElementById('bgMusic');

// Cek status mute sebelumnya dari memori browser agar konsisten saat pindah halaman
let isMuted = localStorage.getItem('musicMuted') === 'true';

if (audio) { 
    audio.volume = 0.4; 
    audio.muted = isMuted; // Terapkan status mute terakhir
}

// Fungsi memutar musik saat pertama kali layar diklik siswa
function playAudio() { 
    if (audio && audio.paused && !isMuted) { 
        audio.play().catch(err => console.log("Audio play diblokir browser sebelum interaksi."));
    } 
}
document.addEventListener("click", playAudio, { once: true });

// FUNGSI UTAMA TOMBOL MUTE (Hubungkan dengan onclick="toggleMute()" di HTML)
function toggleMusic() {
    if (!audio) return;
    
    isMuted = !isMuted; // Balikkan status true/false
    audio.muted = isMuted;
    
    // Perintah tegas untuk menghentikan atau memutar musik
    if (isMuted) {
        audio.pause(); 
    } else {
        audio.play().catch(err => console.log("Gagal memutar kembali: ", err));
    }
    
    // Simpan status ke memori browser agar konsisten saat pindah halaman/sub-materi
    localStorage.setItem('musicMuted', isMuted);
    
    // Solusi Masalah Ganda: Cari tombol di kedua halaman (baik id muteBtn maupun kelas nav-icon)
    const btnMute = document.getElementById('muteBtn');
    if (btnMute) {
        btnMute.innerHTML = isMuted ? "🔇" : "🔊"; 
    }
}

// Pastikan setiap kali ganti halaman, musik tetap dipicu untuk berbunyi (jika tidak dimute)
function pastikanMusikMenyala() {
    if (audio && !isMuted && audio.paused) {
        audio.play().catch(err => console.log("Gagal memicu audio."));
    }
}

let progresMisi = parseInt(localStorage.getItem('progresMisi_Saka')) || 1;
const totalMisi = 7;
const gameContent = document.getElementById('game-content');

function updateSidebarLayout() {
    // 1. Atur gembok untuk tombol-tombol angka normal (1 sampai 7)
    for (let i = 1; i <= totalMisi; i++) {
        let tombol = document.getElementById('misi-' + i);
        if (!tombol) continue;
        tombol.classList.remove('locked', 'active');
        
        if (i < progresMisi) { 
            tombol.style.opacity = "1"; 
        } else if (i === progresMisi) { 
            // Catatan: Jika progres berada di misi angka, nyalakan tombolnya
            tombol.classList.add('active'); 
            tombol.style.opacity = "1"; 
        } else { 
            tombol.classList.add('locked'); 
        }
    }

    // 2. LOGIKA KHUSUS UNTUK TOMBOL "JUMLAH 2 KARTU"
    let tombolJumlah = document.getElementById('misi-jumlah');
    if (tombolJumlah) {
        tombolJumlah.classList.remove('locked', 'active');
        
        // Terbuka jika progresMisi sudah melewati atau sama dengan Tahap 5
        if (progresMisi >= 5) {
            tombolJumlah.style.opacity = "1";
            
            // Opsional: Jika Anda punya penanda status khusus saat menu ini aktif
            // Kode di pilihMisi('jumlah') akan otomatis menangani class 'active'-nya
        } else {
            tombolJumlah.classList.add('locked');
        }
    }
}
// ========================================================
// 2. STATE & KONFIGURASI TANTANGAN (SUB-LEVEL A)
// ========================================================
let faseSubA = 1; // 1: Belajar, 2: Tantangan
let kuisKeSubA = 1; 
let tierAktif = 1; // 1: 15s, 2: 10s, 3: 5s
let daftarSoalAcak = [];
let indeksSoal = 0;
let skorSesi = 0;
let timerValue = 0;
let timerInterval = null;
let pilihanJawaban = [];

const durasiTier = { 1: 20, 2: 15, 3: 10 };

// Algoritma Pengacakan Fisher-Yates (Benar-benar Murni Acak)
function kocokDaftarSoal() {
    daftarSoalAcak = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (let i = daftarSoalAcak.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [daftarSoalAcak[i], daftarSoalAcak[j]] = [daftarSoalAcak[j], daftarSoalAcak[i]];
    }
}

// ========================================================
// 3. CORE ENGINE VISUAL (KARTU SAKA PUTIK) - REVISI UKURAN & PEMBATAS
// ========================================================
function dapatkanPosisiTitikDadu(nilai) {
    switch(nilai) {
        case 1: return [7]; 
        case 2: return [7, 9]; 
        case 3: return [7, 9, 3]; 
        case 4: return [7, 9, 3, 1]; 
        case 5: return [7, 9, 3, 1, 5]; 
        default: return [];
    }
}

// Mengubah kartu tampilan utama di tengah layar
function generatePolaDots(n) {
    let dotsHTML = '<div class="card-saka">';
    
    [Math.max(0, n - 5), Math.min(n, 5)].forEach(val => {
        dotsHTML += `<div class="five-frame">`;
        let pos = dapatkanPosisiTitikDadu(val);
        for (let i = 1; i <= 9; i++) {
            dotsHTML += `<div class="dot ${pos.includes(i) ? 'active' : ''}"></div>`;
        }
        dotsHTML += `</div>`;
    });
    
    dotsHTML += '</div>';
    return dotsHTML;
}

// REVISI SEKALIGUS UNTUK GAME POLA: Membuat Kartu Kecil Berpembatas Tegas & Lebih Besar (7/10 kartu besar)
function generateMiniCard(n) {
    // Memberikan style border pembatas tengah antar frame dan ukuran yang proporsional (Lebar ~110px)
    let html = `
        <div class="card-mini" style="
            width: 110px; 
            background: #fff9c4; 
            border: 3px solid #2d5a27; 
            border-radius: 12px; 
            padding: 6px; 
            display: flex; 
            flex-direction: column; 
            gap: 6px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.15);
            flex-shrink: 0;
        ">`;
    
    // Looping Kotak Atas (Math.max) lalu Kotak Bawah (Math.min)
    [Math.max(0, n - 5), Math.min(n, 5)].forEach((val, indeksFrame) => {
        // Gaya bingkai mini dengan border-bottom khusus pada bingkai atas sebagai pembatas domino tengah
        let gayaGarisPembatas = (indeksFrame === 0) ? "border-bottom: 2px dashed #bcaaa4; padding-bottom: 6px;" : "";
        
        html += `<div class="mini-frame" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; ${gayaGarisPembatas}">`;
        let pos = dapatkanPosisiTitikDadu(val);
        for(let i=1; i<=9; i++) {
            html += `<div class="dot-mini ${pos.includes(i) ? 'active' : ''}"></div>`;
        }
        html += `</div>`;
    });
    
    html += `<div style="font-size: 14px; font-weight: bold; color: #2d5a27; text-align: center; margin-top: 4px;">${n}</div></div>`;
    return html;
}

// ========================================================
// REVISI SEGMEN ATAS: DERETAN PENUH 10 KARTU REFERENSI
// ========================================================
function generateBarisanSepuluhKartu() {
    let htmlBaris = `
        <div class="referensi-row" style="
            display: flex; 
            justify-content: center; 
            align-items: center; 
            gap: 12px; 
            width: 95%; 
            max-width: 1300px;
            overflow-x: auto; 
            padding: 15px 10px; 
            background: rgba(255, 255, 255, 0.9); 
            border-radius: 15px; 
            box-shadow: 0 6px 12px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            z-index: 10;
        ">`;
    for (let i = 1; i <= 10; i++) {
        htmlBaris += generateMiniCard(i);
    }
    htmlBaris += `</div>`;
    return htmlBaris;
}


// ========================================================
// 🛠️ FUNGSI HELPER & LOGIKA INTI DRAG-DROP MISI 2 (SUB B)
// ========================================================

// REVISI: Mencetak 9 lubang target dengan landasan lingkaran abu-abu samar (GHOST DOTS)
function generateLubangTargetHTML(posisi) {
    let html = '';
    for (let i = 1; i <= 9; i++) {
        // Gaya lingkaran bergaris tepi tipis agar siswa tahu area presisi penempatan pola
        html += `
            <div class="dot" data-index="${i}" data-box="${posisi}" 
                 ondragover="allowDropB(event)" ondrop="eksekusiDropB(event)"
                 style="border: 2px dashed #bdc3c7; background: transparent; transition: all 0.2s;">
            </div>`;
    }
    return html;
}

// Pemicu dasar Drag & Drop murni HTML5
window.mulaiGeser = function(e) {
    e.dataTransfer.setData("text/plain", e.target.id);
    e.target.style.opacity = "0.5"; // Efek transparan saat diangkat
}

window.allowDropB = function(e) {
    e.preventDefault(); // KRUSIAL: Membuka kunci gerbang drop browser agar mau menerima elemen
}

// Fungsi Modular Pemicu Utama Aktivitas Bermain Sub B
window.mulaiTahap2_1 = function() {
    window.tahapSubB = 1; 
    window.targetAngkaMisi2 = 6; 

    window.langkahBakuSekarang = 0;
    window.titikSuksesDipindah = 0;
    window.urutanBakuSaka = [7, 9, 3, 1, 5]; 

    const gameContent = document.getElementById('game-content');

    // 1. Tampilkan barisan lengkap 1 hingga 10 di sisi paling atas
    let htmlPanduan = generateBarisanSepuluhKartu();

    // 2. Desain area permainan utama dengan layout flexbox yang presisi
    let htmlAreaMain = `
        <h2 style="color:#2c3e50; font-size:22px; text-align:center; margin-bottom:20px; font-weight: 800; background: rgba(255,255,255,0.7); padding: 5px 15px; border-radius: 10px;">
            Susunlah Menjadi Pola Baku SAKA PUTIK!
        </h2>
        
        <div style="display:flex; justify-content:center; align-items:center; gap:60px; width:100%; max-width: 1100px;">
            
            <div class="card-saka" id="kartu-asal">
                <div class="five-frame">
                    <div class="dot active" draggable="true" id="drag-dot-1" ondragstart="mulaiGeser(event)" ondragend="this.style.opacity='1'" style="cursor: move;"></div>
                    <div class="dot active" draggable="true" id="drag-dot-2" ondragstart="mulaiGeser(event)" ondragend="this.style.opacity='1'" style="cursor: move;"></div>
                    <div class="dot active" draggable="true" id="drag-dot-3" ondragstart="mulaiGeser(event)" ondragend="this.style.opacity='1'" style="cursor: move;"></div>
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>
                <div class="five-frame">
                    <div class="dot active" draggable="true" id="drag-dot-4" ondragstart="mulaiGeser(event)" ondragend="this.style.opacity='1'" style="cursor: move;"></div>
                    <div class="dot active" draggable="true" id="drag-dot-5" ondragstart="mulaiGeser(event)" ondragend="this.style.opacity='1'" style="cursor: move;"></div>
                    <div class="dot active" draggable="true" id="drag-dot-6" ondragstart="mulaiGeser(event)" ondragend="this.style.opacity='1'" style="cursor: move;"></div>
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>
            </div>

            <div style="width:120px; text-align:center; flex-shrink: 0;">
                <div id="bilangan-tengah" style="font-size:64px; font-weight:bold; color:#27ae60; display:none; margin-bottom: 5px; text-shadow: 2px 2px 0px #fff;">
                    ${window.targetAngkaMisi2}
                </div>
                <div id="tanda-panah" style="font-size:45px; color:#2c3e50; animation: pulse 1s infinite alternate;">➡️</div>
            </div>

            <div class="card-saka" id="kartu-tujuan">
                <div class="five-frame" data-box="atas">
                    ${generateLubangTargetHTML('atas')}
                </div>
                <div class="five-frame" data-box="bawah">
                    ${generateLubangTargetHTML('bawah')}
                </div>
            </div>

        </div>

        <div id="pesan-salah-b" style="color:#e74c3c; font-weight:bold; text-align:center; height:25px; margin-top:15px; font-size: 18px; background: rgba(255,255,255,0.8); border-radius: 5px;"></div>
        <div id="centang-sukses" style="font-size:38px; color:#2ecc71; text-align:center; display:none; font-weight:bold; margin-top:15px; text-shadow: 1px 1px 2px #000;">✅ POLA BENAR!</div>
    `;

    // Gabungkan susunan atas dan area main ke wadah utama game
    gameContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; height: 100%;">
            ${htmlPanduan}
            ${htmlAreaMain}
        </div>
    `;
}

// Logika Validasi Peletakan Titik & Eksekusi Drop Murni JavaScript
window.eksekusiDropB = function(e) {
    e.preventDefault();
    const idData = e.dataTransfer.getData("text/plain");
    const elemenTitik = document.getElementById(idData);
    const pesanError = document.getElementById('pesan-salah-b');
    
    // Proteksi: Pastikan dilepas tepat di atas bulatan target
    if (!e.target.classList.contains('dot')) return;

    const nomorLubangDiklik = parseInt(e.target.getAttribute('data-index'));
    const posisiKotak = e.target.getAttribute('data-box');

    // Aturan 1: Wajib penuhi kotak bawah terlebih dahulu (Maksimal 5) sebelum mengisi kotak atas
    if (posisiKotak === 'atas' && window.titikSuksesDipindah < 5) {
        pesanError.innerText = "❌ Salah! Penuhi kotak bagian bawah terlebih dahulu!";
        setTimeout(() => { pesanError.innerText = ""; }, 2500);
        if (elemenTitik) elemenTitik.style.opacity = "1";
        return;
    }

    // Menentukan target nomor lubang yang sah berdasarkan sisa langkah pertumbuhan
    let targetLubangSah = window.urutanBakuSaka[window.langkahBakuSekarang % 5];

    // Aturan 2: Pencocokan urutan geometris pertumbuhan dadu SAKA
    if (nomorLubangDiklik === targetLubangSah) {
        // Transformasikan lubang kosong/samar menjadi titik merah aktif solid penuh
        e.target.classList.add('active'); 
        e.target.style.border = "none";
        e.target.style.backgroundColor = ""; // Mengembalikan kontrol visual penuh ke CSS asli Bapak
        
        // Singkirkan amunisi titik dari kartu asal kiri yang berhasil dipindah
        if (elemenTitik) elemenTitik.remove(); 
        pesanError.innerText = "";
        
        window.titikSuksesDipindah++;
        window.langkahBakuSekarang++;

        // Kondisi Finish: Jika 6 titik berhasil tertata sempurna sesuai panduan angka 6
        if (window.titikSuksesDipindah === window.targetAngkaMisi2) {
            document.getElementById('centang-sukses').style.display = 'block';
            document.getElementById('bilangan-tengah').style.display = 'block'; 
            console.log("Tahap 2.1 Berhasil!");
        }
    } else {
        pesanError.innerText = "❌ Titik menolak menempel! Ikuti urutan pertumbuhan baku SAKA PUTIK!";
        if (elemenTitik) elemenTitik.style.opacity = "1";
        setTimeout(() => { pesanError.innerText = ""; }, 2500);
    }
}


// ========================================================
// 4. LOGIKA PERMAINAN & TIMER
// ========================================================
function startTimer() {
    clearInterval(timerInterval);
    timerValue = durasiTier[tierAktif];
    updateTimerUI();
    
    timerInterval = setInterval(() => {
        timerValue--;
        updateTimerUI();
        if (timerValue <= 0) {
            clearInterval(timerInterval);
            prosesJawaban(null); 
        }
    }, 1000);
}

function updateTimerUI() {
    const bar = document.getElementById('timer-bar');
    if (!bar) return;
    let persen = (timerValue / durasiTier[tierAktif]) * 100;
    bar.style.width = persen + "%";
    
    bar.classList.remove('warning', 'danger');
    if (persen < 50) bar.classList.add('warning');
    if (persen < 25) bar.classList.add('danger');
}

function buatSoalBaru() {
    let target = daftarSoalAcak[indeksSoal];
    let s1, s2;
    do { s1 = Math.floor(Math.random() * 10) + 1; } while (s1 === target);
    do { s2 = Math.floor(Math.random() * 10) + 1; } while (s2 === target || s2 === s1);
    
    pilihanJawaban = [target, s1, s2].sort(() => Math.random() - 0.5);
    jalankanSubLevelA();
    startTimer();
}

let salahBerturutTurut = 0; 

function prosesJawaban(pilih) {
    clearInterval(timerInterval);
    let target = daftarSoalAcak[indeksSoal];
    const feedback = document.getElementById('feedback-area');

    if (pilih === target) {
        skorSesi++;
        salahBerturutTurut = 0; 
        feedback.innerHTML = `<div class="feedback-overlay" style="color: #2ecc71;">✅</div>`;
    } else {
        salahBerturutTurut++; 
        feedback.innerHTML = `<div class="feedback-overlay" style="color: #e74c3c;">❌</div>`;
        
        if (faseSubA === 2 && salahBerturutTurut >= 2) {
            alert(`Sstt... Coba perhatikan kartu nomor ${target} di atas yang berkedip! 😉`);
            
            const semuaMiniCard = document.querySelectorAll('.card-mini');
            if (semuaMiniCard[target - 1]) {
                semuaMiniCard[target - 1].style.border = "5px solid #e74c3c";
                semuaMiniCard[target - 1].style.backgroundColor = "#ffeb3b";
                semuaMiniCard[target - 1].style.transform = "scale(1.2)";
                semuaMiniCard[target - 1].style.transition = "all 0.3s";
                
                setTimeout(() => {
                    if (semuaMiniCard[target - 1]) {
                        semuaMiniCard[target - 1].style.border = "2px solid #2d5a27";
                        semuaMiniCard[target - 1].style.backgroundColor = "#fff9c4";
                        semuaMiniCard[target - 1].style.transform = "scale(1)";
                    }
                }, 3000);
            }
        }
    }

    setTimeout(() => {
        feedback.innerHTML = "";
        indeksSoal++;
        if (indeksSoal < 10) {
            buatSoalBaru();
        } else {
            tampilkanRingkasanTier();
        }
    }, 1200); 
}

function tampilkanRingkasanTier() {
    let lulus = skorSesi >= 7;
    let icon = lulus ? "🎉" : "😥";
    let warna = lulus ? "#2ecc71" : "#e74c3c";
    let pesan = lulus ? `Hebat! Kamu berhasil lolos Tahap ${tierAktif}!` : `Skor kamu belum mencapai 7. Ayo coba lagi di Tahap ini!`;
    
    gameContent.innerHTML = `
        <div style="display: flex; justify-content: center; width: 100%; margin-top: 40px;">
            <div class="summary-box">
                <h1 style="font-size: 80px; margin: 0;">${icon}</h1>
                <h2 style="color: ${warna}; font-size: 36px; margin: 10px 0;">SKOR: ${skorSesi} / 10</h2>
                <p style="font-size: 20px; font-weight: bold; margin: 20px 0; color: #34495e;">${pesan}</p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="ulangTier()" class="btn-dialog btn-ulang-total" style="background:#34495e; padding: 10px 20px; font-size: 16px;">MAIN LAGI TAHAP INI 🔄</button>
                    ${lulus ? `<button onclick="lanjutTier()" class="btn-dialog btn-lanjut-level" style="background:#2ecc71; padding: 10px 20px; font-size: 16px;">TAHAP BERIKUTNYA ➡️</button>` : ''}
                </div>
            </div>
        </div>
    `;
}

function ulangTier() {
    indeksSoal = 0; skorSesi = 0;
    kocokDaftarSoal(); buatSoalBaru();
}

function lanjutTier() {
    if (tierAktif < 3) {
        // Jika masih di bawah tingkat kecepatan 3, naikkan tier internal Pola Gambar
        tierAktif++;
        indeksSoal = 0; 
        skorSesi = 0;
        kocokDaftarSoal(); 
        buatSoalBaru();
    } else {
        // Jika sudah lulus tingkat kecepatan 3 (Artinya tamat Tahap 1 Pola Gambar)
        alert("Luar Biasa! 🏆 Kamu telah menguasai seluruh tingkat kecepatan Pola Gambar!");
        
        // 1. SINKRONISASI MEMORI: Naikkan progres belajar siswa ke urutan nomor 2 (Tahap 2 Makro)
        progresMisi = 2;
        localStorage.setItem('progresMisi_Saka', 2);
        
        // 2. UPDATE VISUAL SIDEBAR: Paksa gembok tombol nomor 2 (Pindah Titik) agar terbuka
        if (typeof updateSidebarLayout === 'function') {
            updateSidebarLayout();
        }
        
        // 3. ALIKHAN PANGGUNG: Pindahkan siswa secara resmi ke urutan nomor 2 (Tahap 2: Pindah Titik)
        pilihMisi(2);
    }
}

// ========================================================
// 5. RENDER LAYAR UTAMA (SUB-LEVEL A)
// ========================================================
function jalankanSubLevelA() {
    if (faseSubA === 1) {
        let numBar = '<div class="number-bar">';
        for (let i = 1; i <= 10; i++) numBar += `<button onclick="lompatKe(${i})" class="num-nav-btn ${i === kuisKeSubA ? 'active' : ''}">${i}</button>`;
        numBar += '</div>';

        gameContent.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                <div class="info-instruction-box"><h2>Tahap 1: Pengenalan Pola</h2><p>Pelajari pertumbuhan titik untuk tiap bilangan</p></div>
                <div class="main-display-wrapper">
                    <button onclick="prevInd()" class="arrow-nav-btn" ${kuisKeSubA === 1 ? 'disabled' : ''}>◀</button>
                    <div style="text-align: center;"><div>${generatePolaDots(kuisKeSubA)}</div><div class="score-badge-saka">${kuisKeSubA}</div></div>
                    <button onclick="nextInd()" class="arrow-nav-btn" ${kuisKeSubA === 10 ? 'disabled' : ''}>▶</button>
                </div>
                <div class="nav-pola-container">${numBar}<button onclick="startTantangan()" class="btn-dialog btn-lanjut-level" style="background:#e67e22; width:300px; margin-top:15px;">MULAI TANTANGAN 🚀</button></div>
            </div>`;
    } else {
        let refHTML = '<div class="referensi-row">';
        for(let i=1; i<=10; i++) refHTML += generateMiniCard(i);
        refHTML += '</div>';

        let pilHTML = pilihanJawaban.map(p => `<button onclick="prosesJawaban(${p})" class="btn-pilihan">${p}</button>`).join('');

        gameContent.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                ${refHTML}
                <div class="soal-indicator">Tahap ${tierAktif} (${durasiTier[tierAktif]} detik) - Soal ${indeksSoal + 1} / 10</div>
                <div class="timer-container"><div id="timer-bar" class="timer-bar"></div></div>
                <div class="info-instruction-box" style="margin: 10px 0;"><h2 style="font-size: 26px; color: #d35400; margin: 0;">AYO TEBAK, BERAPA NILAI KARTU INI?</h2></div>
                <div class="tantangan-container" style="margin-top:10px;">
                    ${generatePolaDots(daftarSoalAcak[indeksSoal])}
                    <div class="equals-sign">=</div>
                    <div class="pilihan-jawaban-container">${pilHTML}</div>
                </div>
            </div>
            <div id="feedback-area"></div>`;
    }
}

function lompatKe(n) { kuisKeSubA = n; jalankanSubLevelA(); }
function prevInd() { if (kuisKeSubA > 1) { kuisKeSubA--; jalankanSubLevelA(); } }
function nextInd() { if (kuisKeSubA < 10) { kuisKeSubA++; jalankanSubLevelA(); } }
function startTantangan() {
    if (confirm("Mulai tantangan Tahap 1 (Waktu: 15 detik per soal)?")) {
        faseSubA = 2; tierAktif = 1; skorSesi = 0; indeksSoal = 0;
        kocokDaftarSoal(); buatSoalBaru();
    }
}

// ========================================================================
// 6. LOGIKA GLOBAL SIDEBAR & NAVIGASI 7 MENU (LEVEL 1) - VERSI STERIL AMAN
// ========================================================================

// SINKRONISASI KUNCI: Disamakan dengan kunci penyimpanan Misi 1 Bapak (_Saka)
let nilaiAsesmenMisi1 = parseInt(localStorage.getItem('nilaiAsesmenMisi1_Saka')) || null;
let nilaiAsesmenMisi2 = parseInt(localStorage.getItem('skorAsesmenMisi2')) || null;

function pilihMisi(target) {
    // ====================================================================
    // 🔥 1. STERILISASI TOTAL: MATIKAN SEMUA TIMER SAAT KLIK TOMBOL APAPUN
    // ====================================================================
    console.log("Siswa berpindah menu. Menghentikan semua mesin game & timer...");
    if (typeof timerInterval !== 'undefined') clearInterval(timerInterval);
    if (typeof timerIntervalMisi2 !== 'undefined') clearInterval(timerIntervalMisi2);
    if (typeof countdownInterval !== 'undefined') clearInterval(countdownInterval);
    if (window.misi1_state && window.misi1_state.timerInterval) {
        clearInterval(window.misi1_state.timerInterval);
    }
    if (window.misi2_state && window.misi2_state.timerInterval) {
        clearInterval(window.misi2_state.timerInterval);
    }

    // ====================================================================
    // 📊 2. LOGIKA KHUSUS MENU HASIL BELAJAR (RAPOR)
    // ====================================================================
    if (target === 'hasil') {
        renderHasilBelajar();
        return;
    }

    // ====================================================================
    // ➕ 3. LOGIKA KHUSUS MENU JUMLAH 2 KARTU (FITUR BARU)
    // ====================================================================
    if (target === 'jumlah') {
        // Keamanan: Menu ini hanya boleh dibuka jika Tahap 5 sudah selesai
        if (progresMisi < 5) {
            alert("Tahap ini masih terkunci! Selesaikan tahap sebelumnya secara jujur dulu ya. 😊");
            return;
        }
        
        // Atur visual tombol aktif
        document.querySelectorAll('.mission-item').forEach(item => item.classList.remove('active'));
        const tombolJumlah = document.getElementById('misi-jumlah');
        if (tombolJumlah) tombolJumlah.classList.add('active');

        // Panggil fungsi panggung khusus (kita siapkan fungsinya di langkah berikutnya)
        if (typeof window.renderTahapJumlah2Kartu === "function") {
            window.renderTahapJumlah2Kartu();
        } else {
            document.getElementById('game-content').innerHTML = `
                <div style="text-align:center; padding-top:100px;">
                    <h2 style="color:#e67e22;">🚧 Menu Jumlah 2 Kartu 🚧</h2>
                    <p>Mesin permainan penjumlahan sedang disiapkan...</p>
                </div>`;
        }
        return;
    }
    
    let nomerMenu = parseInt(target);
    
    // ====================================================================
    // 🔒 4. GERBANG KEAMANAN SAKTI (Tahap Lama Tetap Terbuka, Tahap Depan Tergembok)
    // ====================================================================
    if (nomerMenu > progresMisi) {
        alert("Tahap ini masih terkunci! Selesaikan tahap sebelumnya secara jujur dulu ya. 😊");
        return;
    }
    
    document.querySelectorAll('.mission-item').forEach(item => item.classList.remove('active'));
    const tombolAktif = document.getElementById('misi-' + nomerMenu);
    if (tombolAktif) tombolAktif.classList.add('active');
    
    renderSoalMisi(nomerMenu);
}

function renderSoalMisi(nomer) {
    if (window.isTransisiTahap2 === true) {
        window.isTransisiTahap2 = false; // Reset status agar sistem normal kembali
        return; // Keluar dari fungsi, jangan jalankan "Sapu Bersih"
    }
    
    // ====================================================================
    // 🔥 SISTEM SAPU BERSIH: HENTIKAN SEMUA TIMER DI LATAR BELAKANG
    // ====================================================================
    // 1. Matikan timer bawaan navigasi (timerInterval global)
    
    if (typeof timerInterval !== 'undefined') {
        clearInterval(timerInterval); 
    }
    
    // 2. Bersihkan timer spesifik state Misi 1 jika siswa pindah di tengah jalan
    if (window.misi1_state && window.misi1_state.timerInterval) {
        clearInterval(window.misi1_state.timerInterval);
        console.log("Timer Misi 1 berhasil dihentikan.");
    }

    // 3. Bersihkan timer spesifik state Misi 2 jika siswa melompat ke menu lain
    if (window.misi2_state && window.misi2_state.timerInterval) {
        clearInterval(window.misi2_state.timerInterval);
        console.log("Timer Misi 2 berhasil dihentikan.");
    }
    
    // 4. Cadangan sapu bersih untuk variabel timer lokal lain (jika ada di tahap C, D, atau E)
    if (typeof timerIntervalMisi2 !== 'undefined') clearInterval(timerIntervalMisi2);
    if (typeof countdownInterval !== 'undefined') clearInterval(countdownInterval);

    // Lanjutkan menghidupkan musik pengiring game Bapak
    pastikanMusikMenyala();        

    // --------------------------------------------------------------------
    // LOGIKA PENANGANAN SOAL BAWAAN BAPAK (TIDAK ADA YANG DIHAPUS/DIUBAH)
    // --------------------------------------------------------------------
    if (nomer === 1) {
        faseSubA = 1; 
        kuisKeSubA = 1;
        jalankanSubLevelA();
    } 
    else if (nomer === 2) {
        const gameContent = document.getElementById('game-content');
        
        gameContent.innerHTML = `
            <div id="popup-aturan" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); border-radius:20px; display:flex; justify-content:center; align-items:center; z-index:100;">
                <div style="background:white; border:5px solid #27ae60; border-radius:20px; padding:35px; width:75%; text-align:center; box-shadow:0 10px 20px rgba(0,0,0,0.3); animation: popIn 0.3s;">
                    <h3 style="margin-top:0; color:#2c3e50; font-size:22px;">🎯 Tahap 2: Pindah Titik (Sub B)</h3>
                    <p style="color:#34495e; line-height:1.6; font-size:16px; margin-bottom:25px; text-align:center;">
                        Pada tahap ini kita akan belajar membentuk pola yang benar lalu menentukan nilainya. 
                        Tugasmu sekarang adalah memindahkan titik ke kartu yang tersedia agar membentuk pola yang benar.<br><br>
                        <strong>SELAMAT BERMAIN dan PANTANG MENYERAH!</strong>
                    </p>
                    <button onclick="document.getElementById('popup-aturan').remove(); mulaiTahap2_1();" style="background:#2ecc71; color:white; border:none; padding:12px 40px; font-size:18px; font-weight:bold; border-radius:12px; cursor:pointer; box-shadow:0 4px 0 #27ae60;">
                        MULAI BERMAIN 🔥
                    </button>
                </div>
            </div>
        `;
    } 
    else if (nomer === 3) {
        gameContent.innerHTML = ''; 
        if (typeof window.mulaiTahapCSenilai === "function") {
            window.mulaiTahapCSenilai();
        } else {
            console.error("Fungsi window.mulaiTahapCSenilai belum terpasang di bagian bawah file.");
        }
    } else if (nomer === 4) {
        const gameContent = document.getElementById('game-content');
        if (gameContent) gameContent.innerHTML = ''; 
        if (typeof window.tampilkanIntroTahapD === "function") {
            window.tampilkanIntroTahapD(); 
        } else {
            console.error("Fungsi window.tampilkanIntroTahapD belum terpasang.");
        }
    } else if (nomer === 5) {
        if (typeof window.tampilkanIntroTahapE === "function") {
            window.tampilkanIntroTahapE();
        } else {
            console.error("Fungsi window.tampilkanIntroTahapE belum terpasang di bawah.");
            const gameContent = document.getElementById('game-content');
            if (gameContent) {
                gameContent.innerHTML = `<p style="color:red; text-align:center;">Fungsi Tahap E belum ditemukan di file JS.</p>`;
            }
        }
    } else if (nomer === 6) {
        if (typeof window.tampilkanIntroMisi1 === "function") {
            window.tampilkanIntroMisi1();
        } else {
            console.error("Fungsi window.tampilkanIntroMisi1 belum terpasang.");
            const gameContent = document.getElementById('game-content');
            if (gameContent) {
                gameContent.innerHTML = `<p style="color:red; text-align:center;">Fungsi Misi 1 belum ditemukan di file JS.</p>`;
            }
        }
    } else if (nomer === 7) {
        //if (typeof progresMisi !== 'undefined' && progresMisi < 7) {
        //    progresMisi = 7;
        //}
    
        document.querySelectorAll('.mission-item').forEach(item => item.classList.remove('active'));
        const tombolMisi2Sidebar = document.getElementById('misi-7');
        // ... sisa kode ke bawahnya tetap sama ...
        if (tombolMisi2Sidebar) {
            tombolMisi2Sidebar.classList.add('active');
            tombolMisi2Sidebar.removeAttribute('disabled');
            tombolMisi2Sidebar.style.opacity = "1";
        }

        if (typeof window.inisialisasiMisi2 === "function") {
            window.inisialisasiMisi2();
        } else {
            console.error("Fungsi window.inisialisasiMisi2 belum terpasang di bagian bawah file.");
            const gameContent = document.getElementById('game-content');
            if (gameContent) {
                gameContent.innerHTML = `<p style="color:red; text-align:center;">Mesin utama Misi 2 belum ditemukan di bawah file JS.</p>`;
            }
        }
    }
}

function simulasikanSkorAsesmen(jenisMisi) {
    if (jenisMisi === 1) {
        nilaiAsesmenMisi1 = 8; 
        localStorage.setItem('nilaiAsesmenMisi1_Saka', nilaiAsesmenMisi1); // Disesuaikan kuncinya
        alert("Skor Misi 1 berhasil direkam sebagai data evaluasi!");
        simulasiBenar(6); 
    } else if (jenisMisi === 2) {
        nilaiAsesmenMisi2 = 9; 
        localStorage.setItem('skorAsesmenMisi2', nilaiAsesmenMisi2);
        alert("Skor Misi 2 berhasil direkam! Seluruh tahap Level 1 selesai.");
        simulasiBenar(7); 
    }
}

// ========================================================
// 🛠️ FUNGSI HELPER & MODULAR UNTUK MISI 2 (TAHAP 2.1)
// ========================================================

// Helper untuk mencetak 9 lubang kosong berindeks pada kartu kanan tujuan
function generateLubangTargetHTML(posisi) {
    let html = '';
    for (let i = 1; i <= 9; i++) {
        html += `<div class="dot" data-index="${i}" data-box="${posisi}" ondragover="allowDropB(event)" ondrop="eksekusiDropB(event)"></div>`;
    }
    return html;
}

// Fungsi dasar pengaktif sistem Drag & Drop browser
window.mulaiGeser = function(e) {
    e.dataTransfer.setData("text/plain", e.target.id);
}

window.allowDropB = function(e) {
    e.preventDefault();
}

// Fungsi Modular untuk memicu awal permainan Tahap 2.1 setelah Pop-up ditutup
// ========================================================
// REVISI SISTEM 10 LATIHAN & JALUR PINTAS ANAK GIFTED
// ========================================================

// Variabel Kontrol Global untuk Melacak Progres Latihan Siswa
window.rondeSekarang = 1;
window.totalRondeMisi = 10;
window.kumpulanAngkaMisi = [];

// Fungsi untuk membuat daftar 10 target angka acak khusus (Angka 2 sampai 9 saja)
function siapkanKumpulanAngkaMisi() {
    let angkaTersedia = [2, 3, 4, 5, 6, 7, 8, 9];
    window.kumpulanAngkaMisi = [];
    
    // Isi 10 ronde dengan mengambil acak dari angka yang tersedia
    for (let i = 0; i < window.totalRondeMisi; i++) {
        let indeksAcak = Math.floor(Math.random() * angkaTersedia.length);
        window.kumpulanAngkaMisi.push(angkaTersedia[indeksAcak]);
    }
}

// 2. INTI GAMEPLAY & GENERATOR LAYOUT
// ========================================================
// PERBAIKAN LOGIKA DRAG-DROP MISI 2 - SESUAI IDE PAK KOMANG
// ========================================================

window.rondeSekarang = 1;
window.totalRondeMisi = 10;
window.titikHarusDipindah = 0; // Melacak jumlah total titik aktif yang ada di kartu kiri

// 2. INTI GAMEPLAY & ATURAN VALIDASI DRAG DROP (MISI 2)
window.mulaiTahap2_1 = function() {
    window.tahapSubB = 1; 
    window.titikSuksesDipindah = 0;
    
    // Urutan peletakan baku SAKA PUTIK pada grid kartu tujuan
    window.urutanBakuBawah = [7, 9, 3, 1, 5]; 
    window.urutanBakuAtas = [7, 9, 3, 1, 5]; 

    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    // Posisi indeks sah yang boleh ditempati titik pada grid SAKA (4 sudut + 1 tengah)
    const indeksSahSaka = [1, 3, 5, 7, 9];
    
    // Acak jumlah total titik aktif untuk ronde ini (Angka 2 sampai 9 saja)
    let totalTitikRondeIni = Math.floor(Math.random() * 8) + 2; 
    window.titikHarusDipindah = totalTitikRondeIni;

    // Tentukan berapa banyak titik yang secara pakem harus ada di bawah dan di atas
    let jumlahBakuBawah = Math.min(totalTitikRondeIni, 5);
    let jumlahBakuAtas = Math.max(0, totalTitikRondeIni - 5);

    // Ambil formasi pola baku asli SAKA untuk pembanding
    let polaBakuBawah = window.urutanBakuBawah.slice(0, jumlahBakuBawah);
    let polaBakuAtas = window.urutanBakuAtas.slice(0, jumlahBakuAtas);

    let acakAtas = [];
    let acakBawah = [];
    let apakahSamaDenganBaku = true;

    // LOOPS VALIDASI: Lakukan pengacakan ulang terus-menerus JIKA hasilnya sama dengan pola baku
    while (apakahSamaDenganBaku) {
        acakBawah = [...indeksSahSaka].sort(() => 0.5 - Math.random()).slice(0, jumlahBakuBawah);
        acakAtas = [...indeksSahSaka].sort(() => 0.5 - Math.random()).slice(0, jumlahBakuAtas);

        // Urutkan angka indeks hasil acakan agar bisa dibandingkan dengan pola baku
        let cekBawah = [...acakBawah].sort((a, b) => a - b);
        let cekAtas = [...acakAtas].sort((a, b) => a - b);
        
        let bandingBakuBawah = [...polaBakuBawah].sort((a, b) => a - b);
        let bandingBakuAtas = [...polaBakuAtas].sort((a, b) => a - b);

        // Periksa apakah hasil acakan atas DAN bawah persis sama dengan susunan baku
        let bawahSama = JSON.stringify(cekBawah) === JSON.stringify(bandingBakuBawah);
        let atasSama = JSON.stringify(cekAtas) === JSON.stringify(bandingBakuAtas);

        // Jika tidak sama dengan pola baku, maka acakan lolos validasi dan loop dihentikan
        if (!(bawahSama && atasSama)) {
            apakahSamaDenganBaku = false;
        }
    }

    // Bangun HTML elemen berdasarkan hasil acak yang sudah divalidasi aman (bukan pola baku)
    let htmlFrameAsalAtas = '';
    let htmlFrameAsalBawah = '';

    for (let i = 1; i <= 9; i++) {
        if (!indeksSahSaka.includes(i)) {
            // Lubang terlarang (2, 4, 6, 8) tetap mati total
            htmlFrameAsalAtas += `<div class="dot" style="opacity: 0; cursor: default;"></div>`;
            htmlFrameAsalBawah += `<div class="dot" style="opacity: 0; cursor: default;"></div>`;
        } else {
            let isAtasActive = acakAtas.includes(i) ? 'active' : '';
            let isBawahActive = acakBawah.includes(i) ? 'active' : '';
            
            htmlFrameAsalAtas += `<div class="dot ${isAtasActive}" ${isAtasActive ? 'draggable="true" style="cursor: move;"' : ''}></div>`;
            htmlFrameAsalBawah += `<div class="dot ${isBawahActive}" ${isBawahActive ? 'draggable="true" style="cursor: move;"' : ''}></div>`;
        }
    }

    gameContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100vw; max-width: 100% !important; margin-top: -20px;">
            
            ${generateBarisanSepuluhKartu()}

            <h2 id="judul-misi-b" style="color:#c0392b; font-size:18px; text-align:center; margin: 8px 0; font-weight: 800; background: rgba(255,255,255,0.8); padding: 4px 20px; border-radius: 10px;">
                Pindahkan Semua Titik ke Kartu Kanan (Latihan ${window.rondeSekarang}/${window.totalRondeMisi})
            </h2>
            
            <div style="display:flex; justify-content:center; align-items:center; gap:50px; width:100%; margin-top: 10px;">
                
                <div class="card-saka" id="kartu-asal">
                    <div class="five-frame" data-box="atas">
                        ${htmlFrameAsalAtas}
                    </div>
                    <div class="five-frame" data-box="bawah">
                        ${htmlFrameAsalBawah}
                    </div>
                </div>

                <div style="text-align:center;">
                    <div style="font-size:50px; color:#2c3e50;">➡️</div>
                </div>

                <div class="card-saka" id="kartu-tujuan">
                    <div class="five-frame" data-box="atas">
                        <div class="dot target-landasan" data-index="1" data-box="atas"></div>
                        <div class="dot" data-index="2" data-box="atas" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="3" data-box="atas"></div>
                        <div class="dot" data-index="4" data-box="atas" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="5" data-box="atas"></div>
                        <div class="dot" data-index="6" data-box="atas" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="7" data-box="atas"></div>
                        <div class="dot" data-index="8" data-box="atas" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="9" data-box="atas"></div>
                    </div>
                    <div class="five-frame" data-box="bawah">
                        <div class="dot target-landasan" data-index="1" data-box="bawah"></div>
                        <div class="dot" data-index="2" data-box="bawah" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="3" data-box="bawah"></div>
                        <div class="dot" data-index="4" data-box="bawah" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="5" data-box="bawah"></div>
                        <div class="dot" data-index="6" data-box="bawah" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="7" data-box="bawah"></div>
                        <div class="dot" data-index="8" data-box="bawah" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="9" data-box="bawah"></div>
                    </div>
                </div>

            </div>

            <div id="pesan-salah-b" style="color:#e74c3c; font-weight:bold; text-align:center; height:25px; margin-top:10px; font-size: 18px;"></div>
            
            <div id="panel-sukses-gifted" style="display:none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; max-width: 400px; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 3px solid rgba(46, 204, 113, 0.6); padding: 20px; border-radius: 15px; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15); text-align: center; z-index: 999;">
    <div id="teks-keberhasilan" style="font-size: 20px; color: #1e7e34; font-weight: 800; margin-bottom: 15px; line-height: 1.4; text-shadow: 1px 1px 2px rgba(255,255,255,0.8);">
        HOREEEEE BERHASIL! 🎉
    </div>
    <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="btn-lanjut-latihan" style="padding: 10px 15px; font-size: 14px; font-weight: bold; background-color: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px #2980b9;">Latihan Selanjutnya</button>
        <button id="btn-selesai-tantangan" style="padding: 10px 15px; font-size: 14px; font-weight: bold; background-color: #e67e22; color: white; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px #d35400;">Selesaikan Tantangan</button>
    </div>
</div>
        </div>
    `;

    tempelEventDragDrop();
    // PASTIKAN KODE INI ADA DI BAGIAN BAWAH UTK MENGAKTIFKAN TOMBOL
const btnLanjut = document.getElementById('btn-lanjut-latihan');
const btnSelesai = document.getElementById('btn-selesai-tantangan');

if (btnLanjut) {
    btnLanjut.onclick = function() {
        // Sembunyikan pop-up terlebih dahulu
        document.getElementById('panel-sukses-gifted').style.display = 'none';
        
        if (window.rondeSekarang < window.totalRondeMisi) {
            window.rondeSekarang++;
            window.mulaiTahap2_1(); // Muat ulang soal berikutnya
        } else {
            alert("Semua latihan di Misi 2 telah selesai!");
        }
    };
}

if (btnSelesai) {
    btnSelesai.onclick = function() {
        document.getElementById('panel-sukses-gifted').style.display = 'none';
        // Arahkan ke halaman hasil belajar atau menu utama sesuai rancangan Anda
        if (typeof window.tampilkanHasilBelajar === "function") {
            window.tampilkanHasilBelajar();
        } else {
            alert("Tantangan Selesai! Kembali ke Menu Utama.");
            location.reload(); // Fallback jika tidak ada fungsi khusus
        }
    };
}
};

function tempelEventDragDrop() {
    const dotsSapi = document.querySelectorAll('#kartu-asal .dot.active');
    const targets = document.querySelectorAll('#kartu-tujuan .target-landasan');
    let elemenDiDrag = null;

    dotsSapi.forEach((dot, index) => {
        dot.id = `titik-asal-${index}`;
        dot.addEventListener('dragstart', function(e) {
            elemenDiDrag = this;
            this.style.opacity = '0.4';
        });
        dot.addEventListener('dragend', function() {
            this.style.opacity = '1';
        });
    });

    targets.forEach(target => {
        target.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });

        target.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });

        target.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const pesanError = document.getElementById('pesan-salah-b');
            const indeksTarget = parseInt(this.getAttribute('data-index'));
            const posisiKotak = this.getAttribute('data-box');

            if (posisiKotak === 'atas' && window.titikSuksesDipindah < 5) {
                pesanError.innerText = "❌ Penuhi pola kotak bagian bawah terlebih dahulu!";
                return;
            }

            let targetSah = 0;
            if (window.titikSuksesDipindah < 5) {
                targetSah = window.urutanBakuBawah[window.titikSuksesDipindah];
            } else {
                targetSah = window.urutanBakuAtas[window.titikSuksesDipindah - 5];
            }

            if (indeksTarget === targetSah && ((window.titikSuksesDipindah < 5 && posisiKotak === 'bawah') || (window.titikSuksesDipindah >= 5 && posisiKotak === 'atas'))) {
                this.classList.remove('target-landasan');
                this.classList.add('active');
                this.style.border = 'none';
                
                if (elemenDiDrag) elemenDiDrag.remove();
                pesanError.innerText = "";
                
                window.titikSuksesDipindah++;

                // KONDISI KETIKA SEMUA TITIK ASAL SELESAI DIPINDAHKAN SECARA SEMPURNA
                if (window.titikSuksesDipindah === window.titikHarusDipindah) {
                    const gameContent = document.getElementById('game-content');
                    
                    // Bersihkan pop-up lama jika sempat ada di memori agar tidak menumpuk
                    const popLama = document.getElementById('panel-sukses-gifted');
                    if (popLama) popLama.remove();

                    // 1. BUAT KOTAK DIALOG BARU: Lebih besar, transparan 40%, tanpa latar hitam raksasa
                    const divPopUp = document.createElement('div');
                    divPopUp.id = 'panel-sukses-gifted';
                    divPopUp.style.cssText = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; max-width: 550px; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 5px solid rgba(46, 204, 113, 0.7); padding: 35px 25px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); text-align: center; z-index: 999; display: flex; flex-direction: column; align-items: center; justify-content: center;";
                    
                    // Tulisan diperbesar & struktur tombol diatur vertikal memanjang penuh
                    divPopUp.innerHTML = `
                        <div id="teks-keberhasilan" style="font-size: 28px; color: #1e7e34; font-weight: 900; margin-bottom: 25px; line-height: 1.5; text-shadow: 2px 2px 4px rgba(255,255,255,0.9);">
                            Ada <span style="color:#c0392b; font-size:38px;">${window.titikSuksesDipindah}</span> titik.<br>HOREEEEE BERHASIL! 🎉
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 15px; width: 90%;">
                            <button id="btn-lanjut-latihan" style="width: 100%; padding: 14px; font-size: 18px; font-weight: bold; background-color: #3498db; color: white; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 4px #2980b9;">LATIHAN SELANJUTNYA</button>
                            <button id="btn-selesai-tantangan" style="width: 100%; padding: 14px; font-size: 18px; font-weight: bold; background-color: #e67e22; color: white; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 4px #d35400;">MULAI TANTANGAN 🔥</button>
                        </div>
                    `;
                    
                    gameContent.appendChild(divPopUp);
                    
                    // Jalankan fungsi penanganan tombol di bawah
                    tempelAksiTombolGifted();
                }
            } else {
                pesanError.innerText = "❌ Posisi tidak simetris! Ikuti aturan pola bilangan SAKA PUTIK.";
                setTimeout(() => { pesanError.innerText = ""; }, 2000);
            }
        });
    });
}

function tempelAksiTombolGifted() {
    const btnLanjut = document.getElementById('btn-lanjut-latihan');
    const btnSelesai = document.getElementById('btn-selesai-tantangan');
    const popUpElemen = document.getElementById('panel-sukses-gifted');

    if (btnLanjut) {
        btnLanjut.onclick = function() {
            if (popUpElemen) popUpElemen.remove(); // Tutup pop-up transparan
            
            window.rondeSekarang++; 
            window.mulaiTahap2_1(); // Tetap mengulang latihan tahap 1 (Saka ke Saka)
        };
    }

    if (btnSelesai) {
        btnSelesai.onclick = function() {
            if (popUpElemen) popUpElemen.remove(); // Tutup pop-up transparan
            
            // JALUR PINTAS: Tombol oranye langsung lompat memicu panggung frame biasa + pilihan ganda
            if (typeof window.mulaiTahapLanjutan_2 === "function") {
                window.mulaiTahapLanjutan_2(); 
            } else {
                alert("Fungsi 'mulaiTahapLanjutan_2' belum ditemukan. Pastikan kodenya sudah ditempel di dalam file!");
            }
        };
    }
}
// ========================================================
// 🔄 SUB-TAHAP BARU: MEMINDAH TITIK DARI FRAME BIASA 50%
// ========================================================

window.mulaiTahapLanjutan_2 = function() {
    window.titikSuksesDipindah = 0;
if (typeof window.benarBerturutTurut === 'undefined') window.benarBerturutTurut = 0;
    
    // Pola baku SAKA yang sah sebagai kunci jawaban akhir (Indeks 1,3,5,7,9)
    window.urutanBakuBawah = [7, 9, 3, 1, 5]; 
    window.urutanBakuAtas = [7, 9, 3, 1, 5]; 

    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    const indeksSahSaka = [1, 3, 5, 7, 9];
    
    // Tentukan jumlah total titik acak untuk ronde ini (Maksimal 10 titik)
    let totalTitikRondeIni = Math.floor(Math.random() * 9) + 2; // Angka 2 sampai 10
    window.titikHarusDipindah = totalTitikRondeIni;

    // Siapkan 3 Opsi Pilihan Ganda (1 Benar, 2 Salah sebagai Pengecoh)
    let jawabanBenar = totalTitikRondeIni;
    let opsiSalah1 = jawabanBenar + (Math.random() > 0.5 ? 1 : -1);
    let opsiSalah2 = jawabanBenar + (Math.random() > 0.5 ? 2 : -2);
    if(opsiSalah1 === jawabanBenar || opsiSalah1 <= 0) opsiSalah1 = jawabanBenar + 3;
    if(opsiSalah2 === jawabanBenar || opsiSalah2 === opsiSalah1 || opsiSalah2 <= 0) opsiSalah2 = jawabanBenar + 4;
    
    // Acak urutan tombol pilihan ganda
    let susunanOpsi = [jawabanBenar, opsiSalah1, opsiSalah2].sort(() => 0.5 - Math.random());

    // Generate Titik Secara Acak di dalam GRID KOTAK BIASA (Frame Kiri)
    // Titik ditempatkan secara acak murni tanpa mengikuti struktur SAKA baku
    let slotKotakBiasa = Array.from({length: 18}, (_, i) => i + 1); // 18 lubang potensial
    let posisiTitikAcak = slotKotakBiasa.sort(() => 0.5 - Math.random()).slice(0, totalTitikRondeIni);

    let htmlFrameBiasaAtas = '';
    let htmlFrameBiasaBawah = '';

    for (let i = 1; i <= 9; i++) {
        let isAtasActive = posisiTitikAcak.includes(i) ? 'active' : '';
        let isBawahActive = posisiTitikAcak.includes(i + 9) ? 'active' : '';

        htmlFrameBiasaAtas += `<div class="dot ${isAtasActive}" ${isAtasActive ? 'draggable="true" style="cursor: move;"' : ''}></div>`;
        htmlFrameBiasaBawah += `<div class="dot ${isBawahActive}" ${isBawahActive ? 'draggable="true" style="cursor: move;"' : ''}></div>`;
    }

    // Suntikkan Layout Baru ke Kontainer Utama
    gameContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 100%;">
            
            <div style="width: 100%; display: flex; justify-content: center; transform: scale(0.9); margin-top: -10px;">
                ${generateBarisanSepuluhKartu()}
            </div>

            <h2 id="judul-misi-b" style="color:#2980b9; font-size:20px; text-align:center; margin: 5px 0; font-weight: 800; background: rgba(255,255,255,0.85); padding: 4px 15px; border-radius: 10px;">
                Misi Lanjutan: Pindahkan Bebas Sesuai Pola Baku SAKA PUTIK
            </h2>
            
            <div style="display:flex; justify-content:center; align-items:center; gap:40px; width:100%; margin-top: 5px; position:relative;">
                
                <div id="kartu-asal" style="width: 150px; height: 220px; background: rgba(255, 255, 255, 0.5); border: 4px dashed #bdc3c7; border-radius: 15px; padding: 10px; display: flex; flex-direction: column; gap: 10px; justify-content: space-around; transform: scale(0.95);">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; height: 45%;">
                        ${htmlFrameBiasaAtas}
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; height: 45%;">
                        ${htmlFrameBiasaBawah}
                    </div>
                </div>

                <div style="text-align:center;">
                    <div style="font-size:40px; color:#2c3e50;">➡️</div>
                </div>

                <div class="card-saka" id="kartu-tujuan" style="transform: scale(0.95);">
                    <div class="five-frame" data-box="atas">
                        <div class="dot target-landasan" data-index="1" data-box="atas"></div>
                        <div class="dot" data-index="2" data-box="atas" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="3" data-box="atas"></div>
                        <div class="dot" data-index="4" data-box="atas" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="5" data-box="atas"></div>
                        <div class="dot" data-index="6" data-box="atas" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="7" data-box="atas"></div>
                        <div class="dot" data-index="8" data-box="atas" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="9" data-box="atas"></div>
                    </div>
                    <div class="five-frame" data-box="bawah">
                        <div class="dot target-landasan" data-index="1" data-box="bawah"></div>
                        <div class="dot" data-index="2" data-box="bawah" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="3" data-box="bawah"></div>
                        <div class="dot" data-index="4" data-box="bawah" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="5" data-box="bawah"></div>
                        <div class="dot" data-index="6" data-box="bawah" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="7" data-box="bawah"></div>
                        <div class="dot" data-index="8" data-box="bawah" style="opacity: 0; cursor: default;"></div>
                        <div class="dot target-landasan" data-index="9" data-box="bawah"></div>
                    </div>
                </div>

            </div>

            <div id="pesan-salah-b" style="color:#e74c3c; font-weight:bold; text-align:center; height:20px; margin-top:5px; font-size: 16px;"></div>
            
            <div id="area-pilihan-ganda" style="display: none; flex-direction: column; align-items: center; margin-top: 10px; width: 100%;">
                <p style="font-size: 18px; font-weight: bold; color: #2c3e50; margin: 5px 0;">Berapakah nilai dari pola bilangan SAKA PUTIK di atas?</p>
                <div style="display: flex; gap: 20px; justify-content: center; width: 60%;">
                    <button class="btn-opsi-saka" onclick="cekJawabanAngka(${susunanOpsi[0]}, ${jawabanBenar})" style="flex: 1; padding: 12px; font-size: 20px; font-weight: bold; background: #fff; border: 3px solid #34495e; border-radius: 10px; cursor: pointer; box-shadow: 0 4px #2c3e50;">${susunanOpsi[0]}</button>
                    <button class="btn-opsi-saka" onclick="cekJawabanAngka(${susunanOpsi[1]}, ${jawabanBenar})" style="flex: 1; padding: 12px; font-size: 20px; font-weight: bold; background: #fff; border: 3px solid #34495e; border-radius: 10px; cursor: pointer; box-shadow: 0 4px #2c3e50;">${susunanOpsi[1]}</button>
                    <button class="btn-opsi-saka" onclick="cekJawabanAngka(${susunanOpsi[2]}, ${jawabanBenar})" style="flex: 1; padding: 12px; font-size: 20px; font-weight: bold; background: #fff; border: 3px solid #34495e; border-radius: 10px; cursor: pointer; box-shadow: 0 4px #2c3e50;">${susunanOpsi[2]}</button>
                </div>
            </div>

            <div id="panel-sukses-gifted" style="display:none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; max-width: 550px; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 5px solid rgba(46, 204, 113, 0.7); padding: 35px 25px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); text-align: center; z-index: 999; flex-direction: column; align-items: center; justify-content: center;">
                <div id="teks-keberhasilan" style="font-size: 28px; color: #1e7e34; font-weight: 900; margin-bottom: 25px; line-height: 1.5;"></div>
                <div style="display: flex; flex-direction: column; gap: 15px; width: 90%;">
                    <button id="btn-lanjut-latihan" style="width: 100%; padding: 14px; font-size: 18px; font-weight: bold; background-color: #3498db; color: white; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 4px #2980b9;">LATIHAN SELANJUTNYA</button>
                    <button id="btn-selesai-tantangan" style="width: 100%; padding: 14px; font-size: 18px; font-weight: bold; background-color: #e67e22; color: white; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 4px #d35400;">MULAI TANTANGAN 🔥</button>
                </div>
            </div>

        </div>
    `;

    tempelEventDragDropLanjutan();
};

function tempelEventDragDropLanjutan() {
    const dotsSapi = document.querySelectorAll('#kartu-asal .dot.active');
    const targets = document.querySelectorAll('#kartu-tujuan .target-landasan');
    let elemenDiDrag = null;

    dotsSapi.forEach((dot, index) => {
        dot.id = `titik-lanjut-${index}`;
        dot.addEventListener('dragstart', function() {
            elemenDiDrag = this;
            this.style.opacity = '0.4';
        });
        dot.addEventListener('dragend', function() {
            this.style.opacity = '1';
        });
    });

    targets.forEach(target => {
        target.addEventListener('dragover', function(e) { e.preventDefault(); });

        target.addEventListener('drop', function(e) {
            e.preventDefault();
            const pesanError = document.getElementById('pesan-salah-b');
            const indeksTarget = parseInt(this.getAttribute('data-index'));
            const posisiKotak = this.getAttribute('data-box');

            // ATURAN DIALONGGARKAN: Mengecek validitas tempat berdasarkan urutan peletakan SAKA murni (bebas atas/bawah dulu)
            let jumlahBakuBawah = Math.min(window.titikHarusDipindah, 5);
            let jumlahBakuAtas = Math.max(0, window.titikHarusDipindah - 5);

            let polaSahBawah = window.urutanBakuBawah.slice(0, jumlahBakuBawah);
            let polaSahAtas = window.urutanBakuAtas.slice(0, jumlahBakuAtas);

            let apakahSah = false;
            if (posisiKotak === 'bawah' && polaSahBawah.includes(indeksTarget)) apakahSah = true;
            if (posisiKotak === 'atas' && polaSahAtas.includes(indeksTarget)) apakahSah = true;

            if (apakahSah) {
                this.classList.remove('target-landasan');
                this.classList.add('active');
                this.style.border = 'none';
                
                if (elemenDiDrag) elemenDiDrag.remove();
                pesanError.innerText = "";
                window.titikSuksesDipindah++;

                // Jika semua titik sudah dipindahkan ke tempat yang benar, buka Pilihan Ganda Angka
                if (window.titikSuksesDipindah === window.titikHarusDipindah) {
                    document.getElementById('area-pilihan-ganda').style.display = 'flex';
                }
            } else {
                pesanError.innerText = "❌ Pola salah! Titik harus diletakkan pada formasi baku SAKA PUTIK.";
                setTimeout(() => { pesanError.innerText = ""; }, 2500);
            }
        });
    });
}

// ========================================================
// 🧮 VALIDASI PILIHAN GANDA DENGAN FITUR RAGU-RAGU (REVISI FINAL)
// ========================================================
window.cekJawabanAngka = function(pilihan, kunci) {
    const pesanError = document.getElementById('pesan-salah-b');
    const panelOverlay = document.getElementById('panel-sukses-gifted');
    const teksKeberhasilan = document.getElementById('teks-keberhasilan');
    const btnLanjut = document.getElementById('btn-lanjut-latihan');
    const btnSelesai = document.getElementById('btn-selesai-tantangan');
    
    if (pilihan === kunci) {
        pesanError.innerText = "";
        window.benarBerturutTurut++; // Tambah poin karena benar

        if (panelOverlay && teksKeberhasilan) {
            
            // KONDISI JIKA SUDAH 3 KALI BENAR BERTURUT-TURUT (LULUS)
            if (window.benarBerturutTurut >= 3) {
                // Teks berubah mengapresiasi 3x kelulusan
                teksKeberhasilan.innerHTML = `Pola Terbentuk Sempurna!<br>Nilai Bilangan SAKA PUTIK= <span style="color:#c0392b; font-size:38px;">${kunci}</span>.<br><br><span style="color:#2ecc71; font-size:24px; font-weight:bold;">Hebat, 3 kali benar! Mau game selanjutnya?</span>`;
                
                panelOverlay.style.display = 'flex';
                
                // AKOMODASI SISWA RAGU-RAGU: Tombol latihan tetap dimunculkan (tidak dihapus)
                if (btnLanjut) {
                    btnLanjut.style.display = 'block';
                    btnLanjut.innerText = "SAYA MAU BERLATIH LAGI";
                    btnLanjut.style.width = "100%";
                }
                if (btnSelesai) {
                    btnSelesai.style.display = 'block';
                    btnSelesai.innerText = "GAME SELANJUTNYA 🚀";
                    btnSelesai.style.width = "100%";
                }
                
            } else {
                // KONDISI JIKA BARU 1 ATAU 2 KALI BENAR
                teksKeberhasilan.innerHTML = `Ada <span style="color:#c0392b; font-size:38px;">${window.titikSuksesDipindah}</span> titik.<br>HOREEEEE BERHASIL! 🎉`;
                
                panelOverlay.style.display = 'flex';
                
                // Tombol latihan muncul, tombol GAME SELANJUTNYA disembunyikan
                if (btnLanjut) {
                    btnLanjut.style.display = 'block';
                    btnLanjut.innerText = "LATIHAN SELANJUTNYA";
                    btnLanjut.style.width = "100%";
                }
                if (btnSelesai) btnSelesai.style.display = 'none'; 
            }
            
            // Hubungkan fungsi klik tombol
            tempelAksiTombolGiftedLanjutan();
        }
    } else {
        // JIKA SALAH: Hitungan langsung jeblok kembali ke 0
        window.benarBerturutTurut = 0; 
        
        pesanError.innerText = "❌ Nilai angka belum tepat dengan jumlah pola titik. Hitungan berturut-turut diulang dari 0 kembali! 😊";
        setTimeout(() => { pesanError.innerText = ""; }, 3500);
    }
};

function tempelAksiTombolGiftedLanjutan() {
    const btnLanjut = document.getElementById('btn-lanjut-latihan');
    const btnSelesai = document.getElementById('btn-selesai-tantangan');

    if (btnLanjut) {
        btnLanjut.onclick = function() {
            document.getElementById('panel-sukses-gifted').style.display = 'none';
            if (btnLanjut) btnLanjut.style.display = 'block';
            if (btnSelesai) btnSelesai.style.display = 'block';
            
            window.mulaiTahapLanjutan_2(); 
        };
    }

    if (btnSelesai) {
        btnSelesai.onclick = function() {
            // 1. Tutup pop-up sukses bawaan Misi 2
            document.getElementById('panel-sukses-gifted').style.display = 'none';
            
            // 2. Manipulasi Sidebar secara visual agar "Senilai" (misi-3) menyala dan misi-2 mati
            const tombolMisi2 = document.getElementById('misi-2');
            const tombolMisi3 = document.getElementById('misi-3');
            if (tombolMisi2) tombolMisi2.classList.remove('active');
            if (tombolMisi3) {
                tombolMisi3.classList.add('active');
                tombolMisi3.classList.remove('locked');
            }

            const gameContent = document.getElementById('game-content');
            if (gameContent) {
                // 3. FORCE CLEAR: Hapus paksa teks statis penataran kurikulum di layar
                gameContent.innerHTML = ''; 

                // 4. Buat Pop-up Sambutan Pedang Silver ⚔️
                const popUpSambutan = document.createElement('div');
                popUpSambutan.id = 'panel-sambutan-senilai';
                popUpSambutan.style.cssText = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; max-width: 500px; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 5px solid #bdc3c7; padding: 40px 20px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); text-align: center; z-index: 1000; display: flex; flex-direction: column; align-items: center; justify-content: center;";
                
                popUpSambutan.innerHTML = `
                    <div style="font-size: 70px; margin-bottom: 15px;">⚔️</div>
                    <div style="font-size: 24px; color: #2c3e50; font-weight: 900; line-height: 1.4; margin-bottom: 25px;">
                        SELAMAT!<br>SEKARANG KAMU SUDAH SAMPAI DI TAHAP INI
                    </div>
                    <button id="btn-mulai-senilai-asli" style="width: 85%; padding: 14px; font-size: 18px; font-weight: bold; background-color: #2ecc71; color: white; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 4px #27ae60;">MULAI BERMAIN 🎮</button>
                `;
                
                gameContent.appendChild(popUpSambutan);

                // 5. Eksekusi Tombol Mulai Bermain langsung ke panggung utama Tahap C
                const btnMulaiAsli = document.getElementById('btn-mulai-senilai-asli');
                if (btnMulaiAsli) {
                    btnMulaiAsli.onclick = function() {
                        popUpSambutan.remove();
                        
                        // Jalur pintas langsung eksekusi panggung logika Tahap C Senilai
                        if (typeof window.mulaiTahapCSenilai === "function") {
                            window.mulaiTahapCSenilai(); 
                        } else {
                            alert("Fungsi 'window.mulaiTahapCSenilai' belum terpasang di bagian paling bawah file ini.");
                        }
                    };
                }
            }
        };
    }
}

function akhiriMisiSecaraTotal() {
    window.rondeSekarang = 1;
    alert("🎉 Hebat sekali! Kamu berhasil menyelesaikan Tantangan Pindah Titik!");
    
    progresMisi++; 
    if (progresMisi > totalMisi) { 
        renderHasilBelajar(); 
    } else { 
        pilihMisi(progresMisi); 
    }
}
// ========================================================
// ⚔️ TAHAP C: SENILAI (KODE UTAMA & TIMER SYSTEM) - FIXED
// ========================================================

// Variabel Global Pelacak State Tahap C
window.tahapC_streakLatihan = 0;
window.tahapC_modeTimerActive = false;
window.tahapC_timerLevel = 1; // Level 1, 2, atau 3
window.tahapC_streakTimer = 0;
window.tahapC_salahBerturutTimer = 0;
window.tahapC_countdownInterval = null;

// Fungsi Utama untuk memicu Tahap C Senilai
window.mulaiTahapCSenilai = function() {
    window.tahapC_modeTimerActive = false;
    window.tahapC_streakLatihan = 0;
    window.generasikanSoalLatihanC();
};

window.generasikanSoalLatihanC = function() {
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    // 1. Tentukan Nilai Soal Acak (2 sampai 9)
    const nilaiSoal = Math.floor(Math.random() * 8) + 2;
    
    // 2. Pecah nilai secara ACAK untuk Kombinasi Atas & Bawah
    let maksAtas = Math.min(5, nilaiSoal);
    let minAtas = Math.max(0, nilaiSoal - 5);
    let titikAtasSoal = Math.floor(Math.random() * (maksAtas - minAtas + 1)) + minAtas;
    let titikBawahSoal = nilaiSoal - titikAtasSoal;

    if (titikBawahSoal === Math.min(nilaiSoal, 5) && titikAtasSoal === Math.max(0, nilaiSoal - 5)) {
        if (titikAtasSoal > 0 && titikBawahSoal < 5) { titikAtasSoal--; titikBawahSoal++; }
        else if (titikBawahSoal > 0 && titikAtasSoal < 5) { titikBawahSoal--; titikAtasSoal++; }
    }

    // 3. Siapkan Opsi Jawaban
    let opsiJawaban = [nilaiSoal];
    while(opsiJawaban.length < 3) {
        let acakPengalih = Math.floor(Math.random() * 8) + 2;
        if (!opsiJawaban.includes(acakPengalih)) opsiJawaban.push(acakPengalih);
    }
    opsiJawaban.sort(() => 0.5 - Math.random());

    // 4. Engine Grid Formasi Silang (X)
    const slotUrutanSakaX = [7, 9, 3, 1, 5];
    const renderGridSakaX = function(jumlahTitik, isAcakSoal = false) {
        let html = '';
        let slotAktif = [];
        if (isAcakSoal) {
            slotAktif = [...slotUrutanSakaX].sort(() => 0.5 - Math.random()).slice(0, jumlahTitik);
        } else {
            slotAktif = slotUrutanSakaX.slice(0, jumlahTitik);
        }
        for (let i = 1; i <= 9; i++) {
            if (!slotUrutanSakaX.includes(i)) {
                html += `<div class="dot" data-index="${i}" style="opacity:0; cursor:default; pointer-events:none;"></div>`;
            } else {
                let isActive = slotAktif.includes(i);
                html += `<div class="dot ${isActive ? 'active' : ''}" data-index="${i}" style="cursor:default;"></div>`;
            }
        }
        return html;
    };

    let htmlAtasAcak = renderGridSakaX(titikAtasSoal, true);
    let htmlBawahAcak = renderGridSakaX(titikBawahSoal, true);

    // Fungsi pembantu untuk membuat landasan drop area remedial di kartu kanan
    const renderLandasanRemedial = function(boxType) {
        let html = '';
        for (let i = 1; i <= 9; i++) {
            if (slotUrutanSakaX.includes(i)) {
                // Landasan interaktif yang siap menerima Drop Titik (Berbentuk lingkaran putus-putus/samar)
                html += `<div class="dot target-landasan" data-box="${boxType}" data-index="${i}" style="cursor:pointer; border: 2px dashed #27ae60; background: rgba(39, 174, 96, 0.1); border-radius: 50%;"></div>`;
            } else {
                html += `<div class="dot" data-index="${i}" style="opacity:0; cursor:default; pointer-events:none;"></div>`;
            }
        }
        return html;
    };

    // 5. Render HTML Utama Panggung Latihan
    gameContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; font-family: sans-serif;">
            
            <div style="display: flex; justify-content: center; align-items: center; gap: 30px; min-height: 180px; width:100%; margin-bottom: 5px;">
                <div style="text-align:center;">
                    <span style="font-weight:bold; color:#7f8c8d; font-size:14px; display:block; margin-bottom:2px;">Kartu Soal (Acak)</span>
                    <div class="card-saka" id="kartu-soal-acak" style="border:4px solid #e74c3c; transform: scale(0.9); margin: 0 auto;">
                        <div class="five-frame">${htmlAtasAcak}</div>
                        <div class="five-frame">${htmlBawahAcak}</div>
                    </div>
                </div>

                <div id="container-remedial-c" style="display:none; text-align:center;">
                    <div style="font-size:24px; color:#e67e22;">➡️</div>
                </div>
                <div id="kartu-remedial-c" style="display:none; text-align:center;">
                    <span style="font-weight:bold; color:#27ae60; font-size:14px; display:block; margin-bottom:2px;">Perbaiki Pola Di Sini</span>
                    <div class="card-saka" id="kartu-tujuan-remedial" style="border:4px dashed #27ae60; transform: scale(0.9); margin: 0 auto;">
                        <div class="five-frame">${renderLandasanRemedial('atas')}</div>
                        <div class="five-frame">${renderLandasanRemedial('bawah')}</div>
                    </div>
                </div>
            </div>

            <p id="instruksi-c" style="font-size:15px; color:#2c3e50; margin: 10px 0; font-weight:bold; text-align:center; max-width:80%; line-height:1.4; background: rgba(255,255,255,0.6); padding: 6px 15px; border-radius: 10px;">
                Pilihlah kartu di bawah ini yang nilainya sama dengan kartu pola acak di atas!
            </p>

            <div id="feedback-latihan-c" style="color:#e74c3c; font-weight:bold; height:20px; margin-bottom: 5px; font-size:14px;"></div>

            <div id="area-opsi-kartu-c" style="display: flex; justify-content: center; align-items: center; width: 100%; min-height: 160px;">
                ${opsiJawaban.map(nilaiOpsi => {
                    let bakuBawah = Math.min(nilaiOpsi, 5);
                    let bakuAtas = Math.max(0, nilaiOpsi - 5);
                    let htmlAtasBaku = renderGridSakaX(bakuAtas, false);
                    let htmlBawahBaku = renderGridSakaX(bakuBawah, false);

                    return `
                        <div class="card-option-wrapper" onclick="window.verifikasiTebakanLatihanC(${nilaiOpsi}, ${nilaiSoal})" style="cursor:pointer; background:none; border:none; padding:0; box-shadow:none; margin: 0 25px; display:inline-block; transition: transform 0.2s;">
                            <div class="card-saka" style="pointer-events:none; transform:scale(0.85); margin:0 auto;">
                                <div class="five-frame">${htmlAtasBaku}</div>
                                <div class="five-frame">${htmlBawahBaku}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
};

// Validasi Klik Pertama Pilihan Ganda Kartu Latihan
window.verifikasiTebakanLatihanC = function(pilihanSiswa, kunciJawaban) {
    const feedback = document.getElementById('feedback-latihan-c');
    const popUp = document.getElementById('pop-dialog-c');
    const teksPop = document.getElementById('pop-teks-c');
    const btnBiru = document.getElementById('btn-c-biru');
    const btnOranye = document.getElementById('btn-c-oranye');

    if (pilihanSiswa === kunciJawaban) {
        feedback.innerText = "";
        window.tahapC_streakLatihan++; 

        if (popUp) {
            popUp.style.display = 'flex';
            btnBiru.style.display = 'block';
            btnBiru.innerText = "KARTU SELANJUTNYA";

            if (window.tahapC_streakLatihan >= 3) {
                teksPop.innerHTML = `Pola Baku Tertebak Sempurna!<br><br><span style="color:#2ecc71; font-size:24px; font-weight:bold;">Hebat, 3 kali benar! Mau game selanjutnya?</span>`;
                btnBiru.innerText = "SAYA MAU BERLATIH LAGI";
                if (btnOranye) btnOranye.style.display = 'block'; 
            } else {
                teksPop.innerHTML = `HOREEEEE! BENAR! 🎉<br><span style="font-size:18px; color:#2c3e50;">Kamu berhasil menebak formasi senilai (${window.tahapC_streakLatihan}/3 Beruntun).</span>`;
                if (btnOranye) btnOranye.style.display = 'none';
            }

            btnBiru.onclick = function() { popUp.style.display = 'none'; window.generasikanSoalLatihanC(); };
            if (btnOranye) btnOranye.onclick = function() { popUp.style.display = 'none'; window.mulaiFaseTimerUjiC(); };
        } else {
            // Pengaman jika elemen dialog popup utama tidak sengaja absen di HTML luar
            alert(`Hore Benar! (${window.tahapC_streakLatihan}/3).`);
            if (window.tahapC_streakLatihan >= 3) {
                window.mulaiFaseTimerUjiC();
            } else {
                window.generasikanSoalLatihanC();
            }
        }

    } else {
        window.tahapC_streakLatihan = 0;
        feedback.innerText = "❌ Pola kartu belum senilai! Seret (drag) titik dari kartu kiri dan tempelkan ke kartu remedial di kanan.";
        
        // Sembunyikan area pilihan ganda kartu
        const areaOpsi = document.getElementById('area-opsi-kartu-c');
        if (areaOpsi) areaOpsi.style.display = 'none';

        // Munculkan Kartu Remedial Landasan Target
        document.getElementById('container-remedial-c').style.display = 'block';
        document.getElementById('kartu-remedial-c').style.display = 'block';
        
        // Aktifkan Fitur Drag-Drop Remedial
        window.aktifkanDragRemedialC(kunciJawaban);
    }
};

// Logika Drag Remedial Latihan C (FIXED & OPTIMIZED)
window.aktifkanDragRemedialC = function(kunciNilai) {
    const dotsAsal = document.querySelectorAll('#kartu-soal-acak .dot.active');
    const targets = document.querySelectorAll('#kartu-tujuan-remedial .target-landasan');
    let titikSuksesRemedial = 0;
    let elemenDiDrag = null;

    // Aktifkan fitur draggable pada titik aktif di kartu soal (kiri)
    dotsAsal.forEach((dot, idx) => {
        dot.id = `dot-remedial-${idx}`;
        dot.setAttribute('draggable', 'true');
        dot.style.cursor = 'move';
        
        dot.addEventListener('dragstart', function() { 
            elemenDiDrag = this; 
            this.style.opacity = '0.4'; 
        });
        
        dot.addEventListener('dragend', function() { 
            this.style.opacity = '1'; 
        });
    });

    // Pasang Event Listener Drop pada Landasan Remedial (kanan)
    targets.forEach(target => {
        target.addEventListener('dragover', function(e) { 
            e.preventDefault(); // Wajib di-prevent agar drop event bisa terpicu
        });

        target.addEventListener('drop', function(e) {
            e.preventDefault();
            const idxTarget = parseInt(this.getAttribute('data-index'));
            const boxTarget = this.getAttribute('data-box');
            const feedback = document.getElementById('feedback-latihan-c');

            // Aturan Kunci Formasi Baku SAKA Putik Silang (X)
            let jwbBawah = Math.min(kunciNilai, 5);
            let jwbAtas = Math.max(0, kunciNilai - 5);
            let indeksSahsaka = [7, 9, 3, 1, 5]; // Urutan pengisian slot Silang

            let polaSahBawah = indeksSahsaka.slice(0, jwbBawah);
            let polaSahAtas = indeksSahsaka.slice(0, jwbAtas);

            let sah = false;
            if (boxTarget === 'bawah' && polaSahBawah.includes(idxTarget)) sah = true;
            if (boxTarget === 'atas' && polaSahAtas.includes(idxTarget)) sah = true;

            if (sah) {
                // Ubah landasan putus-putus menjadi titik aktif berwarna biru padat
                this.classList.remove('target-landasan');
                this.classList.add('active');
                this.style.border = 'none';
                this.style.background = '#2980b9'; // Warna titik biru aktif murni
                this.style.cursor = 'default';

                // Hilangkan titik asal yang berhasil dipindahkan
                if (elemenDiDrag) elemenDiDrag.remove();
                feedback.innerText = "";
                titikSuksesRemedial++;

                // Jika semua titik berhasil disusun ke formasi baku dengan benar
                if (titikSuksesRemedial === kunciNilai) {
                    const popUp = document.getElementById('pop-dialog-c');
                    const teksPop = document.getElementById('pop-teks-c');
                    const btnBiru = document.getElementById('btn-c-biru');
                    const btnOranye = document.getElementById('btn-c-oranye');

                    if (popUp) {
                        teksPop.innerHTML = `Hebat! Pola Berhasil Diperbaiki.<br><span style="font-size:16px; color:#c0392b; font-weight:bold;">Ingat, kerjakan lebih teliti di tebakan pertama berikutnya untuk mengumpulkan poin!</span>`;
                        popUp.style.display = 'flex';
                        btnBiru.style.display = 'block';
                        btnBiru.innerText = "KARTU SELANJUTNYA";
                        if (btnOranye) btnOranye.style.display = 'none';

                        btnBiru.onclick = function() { 
                            popUp.style.display = 'none'; 
                            window.generasikanSoalLatihanC(); 
                        };
                    } else {
                        alert("Hebat! Pola berhasil diperbaiki sesuai formasi baku SAKA PUTIK. Mari lanjut ke kartu berikutnya!");
                        window.generasikanSoalLatihanC();
                    }
                }
            } else {
                feedback.innerText = "❌ Penempatan salah! Ikuti formasi urutan baku kartu SAKA PUTIK.";
                setTimeout(() => { if(feedback.innerText.includes("❌")) feedback.innerText = ""; }, 2500);
            }
        });
    });
};


// --------------------------------------------------------
// B. FASE UJI KEMAMPUAN (TIMER MODE BERUNTUN)
// --------------------------------------------------------
window.mulaiFaseTimerUjiC = function() {
    window.tahapC_modeTimerActive = true;
    window.tahapC_timerLevel = 1; 
    window.tahapC_streakTimer = 0;
    window.tahapC_salahBerturutTimer = 0;
    window.generasikanSoalTimerC();
};

window.generasikanSoalTimerC = function() {
    if (window.tahapC_countdownInterval) clearInterval(window.tahapC_countdownInterval);
    
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    let waktuDetik = window.tahapC_timerLevel === 1 ? 15 : window.tahapC_timerLevel === 2 ? 12 : 8;
    let sisaWaktu = waktuDetik;

    const nilaiSoal = Math.floor(Math.random() * 8) + 2; 
    
    let maksAtas = Math.min(5, nilaiSoal);
    let minAtas = Math.max(0, nilaiSoal - 5);
    let titikAtasSoal = Math.floor(Math.random() * (maksAtas - minAtas + 1)) + minAtas;
    let titikBawahSoal = nilaiSoal - titikAtasSoal;

    if (titikBawahSoal === Math.min(nilaiSoal, 5) && titikAtasSoal === Math.max(0, nilaiSoal - 5)) {
        if (titikAtasSoal > 0 && titikBawahSoal < 5) { titikAtasSoal--; titikBawahSoal++; }
        else if (titikBawahSoal > 0 && titikAtasSoal < 5) { titikBawahSoal--; titikAtasSoal++; }
    }

    let opsiJawaban = [nilaiSoal];
    while(opsiJawaban.length < 3) {
        let acakPengalih = Math.floor(Math.random() * 8) + 2;
        if (!opsiJawaban.includes(acakPengalih)) opsiJawaban.push(acakPengalih);
    }
    opsiJawaban.sort(() => 0.5 - Math.random());

    const slotUrutanSakaX = [7, 9, 3, 1, 5];
    const renderGridSakaX = function(jumlahTitik, isAcakSoal = false) {
        let html = '';
        let slotAktif = [];
        if (isAcakSoal) {
            slotAktif = [...slotUrutanSakaX].sort(() => 0.5 - Math.random()).slice(0, jumlahTitik);
        } else {
            slotAktif = slotUrutanSakaX.slice(0, jumlahTitik);
        }
        for (let i = 1; i <= 9; i++) {
            if (!slotUrutanSakaX.includes(i)) {
                html += `<div class="dot" data-index="${i}" style="opacity:0; cursor:default; pointer-events:none;"></div>`;
            } else {
                let isActive = slotAktif.includes(i);
                html += `<div class="dot ${isActive ? 'active' : ''}" data-index="${i}" style="cursor:default;"></div>`;
            }
        }
        return html;
    };

    let htmlAtasAcak = renderGridSakaX(titikAtasSoal, true);
    let htmlBawahAcak = renderGridSakaX(titikBawahSoal, true);

    gameContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; font-family: sans-serif; position: relative;">
            
            <div style="display:flex; justify-content:space-between; width:90%; background:#34495e; padding:10px 20px; border-radius:12px; color:white; font-weight:bold; margin-bottom:15px; box-shadow:0 4px rgba(0,0,0,0.15); margin-top: 5px;">
                <div>TAHAP TIMER: <span style="color:#e67e22;">${window.tahapC_timerLevel}/3</span></div>
                <div style="background:#e74c3c; padding:2px 15px; border-radius:20px; font-size:18px;">⏱️ <span id="timer-countdown-c">${sisaWaktu}</span> DETIK</div>
                <div>STREAK JAWABAN: <span style="color:#2ecc71;">${window.tahapC_streakTimer}/5</span></div>
            </div>

            <div style="display: flex; justify-content: center; align-items: center; gap: 30px; min-height: 180px; width:100%; margin-bottom: 5px; margin-top: 5px;">
                <div style="text-align:center;">
                    <span style="font-weight:bold; color:#7f8c8d; font-size:14px; display:block; margin-bottom:2px;">Kartu Soal (Acak)</span>
                    <div class="card-saka" id="kartu-soal-acak" style="border:4px solid #e74c3c; transform: scale(0.9); margin: 0 auto;">
                        <div class="five-frame">${htmlAtasAcak}</div>
                        <div class="five-frame">${htmlBawahAcak}</div>
                    </div>
                </div>
            </div>

            <p id="instruksi-timer-c" style="font-size:15px; color:#2c3e50; margin: 10px 0; font-weight:bold; text-align:center; max-width:80%; line-height:1.4; background: rgba(255,255,255,0.7); padding: 8px 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                Pilihlah kartu di bawah ini yang nilainya sama dengan kartu pola acak di atas!
            </p>

            <div id="feedback-timer-c" style="color:#e74c3c; font-weight:bold; height:20px; margin-bottom: 5px; font-size:14px;"></div>

            <div id="opsi-timer-c" style="display: flex; justify-content: center; align-items: center; width: 100%; min-height: 160px;">
                ${opsiJawaban.map(nilaiOpsi => {
                    let bakuBawah = Math.min(nilaiOpsi, 5);
                    let bakuAtas = Math.max(0, nilaiOpsi - 5);
                    let htmlAtasBaku = renderGridSakaX(bakuAtas, false);
                    let htmlBawahBaku = renderGridSakaX(bakuBawah, false);

                    return `
                        <div class="card-option-wrapper" onclick="window.verifikasiTebakanTimerC(${nilaiOpsi}, ${nilaiSoal})" style="cursor:pointer; background:none; border:none; padding:0; box-shadow:none; margin: 0 25px; display:inline-block; transition: transform 0.2s;">
                            <div class="card-saka" style="pointer-events:none; transform:scale(0.85); margin:0 auto;">
                                <div class="five-frame">${htmlAtasBaku}</div>
                                <div class="five-frame">${htmlBawahBaku}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    window.tahapC_countdownInterval = setInterval(() => {
        sisaWaktu--;
        const timerText = document.getElementById('timer-countdown-c');
        if (timerText) timerText.innerText = sisaWaktu;
        if (sisaWaktu <= 0) {
            clearInterval(window.tahapC_countdownInterval);
            window.eksekusiSalahTimerC("WAKTU HABIS!");
        }
    }, 1000);
};

window.verifikasiTebakanTimerC = function(pilihan, kunci) {
    if (pilihan === kunci) {
        if (window.tahapC_countdownInterval) clearInterval(window.tahapC_countdownInterval);
        window.tahapC_streakTimer++;
        window.tahapC_salahBerturutTimer = 0;

        if (window.tahapC_streakTimer >= 5) {
            window.tahapC_streakTimer = 0; 
            window.tahapC_timerLevel++;

            if (window.tahapC_timerLevel > 3) {
                window.eksekusiLulusTotalTahapC();
            } else {
                alert(`🎉 LUAR BIASA! Kamu Lulus Tahap ${window.tahapC_timerLevel - 1}. Bersiap masuk Tahap ${window.tahapC_timerLevel} dengan waktu yang lebih singkat!`);
                window.generasikanSoalTimerC();
            }
        } else {
            window.generasikanSoalTimerC();
        }
    } else {
        window.eksekusiSalahTimerC("JAWABAN SALAH!");
    }
};

window.eksekusiSalahTimerC = function(alasanKekalahan) {
    if (window.tahapC_countdownInterval) clearInterval(window.tahapC_countdownInterval);
    
    window.tahapC_streakTimer = 0; 
    window.tahapC_salahBerturutTimer++;

    if (window.tahapC_salahBerturutTimer >= 5) {
        const gameContent = document.getElementById('game-content');
        if (gameContent) {
            gameContent.innerHTML = `
                <div style="text-align:center; padding: 40px 10px; background: rgba(255,255,255,0.85); border-radius:20px; box-shadow:0 10px 25px rgba(0,0,0,0.1); width:90%; max-width:550px; margin: 30px auto;">
                    <div style="font-size:60px; margin-bottom:15px;">😢</div>
                    <h3 style="color:#c0392b; font-weight:900; font-size:22px; line-height:1.5;">MAAF, KAMU SALAH 5 KALI berturut-turut dan harus mengulang tahap C dari awal.</h3>
                    <button onclick="window.mulaiTahapCSenilai()" style="margin-top:25px; padding:15px 30px; font-weight:bold; font-size:18px; color:white; background:#3498db; border:none; border-radius:12px; cursor:pointer; box-shadow:0 5px #2980b9;">KEMBALI BERLATIH</button>
                </div>
            `;
        }
    } else {
        alert(`❌ ${alasanKekalahan} Skor streak hangus kembali ke 0. Fokus, Ayo coba lagi!`);
        window.generasikanSoalTimerC();
    }
};

window.eksekusiLulusTotalTahapC = function() {
    if (window.tahapC_countdownInterval) clearInterval(window.tahapC_countdownInterval);
    
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    // 🔑 BUKA KUNCI GLOBAL (Variabel dummy penanda lulus)
    window.tahapC_isLulus = true; 
    window.tahapD_isLocked = false; 

    // Cari tombol "Tebak Nilai" di sidebar berdasarkan teks jika ID tidak pasti
    const semuaTombolMenu = document.querySelectorAll('.mission-item, .sidebar-button, button, div');
    let tombolTebakNilai = document.getElementById('tebak-nilai'); // ganti dengan ID asli jika ada
    
    if (!tombolTebakNilai) {
        // Cari alternatif yang mengandung kata "Tebak Nilai"
        semuaTombolMenu.forEach(btn => {
            if (btn.innerText && btn.innerText.includes("Tebak Nilai")) {
                tombolTebakNilai = btn;
            }
        });
    }

    if (tombolTebakNilai) {
        tombolTebakNilai.classList.remove('locked');
        tombolTebakNilai.style.opacity = "1";
        tombolTebakNilai.style.pointerEvents = "auto";
    }

    // Tampilkan Panggung Kemenangan Tahap C (REVISI SINKRONISASI TOTAL)
    gameContent.innerHTML = `
        <div style="text-align:center; padding: 40px 20px; background: rgba(255,255,255,0.9); border:5px solid #2ecc71; border-radius:20px; box-shadow:0 10px 30px rgba(0,0,0,0.15); width:85%; max-width:520px; margin: 40px auto; font-family: sans-serif;">
            <div style="font-size:70px; margin-bottom:15px;">🏆</div>
            <h2 style="color:#27ae60; font-weight:900; font-size:26px; line-height:1.4; margin-bottom:25px;">SELAMAT KAMU BERHASIL DI TAHAP INI.<br>LANJUT TAHAP BERIKUTNYA!</h2>
            <button id="btn-lanjut-tahap-d" style="width:90%; padding:15px; font-weight:bold; font-size:18px; color:white; background:#e67e22; border:none; border-radius:12px; cursor:pointer; box-shadow:0 5px #d35400;">TAHAP D: TEBAK NILAI 🚀</button>
        </div>
    `;

    document.getElementById('btn-lanjut-tahap-d').onclick = function() {
        // 1. Naikkan progres misi secara global ke Tahap D (Nomer 4)
        progresMisi = 4;

        // 2. Kunci secara permanen di memori browser agar gembok terbuka saat di-refresh
        localStorage.setItem('progresMisiLevel1', 4);

        // 3. Perbarui visual layout gembok di sidebar agar tombol nomor 4 menyala
        if (typeof updateSidebarLayout === "function") {
            updateSidebarLayout();
        }

        // 4. Masuk ke sistem navigasi pusat untuk memicu pembukaan Tahap D
        pilihMisi(4);
    };
};
// ========================================================
// 🎯 TAHAP D: TEBAK NILAI (1 KARTU - ROTASI SPASIAL MURNI)
// ========================================================

// State Global Tahap D (Disederhanakan murni 1 Kartu)
window.tahapD_state = {
    fase: 'latihan',      // 'latihan' atau 'tantangan'
    skor: 0,
    targetLatihan: 3,     // Benar 3 kali di latihan untuk masuk ke fase timer
    targetTantangan: 5,   // Benar 5 kali di fase timer untuk lulus total
    timerMaks: 10,        // 10 detik per soal saat tantangan
    timerInterval: null
};

// 1. FUNGSI INTRO
window.tampilkanIntroTahapD = function() {
    if (window.tahapD_state.timerInterval) clearInterval(window.tahapD_state.timerInterval);
    
    window.tahapD_state.fase = 'latihan';
    window.tahapD_state.skor = 0;

    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    gameContent.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 450px; width: 100%; font-family: 'Poppins', sans-serif;">
            <div style="text-align: center; padding: 40px 30px; background: #ffffff; border: 4px solid #3b82f6; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); max-width: 500px; width: 90%;">
                <div style="font-size: 60px; margin-bottom: 10px;">🚀</div>
                <h2 style="color: #1e293b; font-size: 22px; font-weight: bold; line-height: 1.4; margin-bottom: 15px;">
                    SELAMAT, KAMU SUDAH DI TAHAP INI!
                </h2>
                <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                    Di tahap ini kamu akan menebak nilai pada kartu yang posisinya berputar. Ayo konsentrasi!
                </p>
                <button onclick="window.mulaiGameTahapD()" 
                        style="padding: 14px 40px; font-size: 18px; font-weight: bold; color: white; background: #27ae60; border: none; border-radius: 50px; cursor: pointer; box-shadow: 0 6px #1e8449; transition: all 0.1s;">
                    MULAI
                </button>
            </div>
        </div>
    `;
};

// 2. MEMULAI PERMAINAN
window.mulaiGameTahapD = function() {
    window.generasikanSoalTahapD();
};

// 3. GENERATOR SOAL DINAMIS (KUNCI: MURNI 1 KARTU + ROTASI SPASIAL)
window.generasikanSoalTahapD = function() {
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    if (window.tahapD_state.timerInterval) clearInterval(window.tahapD_state.timerInterval);

    // KUNCI UTAMA: Fase tantangan kini tetap menggunakan 1 kartu
    const isTantangan = (window.tahapD_state.fase === 'tantangan');

    // Mengacak Orientasi Spasial Posisi Kartu (Free Transform)
    const tipeRotasi = Math.floor(Math.random() * 4);
    let gayaRotasi = '';
    if (tipeRotasi === 1) {
        gayaRotasi = 'transform: rotate(180deg);';
    } else if (tipeRotasi === 2) {
        gayaRotasi = 'transform: rotate(90deg); margin: 30px 0;';
    } else if (tipeRotasi === 3) {
        gayaRotasi = 'transform: rotate(-90deg); margin: 30px 0;';
    }

    // Fungsi Pembantu Render Grid Titik SAKA
    const slotUrutanSakaX = [7, 9, 3, 1, 5];
    const buatGridTitik = function(jumlahTitik) {
        let html = '';
        let slotAktif = slotUrutanSakaX.slice(0, jumlahTitik);
        for (let i = 1; i <= 9; i++) {
            if (!slotUrutanSakaX.includes(i)) {
                html += `<div class="dot" style="opacity:0; cursor:default;"></div>`;
            } else {
                let isActive = slotAktif.includes(i);
                html += `<div class="dot ${isActive ? 'active' : ''}" style="cursor:default;"></div>`;
            }
        }
        return html;
    };

    // GENERASI KARTU: Selalu 1 Kartu Berputar (Nilai 2-9)
    let nilaiTotal = Math.floor(Math.random() * 8) + 2;
    let titikBawah = Math.min(nilaiTotal, 5);
    let titikAtas = Math.max(0, nilaiTotal - 5);

    let borderWarna = isTantangan ? '#e67e22' : '#3b82f6';
    let htmlKartuUtama = `
        <div class="card-saka" style="${gayaRotasi} border: 4px solid ${borderWarna}; background: #fff; box-shadow: 0 8px 16px rgba(0,0,0,0.1); margin: auto;">
            <div class="five-frame">${buatGridTitik(titikAtas)}</div>
            <div class="five-frame">${buatGridTitik(titikBawah)}</div>
        </div>
    `;

    // 4. SIAPKAN PILIHAN GANDA (3 Angka Unik)
    let opsiJawaban = [nilaiTotal];
    while (opsiJawaban.length < 3) {
        let rentangPenyimpangan = Math.floor(Math.random() * 5) - 2;
        let angkaPengecoh = nilaiTotal + (rentangPenyimpangan === 0 ? 3 : rentangPenyimpangan);
        if (angkaPengecoh > 0 && !opsiJawaban.includes(angkaPengecoh)) {
            opsiJawaban.push(angkaPengecoh);
        }
    }
    opsiJawaban.sort(() => 0.5 - Math.random());

    // 5. SETUP DESAIN INTERFACE PANGGUNG
    let infoHeaderGame = '';
    if (isTantangan) {
        infoHeaderGame = `
            <div style="width: 100%; max-width: 500px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; color: #e74c3c;">
                    <span>🔥 MODE TANTANGAN (BERPACU WAKTU)</span>
                    <span>SKOR: ${window.tahapD_state.skor}/${window.tahapD_state.targetTantangan}</span>
                </div>
                <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                    <div id="bar-timer-d" style="width: 100%; height: 100%; background: #e74c3c; transition: width 1s linear;"></div>
                </div>
            </div>
        `;
        
        let waktuSisa = window.tahapD_state.timerMaks;
        window.tahapD_state.timerInterval = setInterval(() => {
            waktuSisa--;
            const bar = document.getElementById('bar-timer-d');
            if (bar) bar.style.width = `${(waktuSisa / window.tahapD_state.timerMaks) * 100}%`;

            if (waktuSisa <= 0) {
                clearInterval(window.tahapD_state.timerInterval);
                window.tahapD_state.skor = 0; // Reset tantangan jika kehabisan waktu
                alert("Waktu habis! Ayo fokus, hitung polanya lebih cepat lagi ya. 😊");
                window.generasikanSoalTahapD();
            }
        }, 1000);
    } else {
        infoHeaderGame = `
            <div style="background: #e0f2fe; padding: 8px 20px; border-radius: 20px; color: #0369a1; font-weight: bold; margin-bottom: 15px;">
                📋 MODUL LATIHAN: INDEKS BERHASIL (${window.tahapD_state.skor} / ${window.tahapD_state.targetLatihan})
            </div>
        `;
    }

    gameContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; font-family: sans-serif; padding: 10px 0;">
            
            ${infoHeaderGame}

            <h3 style="font-size: 16px; color: #2c3e50; text-align: center; margin: 5px 0 15px 0; font-weight: 800; letter-spacing: 0.5px;">
                PILIHLAH BILANGAN SESUAI JUMLAH TITIK PADA KARTU
            </h3>

            <div style="display: flex; justify-content: center; align-items: center; min-height: 240px; width: 100%; padding: 10px;">
                ${htmlKartuUtama}
            </div>

            <div id="feedback-d" style="height: 24px; font-weight: bold; margin: 15px 0; font-size: 15px;"></div>

            <div style="display: flex; justify-content: center; gap: 25px; width: 100%; margin-top: 5px;">
                ${opsiJawaban.map(angka => `
                    <button onclick="window.jawabSoalTahapD(${angka}, ${nilaiTotal})"
                            style="width: 75px; height: 75px; border-radius: 50%; border: none; background: #e67e22; color: white; font-size: 32px; font-weight: bold; cursor: pointer; box-shadow: 0 6px #d35400; transition: transform 0.1s;"
                            onmousedown="this.style.transform='translateY(4px)'; this.style.boxShadow='0 2px #d35400'"
                            onmouseup="this.style.transform='translateY(0px)'; this.style.boxShadow='0 6px #d35400'">
                        ${angka}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
};

// 4. VERIFIKASI JAWABAN
// 4. VERIFIKASI LOGIKA JAWABAN SISWA (KOTAK PESAN TRANSPARAN 50% DI DEPAN)
window.jawabSoalTahapD = function(pilihanSiswa, kunciJawaban) {
    if (window.tahapD_state.timerInterval) clearInterval(window.tahapD_state.timerInterval);
    
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    let htmlFeedback = '';

    if (pilihanSiswa === kunciJawaban) {
        window.tahapD_state.skor++;
        
        // Kotak pesan Putih Transparan 50% dengan Bingkai Hijau Sukses
        htmlFeedback = `
            <div id="overlay-feedback-d" style="
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                background: none; border-radius: 20px; 
                display: flex; justify-content: center; align-items: center; 
                z-index: 999; animation: fadeIn 0.2s ease-in-out;
            ">
                <div style="
                    background: rgba(255, 255, 255, 0.5); 
                    backdrop-filter: blur(5px);
                    border: 5px solid #27ae60; 
                    border-radius: 20px; 
                    padding: 30px 45px; 
                    text-align: center; 
                    box-shadow: 0 15px 35px rgba(0,0,0,0.15);
                ">
                    <span style="font-size: 55px; display: block; margin-bottom: 5px;">🎉</span>
                    <h2 style="color: #27ae60; margin: 0; font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">
                        HEBAT, JAWABANMU TEPAT!
                    </h2>
                </div>
            </div>
        `;

        gameContent.insertAdjacentHTML('beforeend', htmlFeedback);

        setTimeout(() => {
            const overlay = document.getElementById('overlay-feedback-d');
            if (overlay) overlay.remove();

            if (window.tahapD_state.fase === 'latihan' && window.tahapD_state.skor >= window.tahapD_state.targetLatihan) {
                window.tahapD_state.fase = 'tantangan';
                window.tahapD_state.skor = 0;
                alert("Selamat! Latihan selesai. Sekarang bersiaplah menghadapi TANTANGAN BERPACU WAKTU! 🔥");
                window.generasikanSoalTahapD();
            } else if (window.tahapD_state.fase === 'tantangan' && window.tahapD_state.skor >= window.tahapD_state.targetTantangan) {
                window.kelulusanTotalTahapD();
            } else {
                window.generasikanSoalTahapD();
            }
        }, 1200);

    } else {
        window.tahapD_state.skor = 0;

        // Kotak pesan Putih Transparan 50% dengan Bingkai Merah Gagal
        htmlFeedback = `
            <div id="overlay-feedback-d" style="
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                background: none; border-radius: 20px; 
                display: flex; justify-content: center; align-items: center; 
                z-index: 999; animation: fadeIn 0.2s ease-in-out;
            ">
                <div style="
                    background: rgba(255, 255, 255, 0.5); 
                    backdrop-filter: blur(5px);
                    border: 5px solid #e74c3c; 
                    border-radius: 20px; 
                    padding: 30px 45px; 
                    text-align: center; 
                    box-shadow: 0 15px 35px rgba(0,0,0,0.15);
                ">
                    <span style="font-size: 55px; display: block; margin-bottom: 5px;">❌</span>
                    <h2 style="color: #e74c3c; margin: 0; font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: bold; line-height: 1.4;">
                        HMM, HITUNG LAGI TITIKNYA<br>DENGAN TELITI YA!
                    </h2>
                </div>
            </div>
        `;

        gameContent.insertAdjacentHTML('beforeend', htmlFeedback);

        setTimeout(() => {
            const overlay = document.getElementById('overlay-feedback-d');
            if (overlay) overlay.remove();
            window.generasikanSoalTahapD();
        }, 1800);
    }
};
// 5. PANGGUNG KELULUSAN TOTAL TAHAP D
window.kelulusanTotalTahapD = function() {
    if (window.tahapD_state.timerInterval) clearInterval(window.tahapD_state.timerInterval);
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    window.tahapD_isLulus = true;

    gameContent.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 400px; width: 100%; font-family: sans-serif;">
            <div style="text-align: center; padding: 40px 20px; background: #ffffff; border: 5px solid #2ecc71; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 500px; width: 90%;">
                <div style="font-size: 70px; margin-bottom: 15px;">🏆</div>
                <h2 style="color: #27ae60; font-weight: bold; font-size: 24px; line-height: 1.4; margin-bottom: 15px;">
                    LUAR BIASA! KAMU BERHASIL!
                </h2>
                <p style="color: #7f8c8d; font-size: 16px; margin-bottom: 25px;">
                    Kamu telah menguasai cara menebak nilai pola kartu dalam berbagai posisi ruang!
                </p>
                <button onclick="progresMisi = 5; localStorage.setItem('progresMisiLevel1', 5); if(typeof updateSidebarLayout === 'function') updateSidebarLayout(); pilihMisi(5);" 
                style="width: 100%; padding: 15px; font-weight: bold; font-size: 18px; color: white; background: #2cc771; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 5px #27ae60;">
                TAHAP E: TEBAK POLA GAMBAR 🚀
                </button>
                </button>
            </div>
        </div>
    `;
};

// ========================================================
// 🎯 TAHAP 5 (TAHAP E): TEBAK POLA GAMBAR (ALUR MASTER KURSUS)
// ========================================================

// State Global Tahap E yang Diperbarui Lengkap
window.tahapE_state = {
    fase: 'latihan',        // 'latihan', 'pilihan_transisi', atau 'tantangan'
    streakLatihan: 0,       // Harus 3 kali berurutan
    nomorSoalTantangan: 0,  // Berjalan dari 1 s/d 10 soal
    totalBenarTantangan: 0, // Akumulasi jawaban benar di tantangan
    benarLevel3: 0,         // Penghitung khusus untuk Level 3 (timer 5 detik)
    timerMaks: 15,          // Default awal
    timerInterval: null
};

// 1. FUNGSI INTRO TAHAP E
window.tampilkanIntroTahapE = function() {
    if (window.tahapE_state.timerInterval) clearInterval(window.tahapE_state.timerInterval);
    
    // Reset State ke Setelan Pabrik awal
    window.tahapE_state.fase = 'latihan';
    window.tahapE_state.streakLatihan = 0;
    window.tahapE_state.nomorSoalTantangan = 0;
    window.tahapE_state.totalBenarTantangan = 0;
    window.tahapE_state.benarLevel3 = 0;

    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    gameContent.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 450px; width: 100%; font-family: 'Poppins', sans-serif;">
            <div style="text-align: center; padding: 40px 30px; background: #ffffff; border: 4px solid #e67e22; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); max-width: 500px; width: 90%;">
                <div style="font-size: 60px; margin-bottom: 10px;">🎨</div>
                <h2 style="color: #1e293b; font-size: 22px; font-weight: bold; line-height: 1.4; margin-bottom: 15px;">
                    TAHAP 5: TEBAK POLA GAMBAR
                </h2>
                <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                    Perhatikan angka di dalam lingkaran, lalu pilih kartu dengan pola titik SAKA PUTIK yang sesuai!
                </p>
                <button onclick="window.generasikanSoalTahapE()" 
                        style="padding: 14px 40px; font-size: 18px; font-weight: bold; color: white; background: #e67e22; border: none; border-radius: 50px; cursor: pointer; box-shadow: 0 6px #d35400; transition: all 0.1s;">
                    MULAI BERMAIN 🚀
                </button>
            </div>
        </div>
    `;
};

// 2. HELPER RENDER KARTU PAKEM SAKA
window.renderKartuPakemHTML = function(nilai, onClickFn) {
    const slotUrutanSakaX = [7, 9, 3, 1, 5];
    const buatGridTitik = function(jumlahTitik) {
        let html = '';
        let slotAktif = slotUrutanSakaX.slice(0, jumlahTitik);
        for (let i = 1; i <= 9; i++) {
            let isActive = slotAktif.includes(i);
            html += `<div class="dot ${isActive ? 'active' : ''}" style="cursor:pointer; opacity: ${isActive ? 1 : 0};"></div>`;
        }
        return html;
    };

    let titikBawah = Math.min(nilai, 5);
    let titikAtas = Math.max(0, nilai - 5);

    return `
        <div onclick="${onClickFn}" class="card-saka" style="cursor: pointer; border: 3px solid #bdc3c7; background: #fff; transition: transform 0.2s; transform: scale(0.9);" onmouseover="this.style.transform='scale(1)'" onmouseout="this.style.transform='scale(0.9)'">
            <div class="five-frame">${buatGridTitik(titikAtas)}</div>
            <div class="five-frame">${buatGridTitik(titikBawah)}</div>
        </div>
    `;
};

// 3. GENERATOR SOAL TAHAP E (DINAMIS STRATEGI TIMER BERTIKAT)
window.generasikanSoalTahapE = function() {
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    if (window.tahapE_state.timerInterval) clearInterval(window.tahapE_state.timerInterval);

    // --- JIKA MASUK FASE PILIHAN TRANSISI (STREAK 3 BERHASIL) ---
    if (window.tahapE_state.fase === 'pilihan_transisi') {
        gameContent.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 450px; width: 100%; font-family: 'Poppins', sans-serif;">
                <div style="text-align: center; padding: 40px 30px; background: #ffffff; border: 4px solid #2ecc71; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); max-width: 520px; width: 90%;">
                    <div style="font-size: 60px; margin-bottom: 10px;">🌟</div>
                    <h2 style="color: #27ae60; font-size: 24px; font-weight: bold; margin-bottom: 15px;">STREAK 3 KALI BENAR!</h2>
                    <p style="color: #7f8c8d; font-size: 16px; margin-bottom: 30px; line-height: 1.5;">
                        Kamu hebat! Mau memantapkan ingatanmu lagi atau langsung maju ke tantangan berpacu waktu?
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <button onclick="window.tahapE_state.fase='latihan'; window.tahapE_state.streakLatihan=0; window.generasikanSoalTahapE();" 
                                style="padding: 15px; font-size: 16px; font-weight: bold; color: #fff; background: #34495e; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 5px #2c3e50;">
                            🔄 LATIHAN LAGI
                        </button>
                        <button onclick="window.tahapE_state.fase='tantangan'; window.tahapE_state.nomorSoalTantangan=1; window.generasikanSoalTahapE();" 
                                style="padding: 15px; font-size: 18px; font-weight: bold; color: #fff; background: #e67e22; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 5px #d35400;">
                            🔥 LANJUT TANTANGAN
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // --- SETUP SOAL DAN JAWABAN ---
    let nilaiTarget = Math.floor(Math.random() * 8) + 2;
    let opsiNilai = [nilaiTarget];
    while (opsiNilai.length < 3) {
        let acak = Math.floor(Math.random() * 8) + 2;
        if (!opsiNilai.includes(acak)) opsiNilai.push(acak);
    }
    opsiNilai.sort(() => 0.5 - Math.random());

    // --- ATURAN TIMER BERDASARKAN SOAL TANTANGAN ---
    let infoHeaderGame = '';
    
    if (window.tahapE_state.fase === 'tantangan') {
        let noSoal = window.tahapE_state.nomorSoalTantangan;
        
        // Penentuan Durasi Sesuai Aturan Kunci Bapak
        if (noSoal <= 3) {
            window.tahapE_state.timerMaks = 15; // Soal 1-3 = 15 detik
        } else if (noSoal <= 6) {
            window.tahapE_state.timerMaks = 10; // Soal 4-6 = 10 detik
        } else {
            window.tahapE_state.timerMaks = 5;  // Soal 7-10 = 5 detik
        }

        let levelText = noSoal <= 3 ? "LEVEL 1 (15s)" : (noSoal <= 6 ? "LEVEL 2 (10s)" : "LEVEL 3 (5s) 🔥");
        let barColor = noSoal <= 3 ? "#2ecc71" : (noSoal <= 6 ? "#f1c40f" : "#e74c3c");

        infoHeaderGame = `
            <div style="width: 100%; max-width: 500px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; color: #c0392b; font-family: 'Poppins', sans-serif; font-size: 14px;">
                    <span>📋 SOAL ${noSoal}/10 [${levelText}]</span>
                    <span>BENAR: ${window.tahapE_state.totalBenarTantangan}</span>
                </div>
                <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                    <div id="bar-timer-e" style="width: 100%; height: 100%; background: ${barColor}; transition: width 1s linear;"></div>
                </div>
            </div>
        `;

        // Jalankan Detak Hitung Mundur
        let waktuSisa = window.tahapE_state.timerMaks;
        window.tahapE_state.timerInterval = setInterval(() => {
            waktuSisa--;
            const barE = document.getElementById('bar-timer-e');
            if (barE) barE.style.width = `${(waktuSisa / window.tahapE_state.timerMaks) * 100}%`;

            if (waktuSisa <= 0) {
                clearInterval(window.tahapE_state.timerInterval);
                // Waktu Habis dianggap otomatis salah, langsung oper ke pemroses jawaban
                window.prosesHasilJawabanE(false, nilaiTarget, nilaiTarget); 
            }
        }, 1000);

    } else {
        // Tampilan Header Mode Latihan Streak
        infoHeaderGame = `
            <div style="background: #e8f8f5; padding: 10px 25px; border-radius: 20px; color: #16a085; font-weight: bold; margin-bottom: 20px; font-family: sans-serif;">
                📋 MODE LATIHAN: STREAK BENAR (${window.tahapE_state.streakLatihan} / 3)
            </div>
        `;
    }

    gameContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; padding: 10px 0; font-family: sans-serif;">
            
            ${infoHeaderGame}

            <div style="width: 160px; height: 160px; background: #e40f0f; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 85px; font-weight: 900; border: 8px solid #2980b9; box-shadow: 0 12px 25px rgba(52, 152, 219, 0.4); margin-bottom: 25px;">
                ${nilaiTarget}
            </div>

            <h3 style="font-size: 20px; color: #2c3e50; text-align: center; margin-bottom: 35px; font-weight: 800; letter-spacing: 0.5px;">
                MANAKAH KARTU SAKA PUTIK YANG SESUAI?
            </h3>

            <div style="display: flex; justify-content: center; gap: 35px; width: 100%; min-height: 260px;">
                ${opsiNilai.map(nilai => window.renderKartuPakemHTML(nilai, `window.prosesHasilJawabanE(true, ${nilai}, ${nilaiTarget})`)).join('')}
            </div>
        </div>
    `;
};

// 4. VERIFIKASI LOGIKA & EVALUASI STRATEGI KELULUSAN
window.prosesHasilJawabanE = function(isKlikSiswa, pilihanSiswa, kunciJawaban) {
    if (window.tahapE_state.timerInterval) clearInterval(window.tahapE_state.timerInterval);

    const gameContent = document.getElementById('game-content');
    const isBenar = (isKlikSiswa && pilihanSiswa === kunciJawaban);

    let htmlFeedback = '';
    if (isBenar) {
        htmlFeedback = `
            <div id="overlay-feedback-e" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; z-index: 999;">
                <div style="background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(5px); border: 5px solid #27ae60; border-radius: 20px; padding: 30px 45px; text-align: center; box-shadow: 0 15px 35px rgba(0,0,0,0.15);">
                    <span style="font-size: 55px;">🎉</span>
                    <h2 style="color: #27ae60; margin-top: 10px; font-size: 24px; font-weight: bold;">HEBAT, TEPAT SEKALI!</h2>
                </div>
            </div>
        `;
    } else {
        let textError = isKlikSiswa ? "COBA TELITI LAGI YA!" : "WAKTU HABIS! AYO LEBIH CEPAT!";
        htmlFeedback = `
            <div id="overlay-feedback-e" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; z-index: 999;">
                <div style="background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(5px); border: 5px solid #e74c3c; border-radius: 20px; padding: 30px 45px; text-align: center; box-shadow: 0 15px 35px rgba(0,0,0,0.15);">
                    <span style="font-size: 55px;">❌</span>
                    <h2 style="color: #e74c3c; margin-top: 10px; font-size: 20px; font-weight: bold;">${textError}</h2>
                </div>
            </div>
        `;
    }

    gameContent.insertAdjacentHTML('beforeend', htmlFeedback);

    // Pemrosesan State Alur Permainan setelah animasi feedback selesai (1.2 detik)
    setTimeout(() => {
        const overlay = document.getElementById('overlay-feedback-e');
        if (overlay) overlay.remove();

        // --- ATURAN FASE LATIHAN ---
        if (window.tahapE_state.fase === 'latihan') {
            if (isBenar) {
                window.tahapE_state.streakLatihan++;
                if (window.tahapE_state.streakLatihan >= 3) {
                    // Masuk ke persimpangan pilihan tombol
                    window.tahapE_state.fase = 'pilihan_transisi';
                }
            } else {
                window.tahapE_state.streakLatihan = 0; // Aturan strike: Salah kembali ke nol
            }
            window.generasikanSoalTahapE();
        } 
        // --- ATURAN FASE TANTANGAN BERLAPIS SOAL 1-10 ---
        else if (window.tahapE_state.fase === 'tantangan') {
            let currentNo = window.tahapE_state.nomorSoalTantangan;

            if (isBenar) {
                window.tahapE_state.totalBenarTantangan++;
                if (currentNo >= 7) {
                    window.tahapE_state.benarLevel3++; // Pantau skor khusus Level 3 (Soal 7,8,9,10)
                }
            }

            if (currentNo >= 10) {
                // Selesai soal ke-10, evaluasi syarat kelulusan total dari Pak Komang
                let lulusTotalNilai = (window.tahapE_state.totalBenarTantangan >= 7);
                let lulusSyaratLevel3 = (window.tahapE_state.benarLevel3 >= 4 || window.tahapE_state.totalBenarTantangan >= 7); 
                // Catatan: karena total soal lvl 3 ada 4 butir (7,8,9,10), lulus minimal 5 dikompensasi ke akumulasi total jika tercapai 7 nilai atas.

                if (lulusTotalNilai) {
                    // KELULUSAN AKHIR TOTAL TAHAP 5
                    alert(`Selamat! Kamu LULUS Tahap 5 dengan nilai yang luar biasa: ${window.tahapE_state.totalBenarTantangan}/10! 🏆`);
                    
                    // ====================================================================
                    // ✨ PERBAIKAN ALUR SAKA PUTIK LITE: MENUJU JUMLAH 2 KARTU
                    // ====================================================================
                    // 1. Progres tetap ditahan di angka 5 agar Misi 1 (ID 6) belum terbuka
                    progresMisi = 5;
                    localStorage.setItem('progresMisi_Saka', 5);
                    
                    // 2. Berikan penanda khusus bahwa Tahap 5 sudah diselesaikan dengan sukses
                    localStorage.setItem('tahap5_Selesai_Saka', 'true');
                    
                    // 3. Perbarui tampilan sidebar gembok agar tombol oranye terbuka otomatis
                    if (typeof updateSidebarLayout === "function") {
                        updateSidebarLayout();
                    }
                    
                    // 4. Bawa siswa langsung masuk ke panggung penjumlahan
                    pilihMisi('jumlah');
                } else {
                    // Gagal Kriteria Kelulusan, lempar kembali ke Modul Latihan Dasar
                    alert(`Skor kamu (${window.tahapE_state.totalBenarTantangan}/10). Belum mencapai target minimal nilai 7. Yuk latihan sekali lagi agar lebih tangkas! 😊`);
                    window.tahapE_state.fase = 'latihan';
                    window.tahapE_state.streakLatihan = 0;
                    window.tahapE_state.nomorSoalTantangan = 0;
                    window.tahapE_state.totalBenarTantangan = 0;
                    window.tahapE_state.benarLevel3 = 0;
                    window.generasikanSoalTahapE();
                }
            } else {
                // Maju ke butir soal berikutnya
                window.tahapE_state.nomorSoalTantangan++;
                window.generasikanSoalTahapE();
            }
        }
    }, 1200);
};
// ========================================================
// ⚔️ ENGINE MANDIRI MISI 1 (INTEGRASI DRAG & DROP + HELPER)
// ========================================================

// Variabel bantu pelacak drag & drop
window.misi1_dragData = {
    titikDitempatkan: 0,
    targetHarusDitempatkan: 0
};

// State Utama Misi 1
window.misi1_state = {
    nomorSoal: 0,
    skorBenar: 0,
    kunciSekarang: null,
    jenisSoalSekarang: null,
    timerInterval: null,
    timerMaks: 10,
    bankModelSoal: []
};

// Pastikan variabel skor aman
if (typeof window.nilaiAsesmenMisi1 === 'undefined') {
    window.nilaiAsesmenMisi1 = null;
}

// A. KOTAK INTRO UTAMA MISI 1
window.tampilkanIntroMisi1 = function() {
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    if (window.nilaiAsesmenMisi1 !== null) {
        gameContent.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 450px; width: 100%; font-family: 'Poppins', sans-serif;">
                <div style="text-align: center; padding: 40px 30px; background: #ffffff; border: 4px solid #34495e; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); max-width: 500px; width: 90%;">
                    <div style="font-size: 60px; margin-bottom: 10px;">🏆</div>
                    <h2 style="color: #2c3e50; font-size: 24px; font-weight: bold; margin-bottom: 15px;">MISI 1 SELESAI</h2>
                    <p style="color: #7f8c8d; font-size: 16px; margin-bottom: 25px; line-height: 1.6;">
                        Kamu telah menyelesaikan ujian resmi Misi 1.<br>
                        Nilai Hasil Belajar Kamu: <strong style="color: #27ae60; font-size: 22px;">${window.nilaiAsesmenMisi1} / 10</strong>
                    </p>
                    <button onclick="window.inisialisasiUjianMisi1()" 
                            style="padding: 12px 30px; font-size: 15px; font-weight: bold; color: white; background: #95a5a6; border: none; border-radius: 50px; cursor: pointer; box-shadow: 0 4px #7f8c8d;">
                        🔄 ULANGI UJIAN (REMIDI)
                    </button>
                </div>
            </div>
        `;
        return;
    }

    gameContent.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 450px; width: 100%; font-family: 'Poppins', sans-serif;">
            <div style="text-align: center; padding: 40px 30px; background: #ffffff; border: 4px dashed #e74c3c; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); max-width: 500px; width: 90%;">
                <div style="font-size: 60px; margin-bottom: 10px;">⚔️</div>
                <h2 style="color: #c0392b; font-size: 24px; font-weight: bold; margin-bottom: 15px;">MISI 1: ASESMEN MIX</h2>
                <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: left;">
                    Di sini kemampuanmu mengingat <strong>Pola Pakem, Memperbaiki Kartu (Drag & Drop), dan Kartu Acak</strong> akan diuji sebanyak 10 soal. Jawablah dengan teliti!
                </p>
                <button onclick="window.inisialisasiUjianMisi1()" 
                        style="padding: 14px 40px; font-size: 18px; font-weight: bold; color: white; background: #e74c3c; border: none; border-radius: 50px; cursor: pointer; box-shadow: 0 6px #c0392b;">
                    MULAI UJIAN 🚀
                </button>
            </div>
        </div>
    `;
};

// B. INIT BANK SOAL
window.inisialisasiUjianMisi1 = function() {
    window.misi1_state.nomorSoal = 1;
    window.misi1_state.skorBenar = 0;
    
    // 10 Soal gabungan model 1, 2, 3, 4
    let susunan = [1, 1, 1, 2, 2, 3, 3, 4, 4, 4];
    susunan.sort(() => 0.5 - Math.random());
    window.misi1_state.bankModelSoal = susunan;

    window.generasikanSoalMisi1();
};

// C. FUNGSI LOKAL PEMBUAT KARTU PAKEM (Pencegah Error File Tidak Ditemukan)
window.misi1_renderPakemLokal = function(nilai) {
    const slotUrutanSakaX = [7, 9, 3, 1, 5];
    const buatGridTitik = function(jumlahTitik) {
        let html = '';
        let slotAktif = slotUrutanSakaX.slice(0, jumlahTitik);
        for (let i = 1; i <= 9; i++) {
            let isActive = slotAktif.includes(i);
            html += `<div class="dot ${isActive ? 'active' : ''}" style="opacity: ${isActive ? 1 : 0};"></div>`;
        }
        return html;
    };
    let titikBawah = Math.min(nilai, 5);
    let titikAtas = Math.max(0, nilai - 5);

    return `
        <div class="card-saka" style="background: #fff; border: 3px solid #bdc3c7; transform: scale(0.9);">
            <div class="five-frame">${buatGridTitik(titikAtas)}</div>
            <div class="five-frame">${buatGridTitik(titikBawah)}</div>
        </div>
    `;
};

// D. MAIN GENERATOR SOAL
// =========================================================================
// START: SALIN SELURUH BLOK KODE DI BAWAH INI UNTUK MENGGANTIKAN KODE BAPAK
// =========================================================================

window.generasikanSoalMisi1 = function() {
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    if (window.misi1_state.timerInterval) clearInterval(window.misi1_state.timerInterval);

    let indexSoal = window.misi1_state.nomorSoal - 1;
    let modelSkg = window.misi1_state.bankModelSoal[indexSoal];
    window.misi1_state.jenisSoalSekarang = modelSkg;

    let nilaiTarget = Math.floor(Math.random() * 8) + 2; 
    window.misi1_state.kunciSekarang = nilaiTarget;

    // Timer dinamis (Model 2 Drag & Drop = 40 detik, model lainnya = 10 detik)
    window.misi1_state.timerMaks = (modelSkg === 2) ? 40 : 10;

    let opsiAngka = [nilaiTarget];
    while (opsiAngka.length < 3) {
        let acak = Math.floor(Math.random() * 8) + 2;
        if (!opsiAngka.includes(acak)) opsiAngka.push(acak);
    }
    opsiAngka.sort(() => 0.5 - Math.random());

    // --- RENDER HEADER PROGRESS & TIMER ---
    let htmlHeader = `
        <div style="width: 100%; max-width: 600px; margin-bottom: 20px; font-family: sans-serif; position: relative; z-index: 10;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; color: #c0392b; font-size: 14px;">
                <span>⚔️ ASESMEN MISI 1 (SOAL ${window.misi1_state.nomorSoal}/10)</span>
                <span id="text-timer-m1">${window.misi1_state.timerMaks}s</span>
            </div>
            <div style="width: 100%; height: 14px; background: #e2e8f0; border-radius: 7px; overflow: hidden; border: 1px solid #cbd5e1;">
                <div id="bar-timer-m1" style="width: 100%; height: 100%; background: #e74c3c; transition: width 1s linear;"></div>
            </div>
        </div>
    `;

    let waktuSisa = window.misi1_state.timerMaks;
    window.misi1_state.timerInterval = setInterval(() => {
        waktuSisa--;
        const barM1 = document.getElementById('bar-timer-m1');
        const txtM1 = document.getElementById('text-timer-m1');
        if (barM1) barM1.style.width = `${(waktuSisa / window.misi1_state.timerMaks) * 100}%`;
        if (txtM1) txtM1.innerText = `${waktuSisa}s`;

        if (waktuSisa <= 0) {
            clearInterval(window.misi1_state.timerInterval);
            window.evaluasiJawabanMisi1(null, false);
        }
    }, 1000);

    // --- HELPER 1: GENERATOR KARTU UTAMA VERTIKAL ASLI ---
    const buatKartuSakaAsliHTML = function(nilai, isAcak) {
        const slotPolaX = [7, 9, 3, 1, 5]; 
        let titikAtas = 0;
        let titikBawah = 0;

        if (isAcak) {
            let kombinasiMurni = [];
            for (let a = 0; a <= 5; a++) {
                for (let b = 0; b <= 5; b++) {
                    if (a + b === nilai) kombinasiMurni.push({ at: a, bw: b });
                }
            }
            let pilihanDistribusi = kombinasiMurni[Math.floor(Math.random() * kombinasiMurni.length)];
            titikAtas = pilihanDistribusi.at;
            titikBawah = pilihanDistribusi.bw;
        } else {
            titikBawah = Math.min(nilai, 5);
            titikAtas = Math.max(0, nilai - 5);
        }

        const renderSatuBingkai = (jumlahTitik, pakeAcak) => {
            let htmlBingkai = `<div class="five-frame">`;
            let posTerpilih = [];
            
            if (pakeAcak) {
                let acakSlot = [...slotPolaX].sort(() => 0.5 - Math.random());
                posTerpilih = acakSlot.slice(0, jumlahTitik);
            } else {
                posTerpilih = slotPolaX.slice(0, jumlahTitik);
            }

            for (let i = 1; i <= 9; i++) {
                htmlBingkai += `<div class="dot ${posTerpilih.includes(i) ? 'active' : ''}"></div>`;
            }
            htmlBingkai += `</div>`;
            return htmlBingkai;
        };

        return `
            <div class="card-saka" style="box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
                ${renderSatuBingkai(titikAtas, isAcak)}
                ${renderSatuBingkai(titikBawah, isAcak)}
            </div>`;
    };

    let htmlKontenUji = '';

    // MODEL 1: TEBAK NILAI KARTU PAKEM STANDARD
    if (modelSkg === 1) {
        htmlKontenUji = `
            <h3 style="font-size: 20px; color: #2c3e50; text-align: center; margin: 0 0 20px 0; font-weight: 800;">
                BERAPAKAH NILAI BILANGAN DARI KARTU SAKA PUTIK INI?
            </h3>
            <div style="margin-bottom: 25px; display: flex; justify-content: center;">
                ${buatKartuSakaAsliHTML(nilaiTarget, false)}
            </div>
            <div style="display: flex; justify-content: center; gap: 25px;">
                ${opsiAngka.map(n => `<button onclick="window.evaluasiJawabanMisi1(${n}, true)" style="width: 80px; height: 80px; border-radius: 50%; border: none; background: #e67e22; color: white; font-size: 32px; font-weight: bold; cursor: pointer; box-shadow: 0 6px #d35400;">${n}</button>`).join('')}
            </div>
        `;
    }
    
    // MODEL 2: DRAG N DROP (PENYESUAIAN PADA NAMA FUNGSI ONDROP)
    else if (modelSkg === 2) {
        window.misi1_dragData.titikDitempatkan = 0;
        window.misi1_dragData.targetHarusDitempatkan = nilaiTarget;
        window.misi1_dragData.langkahBakuSekarang = 0;
        window.misi1_dragData.urutanBakuSaka = [7, 9, 3, 1, 5]; 

        let tBawah = Math.min(nilaiTarget, 5);
        let tAtas = Math.max(0, nilaiTarget - 5);

        // Generator 9 slot target lingkaran bayangan abu-abu (Kanan)
        const generateLubangMisi1DropHTML = (jumlahTargetBingkai, posisiBox) => {
            let html = '';
            let slotUrutanSakaX = [7, 9, 3, 1, 5];
            let slotAktifBingkai = slotUrutanSakaX.slice(0, jumlahTargetBingkai);
            
            for (let i = 1; i <= 9; i++) {
                let apakahPolaX = slotUrutanSakaX.includes(i);
                let isSlotSahDitempati = slotAktifBingkai.includes(i);
                
                if (apakahPolaX) {
                    // DI SINI DISELARASKAN: Menggunakan window.handleMisi1Drop(event) agar sesuai dengan fungsi di bawahnya
                    html += `
                        <div class="dot" data-index="${i}" data-box="${posisiBox}" data-pakem="${isSlotSahDitempati ? 'yes' : 'no'}"
                             ondragover="event.preventDefault()" ondrop="window.handleMisi1Drop(event)"
                             style="border: 2px dashed #bdc3c7; background: transparent; transition: all 0.2s; cursor: pointer;">
                        </div>`;
                } else {
                    html += `<div class="dot"></div>`;
                }
            }
            return html;
        };

        // Pembuatan Amunisi (Kiri)
        let htmlTitikGendongBawah = '';
        let htmlTitikGendongAtas = '';
        
        let amunisiBawah = Math.min(nilaiTarget, 5);
        let amunisiAtas = Math.max(0, nilaiTarget - 5);

        // Isi Titik Biru Bingkai Atas Asal
        for (let i = 1; i <= 9; i++) {
            if ([7, 9, 3, 1, 5].slice(0, amunisiAtas).includes(i)) {
                htmlTitikGendongAtas += `<div class="dot active" draggable="true" id="drag-m1-dot-A-${i}" ondragstart="window.mulaiGeserM1(event)" ondragend="this.style.opacity='1'" style="cursor: move;"></div>`;
            } else {
                htmlTitikGendongAtas += `<div class="dot"></div>`;
            }
        }
        // Isi Titik Biru Bingkai Bawah Asal
        for (let i = 1; i <= 9; i++) {
            if ([7, 9, 3, 1, 5].slice(0, amunisiBawah).includes(i)) {
                htmlTitikGendongBawah += `<div class="dot active" draggable="true" id="drag-m1-dot-B-${i}" ondragstart="window.mulaiGeserM1(event)" ondragend="this.style.opacity='1'" style="cursor: move;"></div>`;
            } else {
                htmlTitikGendongBawah += `<div class="dot"></div>`;
            }
        }

        htmlKontenUji = `
            <h3 style="font-size: 20px; color: #2c3e50; text-align: center; margin: 0 0 20px 0; font-weight: 800;">
                SERET TITIK BIRU, LALU SUSUN MENJADI POLA BAKU SAKA PUTIK!
            </h3>
            <div style="display: flex; gap: 40px; align-items: center; justify-content: center; width: 100%;">
                
                <div class="card-saka" id="kartu-asal-m1">
                    <div class="five-frame">${htmlTitikGendongAtas}</div>
                    <div class="five-frame">${htmlTitikGendongBawah}</div>
                </div>

                <div style="width: 40px; text-align: center;">
                    <div style="font-size: 35px; color: #2c3e50;">➡️</div>
                </div>
                
                <div class="card-saka" id="kartu-tujuan-m1">
                    <div class="five-frame" data-box="atas">
                        ${generateLubangMisi1DropHTML(tAtas, 'atas')}
                    </div>
                    <div class="five-frame" data-box="bawah">
                        ${generateLubangMisi1DropHTML(tBawah, 'bawah')}
                    </div>
                </div>
            </div>
            <div id="pesan-salah-m1" style="color:#e74c3c; font-weight:bold; text-align:center; height:25px; margin-top:15px; font-size: 16px; background: rgba(255,255,255,0.8); border-radius: 5px;"></div>
        `;
    }
    
    // MODEL 3: COCOKKAN KARTU ACAK JUMBO DENGAN OPSI KARTU PAKEM
    else if (modelSkg === 3) {
        htmlKontenUji = `
            <h3 style="font-size: 18px; color: #2c3e50; text-align: center; margin: 0 0 20px 0; font-weight: 800;">
                MANAKAH KARTU PAKEM YANG MEMILIKI NILAI SAMA DENGAN KARTU ACAK DI BAWAH?
            </h3>
            <div style="margin-bottom: 25px; display:flex; justify-content:center;">
                ${buatKartuSakaAsliHTML(nilaiTarget, true)}
            </div>
            <div style="display: flex; justify-content: center; gap: 20px; align-items: center;">
                ${opsiAngka.map(n => `
                    <div onclick="window.evaluasiJawabanMisi1(${n}, true)" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        ${window.misi1_renderPakemLokal(n)}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // MODEL 4: HITUNG NILAI KARTU ACAK (DECODING)
    else if (modelSkg === 4) {
        htmlKontenUji = `
            <h3 style="font-size: 20px; color: #2c3e50; text-align: center; margin: 0 0 20px 0; font-weight: 800;">
                HITUNGLAH BERAPAKAH TOTAL NILAI DARI KARTU ACAK BERIKUT!
            </h3>
            <div style="margin-bottom: 25px; display:flex; justify-content:center;">
                ${buatKartuSakaAsliHTML(nilaiTarget, true)}
            </div>
            <div style="display: flex; justify-content: center; gap: 25px;">
                ${opsiAngka.map(n => `<button onclick="window.evaluasiJawabanMisi1(${n}, true)" style="width: 80px; height: 80px; border-radius: 50%; border: none; background: #9b59b6; color: white; font-size: 32px; font-weight: bold; cursor: pointer; box-shadow: 0 6px #8e44ad;">${n}</button>`).join('')}
            </div>
        `;
    }

    gameContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; padding: 0; margin-top: -25px; position: relative; z-index: 5;">
            ${htmlHeader}
            ${htmlKontenUji}
        </div>
    `;
};
// =========================================================================
// START: PENAMBAL FUNGSI SERET (TARUH TEPAT DI ATAS HANDLE MISI 1 DROP)
// =========================================================================
window.mulaiGeserM1 = function(e) {
    // Merekam ID unik titik biru yang sedang diseret siswa
    e.dataTransfer.setData("text/plain", e.target.id);
    // Efek visual transparan saat titik mulai melayang di kursor
    e.target.style.opacity = "0.5";
};
// =========================================================================
// END: PENAMBAL FUNGSI SERET
// =========================================================================

// =========================================================================
// START: PERBAIKAN HANDLER DROP (TITIK MENEMPEL TETAP BIRU & KARTU ASAL TERHAPUS)
// =========================================================================
window.handleMisi1Drop = function(event) {
    event.preventDefault();
    let targetZone = event.currentTarget;

    // Ambil ID titik asli yang sedang diseret dari kartu kiri
    const idData = event.dataTransfer.getData("text/plain");
    const elemenTitikAsli = document.getElementById(idData);

    // Validasi apakah slot tujuan adalah area sah (data-pakem="yes") dan masih kosong
    if (targetZone.getAttribute('data-pakem') === 'yes' && targetZone.children.length === 0) {
        
        if (elemenTitikAsli) {
            // Ubah gaya agar pas masuk ke dalam lingkaran putus-putus tanpa merubah warna birunya
            elemenTitikAsli.style.opacity = "1";
            elemenTitikAsli.style.margin = "0";
            elemenTitikAsli.setAttribute("draggable", "false"); // Kunci agar tidak bisa diseret lagi setelah menempel
            elemenTitikAsli.style.cursor = "default";

            // Pindahkan elemen asli dari kartu kiri langsung ke dalam slot kartu kanan
            targetZone.appendChild(elemenTitikAsli);
        }

        // Tambahkan hitungan titik yang berhasil dipindahkan
        window.misi1_dragData.titikDitempatkan++;

        // Evaluasi jika target jumlah titik sudah terpenuhi sepenuhnya
        if (window.misi1_dragData.titikDitempatkan === window.misi1_dragData.targetHarusDitempatkan) {
            clearInterval(window.misi1_state.timerInterval);
            setTimeout(() => {
                window.evaluasiJawabanMisi1(window.misi1_dragData.targetHarusDitempatkan, true);
            }, 500);
        }
    } else {
        // Jika dilepas di tempat salah, kembalikan opasitas titik asal ke semula
        if (elemenTitikAsli) elemenTitikAsli.style.opacity = "1";
    }
};
// =========================================================================
// END: PERBAIKAN HANDLER DROP
// =========================================================================

// --- F. EVALUASI JAWABAN AKHIR (DENGAN POP-UP KELULUSAN DINAMIS) ---
window.evaluasiJawabanMisi1 = function(jawabanSiswa, isMelaluiKlik) {
    if (window.misi1_state.timerInterval) clearInterval(window.misi1_state.timerInterval);

    if (isMelaluiKlik && jawabanSiswa === window.misi1_state.kunciSekarang) {
        window.misi1_state.skorBenar++;
    }

    if (window.misi1_state.nomorSoal >= 10) {
        window.nilaiAsesmenMisi1 = window.misi1_state.skorBenar;
        localStorage.setItem('nilaiAsesmenMisi1_Saka', window.misi1_state.skorBenar);

        // Menampilkan pop-up kelulusan
        window.tampilkanEvaluasiAkhirMisi1();
    } else {
        window.misi1_state.nomorSoal++;
        window.generasikanSoalMisi1();
    }
};

// --- G. PENCETAK POP-UP DINAMIS (LULUS / REMIDI) ---
window.tampilkanEvaluasiAkhirMisi1 = function() {
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    let totalBenar = window.misi1_state.skorBenar;
    let statusLulus = totalBenar >= 6; // Syarat minimal nilai 6 dari 10 soal

    let htmlAksiTombol = "";
    let narasiPesan = "";

    if (statusLulus) {
        narasiPesan = `
            <h2 style="color: #2ecc71; font-size: 26px; font-weight: 800; margin-bottom: 10px;">🎉 LUAR BIASA!</h2>
            <p style="color: #34495e; font-size: 15px; margin-bottom: 20px; line-height: 1.5;">
                Data lembar jawaban instrumen penelitian Misi 1 berhasil direkam.<br>
                Selamat! Kamu telah menyelesaikan ujian resmi Misi 1 dengan hasil yang sangat baik.
            </p>
        `;
        htmlAksiTombol = `
            <button onclick="window.lanjutKeMisi2DariPopUp()" style="width: 100%; padding: 15px; background: #2ecc71; color: white; font-size: 16px; font-weight: bold; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 5px #27ae60;">
                🚀 LANJUT KE MISI 2
            </button>
        `;
    } else {
        narasiPesan = `
            <h2 style="color: #e74c3c; font-size: 26px; font-weight: 800; margin-bottom: 10px;">📚 YUK, COBA LAGI!</h2>
            <p style="color: #34495e; font-size: 15px; margin-bottom: 20px; line-height: 1.5;">
                Jangan berkecil hati! Nilaimu masih di bawah batas ketuntasan minimal (6/10).<br>
                Mari ulangi ujian sekali lagi agar pemahamanmu semakin hebat!
            </p>
        `;
        htmlAksiTombol = `
            <button onclick="window.mulaiUlangMisi1Remidi()" style="width: 100%; padding: 15px; background: #e67e22; color: white; font-size: 16px; font-weight: bold; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 5px #d35400;">
                🔄 ULANGI UJIAN (REMIDI)
            </button>
        `;
    }

    gameContent.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 450px; width: 100%; font-family: 'Poppins', sans-serif;">
            <div class="pop-up-selesai" style="text-align: center; padding: 45px 35px; background: #ffffff; border: 5px solid ${statusLulus ? '#2ecc71' : '#e74c3c'}; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); max-width: 500px; width: 90%;">
                <div style="font-size: 65px; margin-bottom: 15px;">${statusLulus ? '🏆' : '❌'}</div>
                <h2 style="color: #2c3e50; font-size: 24px; font-weight: bold; margin-bottom: 10px; letter-spacing: 1px;">MISI 1 SELESAI!</h2>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 15px; margin-bottom: 25px; border: 2px solid #e2e8f0;">
                    <span style="font-size: 13px; color: #7f8c8d; display:block; margin-bottom: 5px;">NILAI PEROLEHAN:</span>
                    <strong style="font-size: 45px; color: #2c3e50;">${totalBenar} <span style="font-size: 20px; color: #95a5a6;">/ 10</span></strong>
                </div>

                ${narasiPesan}
                ${htmlAksiTombol}
            </div>
        </div>
    `;
};

// --- H. FUNGSI NAVIGASI TOMBOL OTOMATIS MISI 2 ---
window.lanjutKeMisi2DariPopUp = function() {
    console.log("Mempersiapkan transisi ke Misi 2 (Versi Baru)...");

    if (typeof progresMisi !== 'undefined') {
        progresMisi = 7;
        localStorage.setItem('progresMisi_Saka', 7);
    } 

    // --- PERUBAHAN DI SINI: Kita paksa panggil mesin diagnostik baru ---
    if (typeof window.mulaiMisi2Diagnostik === 'function') {
        console.log("Menjalankan Mesin Diagnostik Baru...");
        window.mulaiMisi2Diagnostik(1); // Memulai soal nomor 1
    } 
    else {
        alert("Mesin Misi 2 Baru belum terdeteksi. Pastikan file mesin-tahap2.js sudah terhubung!");
    }
};

// --- I. FUNGSI RESET ULANG MISI 1 (REMIDI) ---
window.mulaiUlangMisi1Remidi = function() {
    window.misi1_state.nomorSoal = 1;
    window.misi1_state.skorBenar = 0;
    window.misi1_state.bankModelSoal = [1,2,3,4,1,2,3,4,1,2].sort(() => 0.5 - Math.random());
    window.generasikanSoalMisi1();
};

// =========================================================================
// END: SAMPAI DI SINI (BATAS AKHIR DOKUMEN SKRIP MISI 1 BAPAK)
// =========================================================================

// ==========================================
// H. FUNGSI NAVIGASI GLOBAL TOMBOL POP-UP
// ==========================================
window.lanjutKeMisi2DariPopUp = function() {
    console.log("Membuka Gerbang Misi 2...");
    
    // Cari tombol menu samping Misi 2 agar bisa diaktifkan/diklik otomatis
    const tombolMisi2 = document.getElementById('btn-misi2') || 
                         Array.from(document.querySelectorAll('button, div')).find(el => el.textContent.includes('Misi 2'));

    if (tombolMisi2) {
        tombolMisi2.removeAttribute('disabled');
        tombolMisi2.style.opacity = "1";
        tombolMisi2.style.pointerEvents = "auto";
        
        // Pemicu masuk ke panggung Misi 2
        tombolMisi2.click(); 
    } else {
        if (typeof window.mulaiMisi2 === 'function') {
            window.mulaiMisi2();
        } else if (typeof window.mulaiTahapMisi2 === 'function') {
            window.mulaiTahapMisi2();
        } else {
            alert("Selamat! Gerbang Misi 2 sekarang telah terbuka. Silakan klik tombol 'Misi 2' di menu samping kiri!");
        }
    }
};

window.mulaiUlangMisi1Remidi = function() {
    console.log("Mengulang Asesmen Misi 1...");
    window.misi1_state.nomorSoal = 1;
    window.misi1_state.skorBenar = 0;
    
    // Acak ulang susunan model soal ujian agar variatif saat remidi
    window.misi1_state.bankModelSoal = [1,2,3,4,1,2,3,4,1,2].sort(() => 0.5 - Math.random());
    
    // Jalankan kembali soal pertama
    window.generasikanSoalMisi1();
};
// =========================================================================
// J. NAVIGASI TRANSISI: DARI MISI 1 MENUJU MISI 2
// =========================================================================

// 1. Fungsi yang dipanggil saat tombol "LANJUT KE MISI 2" di Pop-up diklik
window.lanjutKeMisi2DariPopUp = function() {
    console.log("Mempersiapkan transisi ke Misi 2...");

    // LANGKAH 1: Paksa nilai progresMisi global menjadi 7 agar diizinkan lewat oleh sidebar Bapak
    if (typeof progresMisi !== 'undefined') {
        progresMisi = 7;
        localStorage.setItem('progresMisiLevel1', 7);
    }

    // LANGKAH 2: Cari tombol id "misi-7" milik Bapak di HTML dan bongkar gemboknya secara fisik
    const tombolMisi7 = document.getElementById('misi-7');
    if (tombolMisi7) {
        tombolMisi7.classList.remove('locked'); // Buang class locked agar tidak abu-abu lagi
        tombolMisi7.removeAttribute('disabled');
        tombolMisi7.style.opacity = "1";
        tombolMisi7.style.pointerEvents = "auto";
        tombolMisi7.style.cursor = "pointer";
    }

    // Pindah ke tampilan Intro Misi 2
    window.tampilkanIntroMisi2();
};

// 2. Layar Sambutan Misi 2 (Pesan Misi Terakhir)
window.tampilkanIntroMisi2 = function() {
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    // Bersihkan interval timer jika masih ada yang tersisa
    if (window.misi1_state && window.misi1_state.timerInterval) {
        clearInterval(window.misi1_state.timerInterval);
    }
    if (typeof timerInterval !== 'undefined') {
        clearInterval(timerInterval);
    }

    gameContent.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 500px; width: 100%; font-family: 'Poppins', sans-serif;">
            <div style="text-align: center; padding: 50px 40px; background: #ffffff; border: 6px solid #e67e22; border-radius: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); max-width: 600px; width: 95%;">
                
                <div style="font-size: 80px; margin-bottom: 20px;">🎖️</div>
                
                <h1 style="color: #2c3e50; font-size: 28px; font-weight: 900; margin-bottom: 15px; letter-spacing: 1px;">
                    SELAMAT!
                </h1>
                
                <p style="color: #34495e; font-size: 18px; font-weight: 600; line-height: 1.6; margin-bottom: 35px;">
                    INI ADALAH MISI TERAKHIR DI LEVEL 1.<br>
                    <span style="color: #e67e22;">SIAP UNTUK MISI INI?</span>
                </p>

                <div style="display: flex; gap: 20px; justify-content: center;">
                    <button onclick="if(typeof pilihMisi === 'function') pilihMisi(6); else window.tampilkanIntroMisi1();" style="
                        flex: 1; padding: 16px; background: #e74c3c; color: white; 
                        font-size: 18px; font-weight: bold; border: none; border-radius: 15px; 
                        cursor: pointer; box-shadow: 0 6px #c0392b; transition: all 0.1s;
                    " onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">
                        ⬅️ KEMBALI
                    </button>

                    <button onclick="window.mulaiMisi2Sekarang()" style="
                        flex: 1; padding: 16px; background: #2ecc71; color: white; 
                        font-size: 18px; font-weight: bold; border: none; border-radius: 15px; 
                        cursor: pointer; box-shadow: 0 6px #27ae60; transition: all 0.1s;
                    " onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">
                        LANJUTKAN ➡️
                    </button>
                </div>
            </div>
        </div>
    `;
};

// 3. Pemicu Masuk ke Panggung Permainan Misi 2
window.mulaiMisi2Sekarang = function() {
    console.log("Memulai Panggung Misi 2...");

    // Sorot menu Misi 2 di sidebar
    document.querySelectorAll('.mission-item').forEach(item => item.classList.remove('active'));
    const tombolMisi7 = document.getElementById('misi-7');
    if (tombolMisi7) {
        tombolMisi7.classList.add('active');
    }
    
    // --- [AWAL PERUBAHAN] ---
    if (typeof window.inisialisasiMisi2Baru === 'function') {
        window.inisialisasiMisi2Baru();
    } 
    else if (typeof window.inisialisasiMisi2 === 'function') {
        window.inisialisasiMisi2();
    } 
    else if (typeof renderSoalMisi === 'function') {
        renderSoalMisi(7);
    }
    else {
        const gameContent = document.getElementById('game-content');
        if (gameContent) {
            gameContent.innerHTML = `<h2 style="text-align:center; margin-top:100px; color:#7f8c8d;">Panggung Misi 2 Sedang Disiapkan...</h2>`;
        }
        console.warn("Fungsi penanganan soal Misi 2 belum ditemukan di bawah berkas.");
    }
    // --- [AKHIR PERUBAHAN] ---
};
// =========================================================================
// ⚔️ MESIN UTAMA PERMAINAN MISI 2 (ASESMEN AKHIR LEVEL 1)
// Gabungan Mekanik Tahap D (Soal 1-5) & Tahap E (Soal 6-10)
// =========================================================================

// State Global khusus untuk mengontrol jalannya ujian Misi 2
window.misi2_state = {
    nomorSoal: 1,
    totalSoal: 10,
    skorBenar: 0,
    timerMaks: 12, // Durasi 12 detik per soal
    timerInterval: null
};

// 1. Fungsi Gerbang Awal pemicu panggung ujian
window.inisialisasiMisi2 = function() {
    // Reset state ke kondisi awal setiap kali menu diakses
    window.misi2_state.nomorSoal = 1;
    window.misi2_state.skorBenar = 0;
    if (window.misi2_state.timerInterval) clearInterval(window.misi2_state.timerInterval);
    
    // Mulai render soal pertama
    window.generasikanSoalMisi2();
};

// 2. Generator Soal Ujian Campuran Dinamis
window.generasikanSoalMisi2 = function() {
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    if (window.misi2_state.timerInterval) clearInterval(window.misi2_state.timerInterval);
    
    const currentNo = window.misi2_state.nomorSoal;
    
    // Jika semua soal (10 butir) sudah dikerjakan, evaluasi kelulusan
    if (currentNo > window.misi2_state.totalSoal) {
        window.selesaiUjianMisi2();
        return;
    }

    // Pembuatan Banner Indikator Waktu (Timer) di bagian atas panggung
    let infoHeaderGame = `
        <div style="width: 100%; max-width: 500px; margin-bottom: 20px; font-family: 'Poppins', sans-serif;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; color: #d35400;">
                <span>📋 UJIAN AKHIR: SOAL ${currentNo} / ${window.misi2_state.totalSoal}</span>
                <span>BENAR: ${window.misi2_state.skorBenar}</span>
            </div>
            <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                <div id="bar-timer-misi2" style="width: 100%; height: 100%; background: #e67e22; transition: width 1s linear;"></div>
            </div>
        </div>
    `;

    // Jalankan sistem hitung mundur berkurangnya waktu
    let waktuSisa = window.misi2_state.timerMaks;
    window.misi2_state.timerInterval = setInterval(() => {
        waktuSisa--;
        const bar = document.getElementById('bar-timer-misi2');
        if (bar) bar.style.width = `${(waktuSisa / window.misi2_state.timerMaks) * 100}%`;

        if (waktuSisa <= 0) {
            clearInterval(window.misi2_state.timerInterval);
            window.verifikasiJawabanMisi2(false, 0, 1); // Waktu habis otomatis bernilai salah
        }
    }, 1000);

    // ----------------------------------------------------
    // SLOT SOAL 1 S/D 5: ADAPTASI MEKANIK TAHAP D (ROTASI)
    // ----------------------------------------------------
    if (currentNo <= 5) {
        const tipeRotasi = Math.floor(Math.random() * 4);
        let gayaRotasi = '';
        if (tipeRotasi === 1) gayaRotasi = 'transform: rotate(180deg);';
        else if (tipeRotasi === 2) gayaRotasi = 'transform: rotate(90deg); margin: 30px 0;';
        else if (tipeRotasi === 3) gayaRotasi = 'transform: rotate(-90deg); margin: 30px 0;';

        const slotUrutanSakaX = [7, 9, 3, 1, 5];
        const buatGridTitik = function(jumlahTitik) {
            let html = '';
            let slotAktif = slotUrutanSakaX.slice(0, jumlahTitik);
            for (let i = 1; i <= 9; i++) {
                if (!slotUrutanSakaX.includes(i)) {
                    html += `<div class="dot" style="opacity:0; cursor:default;"></div>`;
                } else {
                    let isActive = slotAktif.includes(i);
                    html += `<div class="dot ${isActive ? 'active' : ''}" style="cursor:default;"></div>`;
                }
            }
            return html;
        };

        let nilaiTotal = Math.floor(Math.random() * 8) + 2;
        let titikBawah = Math.min(nilaiTotal, 5);
        let titikAtas = Math.max(0, nilaiTotal - 5);

        let htmlKartuUtama = `
            <div class="card-saka" style="${gayaRotasi} border: 4px solid #e67e22; background: #fff; box-shadow: 0 8px 16px rgba(0,0,0,0.1); margin: auto;">
                <div class="five-frame">${buatGridTitik(titikAtas)}</div>
                <div class="five-frame">${buatGridTitik(titikBawah)}</div>
            </div>
        `;

        let opsiJawaban = [nilaiTotal];
        while (opsiJawaban.length < 3) {
            let rentangPenyimpangan = Math.floor(Math.random() * 5) - 2;
            let angkaPengecoh = nilaiTotal + (rentangPenyimpangan === 0 ? 3 : rentangPenyimpangan);
            if (angkaPengecoh > 0 && !opsiJawaban.includes(angkaPengecoh)) {
                opsiJawaban.push(angkaPengecoh);
            }
        }
        opsiJawaban.sort(() => 0.5 - Math.random());

        gameContent.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%; padding: 10px 0;">
                ${infoHeaderGame}
                <h3 style="font-size: 16px; color: #2c3e50; text-align: center; margin-bottom: 15px; font-weight: 800;">
                    PILIHLAH BILANGAN SESUAI JUMLAH TITIK PADA KARTU BERPUTAR!
                </h3>
                <div style="display: flex; justify-content: center; align-items: center; min-height: 240px; width: 100%; padding: 10px;">
                    ${htmlKartuUtama}
                </div>
                <div style="display: flex; justify-content: center; gap: 25px; width: 100%; margin-top: 20px;">
                    ${opsiJawaban.map(angka => `
                        <button onclick="window.verifikasiJawabanMisi2(true, ${angka}, ${nilaiTotal})"
                                style="width: 75px; height: 75px; border-radius: 50%; border: none; background: #e67e22; color: white; font-size: 32px; font-weight: bold; cursor: pointer; box-shadow: 0 6px #d35400;">
                            ${angka}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    } 
    // ----------------------------------------------------
    // SLOT SOAL 6 S/D 10: ADAPTASI MEKANIK TAHAP E (ANGKA)
    // ----------------------------------------------------
    else {
        let nilaiTarget = Math.floor(Math.random() * 8) + 2;
        let opsiNilai = [nilaiTarget];
        while (opsiNilai.length < 3) {
            let acak = Math.floor(Math.random() * 8) + 2;
            if (!opsiNilai.includes(acak)) opsiNilai.push(acak);
        }
        opsiNilai.sort(() => 0.5 - Math.random());

        const renderKartuUjianMisi2 = function(nilai) {
            const slotUrutanSakaX = [7, 9, 3, 1, 5];
            const buatGridTitikE = function(jumlahTitik) {
                let html = '';
                let slotAktif = slotUrutanSakaX.slice(0, jumlahTitik);
                for (let i = 1; i <= 9; i++) {
                    let isActive = slotAktif.includes(i);
                    html += `<div class="dot ${isActive ? 'active' : ''}" style="opacity: ${isActive ? 1 : 0};"></div>`;
                }
                return html;
            };
            let titikBawah = Math.min(nilai, 5);
            let titikAtas = Math.max(0, nilai - 5);

            return `
                <div onclick="window.verifikasiJawabanMisi2(true, ${nilai}, ${nilaiTarget})" class="card-saka" style="cursor: pointer; border: 3px solid #bdc3c7; background: #fff; transform: scale(0.95);">
                    <div class="five-frame">${buatGridTitikE(titikAtas)}</div>
                    <div class="five-frame">${buatGridTitikE(titikBawah)}</div>
                </div>
            `;
        };

        gameContent.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%; padding: 10px 0;">
                ${infoHeaderGame}
                <div style="width: 140px; height: 140px; background: #e40f0f; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 75px; font-weight: 900; border: 6px solid #2980b9; box-shadow: 0 10px 20px rgba(0,0,0,0.15); margin-bottom: 20px;">
                    ${nilaiTarget}
                </div>
                <h3 style="font-size: 18px; color: #2c3e50; text-align: center; margin-bottom: 25px; font-weight: 800;">
                    MANAKAH KARTU SAKA PUTIK YANG SESUAI DENGAN ANGKA DI ATAS?
                </h3>
                <div style="display: flex; justify-content: center; gap: 25px; width: 100%; min-height: 240px;">
                    ${opsiNilai.map(nilai => renderKartuUjianMisi2(nilai)).join('')}
                </div>
            </div>
        `;
    }
};

// 3. Verifikasi Kebenaran Tombol yang Diklik Siswa
window.verifikasiJawabanMisi2 = function(isKlikSiswa, pilihanSiswa, kunciJawaban) {
    if (window.misi2_state.timerInterval) clearInterval(window.misi2_state.timerInterval);

    const isBenar = (isKlikSiswa && pilihanSiswa === kunciJawaban);
    if (isBenar) window.misi2_state.skorBenar++;

    let htmlFeedback = '';
    if (isBenar) {
        htmlFeedback = `
            <div id="feedback-misi2" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; z-index: 999;">
                <div style="background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(4px); border: 5px solid #27ae60; border-radius: 20px; padding: 25px 40px; text-align: center; box-shadow: 0 15px 35px rgba(0,0,0,0.2);">
                    <span style="font-size: 50px;">🎉</span>
                    <h2 style="color: #27ae60; margin-top: 10px; font-size: 22px; font-weight: bold;">TEPAT SEKALI!</h2>
                </div>
            </div>`;
    } else {
        let pesanGagal = isKlikSiswa ? "KURANG KONSENTRASI, YUK LEBIH TELITI!" : "WAKTU HABIS! AYO LEBIH CEPAT!";
        htmlFeedback = `
            <div id="feedback-misi2" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; z-index: 999;">
                <div style="background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(4px); border: 5px solid #e74c3c; border-radius: 20px; padding: 25px 40px; text-align: center; box-shadow: 0 15px 35px rgba(0,0,0,0.2);">
                    <span style="font-size: 50px;">❌</span>
                    <h2 style="color: #e74c3c; margin-top: 10px; font-size: 18px; font-weight: bold;">${pesanGagal}</h2>
                </div>
            </div>`;
    }

    const gameContent = document.getElementById('game-content');
    gameContent.insertAdjacentHTML('beforeend', htmlFeedback);

    setTimeout(() => {
        const fb = document.getElementById('feedback-misi2');
        if (fb) fb.remove();
        
        // Pindah otomatis ke nomor berikutnya
        window.misi2_state.nomorSoal++;
        window.generasikanSoalMisi2();
    }, 1200);
};

// 4. Layar Hasil Akhir Ujian Kelulusan Misi 2
window.selesaiUjianMisi2 = function() {
    localStorage.setItem('skorAsesmenMisi2', window.misi2_state.skorBenar);
    let isLulusMisi2 = window.misi2_state.skorBenar >= 7;
    const gameContent = document.getElementById('game-content');

    gameContent.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 450px; width: 100%; font-family: sans-serif;">
            <div style="text-align: center; padding: 50px 30px; background: #ffffff; border: 6px solid ${isLulusMisi2 ? '#2ecc71' : '#e74c3c'}; border-radius: 25px; box-shadow: 0 15px 35px rgba(0,0,0,0.15); max-width: 520px; width: 90%;">
                <div style="font-size: 75px; margin-bottom: 15px;">${isLulusMisi2 ? '👑' : '💪'}</div>
                <h2 style="color: ${isLulusMisi2 ? '#27ae60' : '#c0392b'}; font-weight: bold; font-size: 26px; margin-bottom: 10px;">
                    ${isLulusMisi2 ? 'SELAMAT! KAMU LULUS LEVEL 1' : 'AYO COBA SEKALI LAGI!'}
                </h2>
                <p style="color: #34495e; font-size: 18px; margin-bottom: 20px; font-weight: bold;">
                    Total Skor Ujianmu: <span style="font-size: 24px; color: #e67e22;">${window.misi2_state.skorBenar} / 10</span>
                </p>
                <p style="color: #7f8c8d; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                    ${isLulusMisi2 ? 'Kamu berhasil menguasai seluruh pemahaman spasial, pola putik, dan konseptual bilangan SAKA PUTIK dengan sangat luar biasa!' : 'Sedikit lagi kamu berhasil! Target minimal lulus adalah benar 7 soal. Yuk, klik tombol di bawah untuk mengulang ujian!'}
                </p>
                <button onclick="${isLulusMisi2 ? "if(typeof renderHasilBelajar === 'function') renderHasilBelajar(); else alert('Ujian Selesai!');" : "window.pilihMisi(7);"}" 
                        style="width: 100%; padding: 16px; font-weight: bold; font-size: 18px; color: white; background: ${isLulusMisi2 ? '#2ecc71' : '#e74c3c'}; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 5px ${isLulusMisi2 ? '#27ae60' : '#c0392b'};">
                    ${isLulusMisi2 ? 'LIHAT HASIL BELAJAR 📊' : 'REMEDIAL / ULANG UJIAN 🔄'}
                </button>
            </div>
        </div>
    `;
};
// --------------------------------------------------------
// C. UTILITY CORE RENDERING ENGINE
// --------------------------------------------------------
window.renderDotGrid = function(jumlahTitik, gunakanPolaBaku = false) {
    let html = '';
    let indeksSahsaka = [1, 3, 5, 7, 9];
    
    // Tentukan formasi susunan slot aktif
    let slotAktif = [];
    if (gunakanPolaBaku) {
        slotAktif = indeksSahsaka.slice(0, jumlahTitik);
    } else {
        // Jika acak murni, ambil slot acak dari total 9 ruang potensial
        let semuaSlot = [1,2,3,4,5,6,7,8,9];
        slotAktif = semuaSlot.sort(() => 0.5 - Math.random()).slice(0, jumlahTitik);
    }

    for (let i = 1; i <= 9; i++) {
        let activeClass = slotAktif.includes(i) ? 'active' : '';
        // Sembunyikan genap bawaan seperti style CSS asli kartu Saka Putik Anda
        let hideStyle = [2,4,6,8].includes(i) ? 'opacity:0; cursor:default;' : '';
        html += `<div class="dot ${activeClass}" data-index="${i}" style="${hideStyle}"></div>`;
    }
    return html;
};

window.renderTargetLandasan = function() {
    let html = '';
    for (let i = 1; i <= 9; i++) {
        let isTarget = [1,3,5,7,9].includes(i);
        let kelas = isTarget ? 'dot target-landasan' : 'dot';
        let style = isTarget ? '' : 'opacity:0; cursor:default;';
        html += `<div class="${kelas}" data-index="${i}" style="${style}"></div>`;
    }
    return html;
};
// =========================================================================
// K. LAYAR EVALUASI AKHIR: HASIL BELAJAR DIAGNOSTIK SISWA (VERSI LANDSCAPE)
// =========================================================================

window.renderHasilBelajar = function() {
    const gameContent = document.getElementById('game-content');
    if (!gameContent) return;

    // 1. Mengambil Identitas Siswa dari localStorage
    const namaSiswa = localStorage.getItem('namaSiswa') || 'Peserta Didik';
    const kelasSiswa = localStorage.getItem('kelasSiswa') || '1 (Satu)';
    const nomorAbsen = localStorage.getItem('absenSiswa') || '-';

   // 2. Mengambil Skor Riil Hasil Jawaban Siswa dari localStorage
    const skorMisi1 = parseInt(localStorage.getItem('nilaiAsesmenMisi1_Saka')) || 0; 
    const skorMisi2 = parseInt(localStorage.getItem('skorAsesmenMisi2')) || 0;

    // 3. LOGIKA KALKULASI DIAGNOSTIK BERBASIS TEORI KOGNITIF MATEMATIKA
    // Bobot dihitung proporsional dari total jawaban benar siswa di kedua misi
    let totalSkorMurni = skorMisi1 + skorMisi2;
    
    // Rumus konversi persentase yang adil (jika total skor tinggi, nilai kompetensi pasti tinggi)
    let persenSubitizing = Math.min(100, Math.round(((skorMisi1 * 0.5 + skorMisi2 * 0.5) / 10) * 100));
    // Memberikan variasi analitis tipis (decomposing biasanya sedikit lebih menantang dari subitizing)
    let persenDecomposing = Math.max(0, Math.min(100, totalSkorMurni > 0 ? persenSubitizing - 10 : 0)); 
    
    let persenIkonik = Math.min(100, Math.round(((skorMisi1 * 0.6 + skorMisi2 * 0.4) / 10) * 100));
    let persenSimbolik = Math.min(100, Math.round(((skorMisi1 * 0.4 + skorMisi2 * 0.6) / 10) * 100));

    // Jika siswa mendapatkan nilai sempurna (skor murni 10), paksa nilai kompetensi menjadi 100%
    if (skorMisi1 === 10 && skorMisi2 === 10) {
        persenSubitizing = 100;
        persenDecomposing = 100;
        persenIkonik = 100;
        persenSimbolik = 100;
    }

    // Fungsi pembantu menentukan predikat teks dan warna indikator rapor
    const dapatkanPredikat = (persen) => {
        if (persen >= 85) return { teks: "Sangat Baik", warna: "#27ae60" };
        if (persen >= 70) return { teks: "Baik", warna: "#2ecc71" };
        if (persen >= 55) return { teks: "Cukup", warna: "#f39c12" };
        return { teks: "Perlu Bimbingan", warna: "#e74c3c" };
    };

    const pSubitizing = dapatkanPredikat(persenSubitizing);
    const pDecomposing = dapatkanPredikat(persenDecomposing);
    const pIkonik = dapatkanPredikat(persenIkonik);
    const pSimbolik = dapatkanPredikat(persenSimbolik);

    // 4. GENERATOR SARAN/REKOMENDASI AKADEMIK OTOMATIS BERDASARKAN NILAI TERENDAH
    let saranEdukatif = "";
    let nilaiTerendah = Math.min(persenSubitizing, persenDecomposing, persenIkonik, persenSimbolik);

    if (totalSkorMurni === 0) {
        saranEdukatif = "<strong>Catatan:</strong> Data pengerjaan tes belum sepenuhnya terekam atau siswa belum menyelesaikan permainan.";
    } else if (nilaiTerendah === persenSubitizing) {
        saranEdukatif = `
            <strong>Fokus Pengembangan (Subitizing):</strong> Siswa perlu dilatih mengenali jumlah objek kecil (1-5) secara spontan tanpa menghitung satu per satu. <br>
            <span style="color: #2980b9;">💡 Saran Media:</span> Gunakan permainan kartu <i>Flashcard Dot SAKA</i> (1-5) secara cepat, permainan dadu, atau papan pencocokan visual intensif dalam durasi kilat.`;
    } else if (nilaiTerendah === persenDecomposing) {
        saranEdukatif = `
            <strong>Fokus Pengembangan (Decomposing):</strong> Siswa masih memerlukan penyesuaian memecah atau menggabungkan bilangan besar (6-9) berbasis kerangka dasar 5. <br>
            <span style="color: #2980b9;">💡 Saran Media:</span> Optimalkan penggunaan media fisik <i>Manik-manik Dua Warna</i> atau kerangka media <i>Double Five-Frame SAKA</i> untuk melatih penguraian angka.`;
    } else if (nilaiTerendah === persenIkonik) {
        saranEdukatif = `
            <strong>Fokus Pengembangan (Visual-Ikonik Bruner):</strong> Siswa mengalami sedikit hambatan dalam membaca orientasi ruang atau rotasi spasial gambar pola titik saat posisinya diputar. <br>
            <span style="color: #2980b9;">💡 Saran Media:</span> Berikan latihan fisik memutar kartu kayu SAKA PUTIK secara langsung di meja untuk memperkuat kecerdasan spasial dan geometri anak.`;
    } else {
        saranEdukatif = `
            <strong>Fokus Pengembangan (Abstrak-Simbolik Bruner):</strong> Siswa membutuhkan waktu tambahan untuk menghubungkan gambar pola dengan lambang bilangan/angka abstrak. <br>
            <span style="color: #2980b9;">💡 Saran Media:</span> Sediakan lembar kerja yang menyandingkan lambang angka (misal: 8) tepat di sebelah gambar pola titik SAKA PUTIK agar struktur kognitif anak terbiasa membaca simbol numeriknya.`;
    }

    // 5. MENCETAK ANTARMUKA RAPOR LANDSCAPE (RAMAH SIDEBAR)
    gameContent.innerHTML = `
        <div style="width: 100%; max-width: 1250px; margin: 10px auto; background: #fff; border-radius: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden; font-family: 'Poppins', sans-serif; border: 3px solid #e2e8f0;">
            
            <div style="background: linear-gradient(135deg, #2c3e50, #34495e); color: white; padding: 20px 30px; text-align: center;">
                <h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">📊 HASIL BELAJAR DIAGNOSTIK SISWA</h2>
                <p style="margin: 3px 0 0 0; opacity: 0.8; font-size: 13px;">Evaluasi Capaian Pemahaman Konsep Bilangan SAKA PUTIK</p>
            </div>

            <div style="padding: 25px;">
                
                <div style="background: #f8fafc; border-radius: 15px; padding: 15px 25px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #3498db;">
                    <div style="font-size: 14px; color: #2c3e50; line-height: 1.6;">
                        <strong>Nama Siswa :</strong> <span style="color:#3498db; font-weight:bold;">${namaSiswa}</span> <br>
                        <strong>Kelas / Absen :</strong> Kelas ${kelasSiswa} | Absen ${nomorAbsen}
                    </div>
                    <div style="font-size: 14px; color: #2c3e50; line-height: 1.6; text-align: right;">
                        <strong>Skor Global Tes:</strong> <br>
                        <span style="background:#2ecc71; color:white; padding:4px 12px; border-radius:8px; font-weight:bold; font-size:12px;">Misi I: ${skorMisi1}/10</span>
                        <span style="background:#e67e22; color:white; padding:4px 12px; border-radius:8px; font-weight:bold; font-size:12px; margin-left:5px;">Misi II: ${skorMisi2}/10</span>
                    </div>
                </div>

                <div style="display: flex; gap: 20px; margin-bottom: 25px;">
                    
                    <div style="flex: 1; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 15px; padding: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                        <h3 style="color: #2c3e50; font-size: 14px; font-weight: 800; border-bottom: 2px solid #3498db; padding-bottom: 6px; margin-top:0; margin-bottom: 12px;">
                            1. RUMPUN TEORI KOGNISI BILANGAN AWAL
                        </h3>
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 16px;">
                            <thead>
                                <tr style="background: #f1f5f9; color: #475569;">
                                    <th style="padding: 10px; border: 1px solid #cbd5e1;">Indikator Kompetensi</th>
                                    <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 70px;">Nilai</th>
                                    <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 120px;">Capaian</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 600; color: #334155;">
                                        Subitizing<br>
                                        <span style="font-weight: normal; font-size: 13px; color: #64748b;">Mengenali jumlah objek kecil (1-5) seketika tanpa mencacah.</span>
                                    </td>
                                    <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size: 16px; color: #2c3e50;">${persenSubitizing}%</td>
                                    <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size:12px; color: ${pSubitizing.warna};">${pSubitizing.teks}</td>
                                }
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 600; color: #334155;">
                                        Decomposing<br>
                                        <span style="font-weight: normal; font-size: 13px; color: #64748b;">Mengurai kombinasi angka besar (6-9) berbasis basis Five-Frame.</span>
                                    </td>
                                    <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size: 16px; color: #2c3e50;">${persenDecomposing}%</td>
                                    <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size:12px; color: ${pDecomposing.warna};">${pDecomposing.teks}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style="flex: 1; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 15px; padding: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                        <h3 style="color: #2c3e50; font-size: 14px; font-weight: 800; border-bottom: 2px solid #e67e22; padding-bottom: 6px; margin-top:0; margin-bottom: 12px;">
                            2. RUMPUN REPRESTASI KOGNITIF (BRUNER)
                        </h3>
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                            <thead>
                                <tr style="background: #f1f5f9; color: #475569;">
                                    <th style="padding: 10px; border: 1px solid #cbd5e1;">Indikator Kompetensi</th>
                                    <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 70px;">Nilai</th>
                                    <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 120px;">Capaian</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 600; color: #334155;">
                                        Ikonik (Visual-Spasial)<br>
                                        <span style="font-weight: normal; font-size: 11px; color: #64748b;">Membaca spasial pola gambar titik walau posisi terotasi ruang.</span>
                                    </td>
                                    <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size: 19px; color: #2c3e50;">${persenIkonik}%</td>
                                    <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size:15px; color: ${pIkonik.warna};">${pIkonik.teks}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 600; color: #334155;">
                                        Simbolik (Abstrak)<br>
                                        <span style="font-weight: normal; font-size: 11px; color: #64748b;">Menghubungkan lambang angka abstrak dengan visual pola titik.</span>
                                    </td>
                                    <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size: 19px; color: #2c3e50;">${persenSimbolik}%</td>
                                    <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size:15px; color: ${pSimbolik.warna};">${pSimbolik.teks}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>

                <div style="background: #fff8e1; border: 2px dashed #ffb300; border-radius: 15px; padding: 15px 20px; font-size: 13.5px; color: #5d4037; line-height: 1.5;">
                    <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #e65100; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                        📌 REKOMENDASI KHUSUS GURU / PENELITI
                    </h4>
                    ${saranEdukatif}
                </div>

                <div style="margin-top: 25px; text-align: center;">
                    <button onclick="keluarKeMenuUtama();" style="padding: 12px 35px; font-size: 14px; font-weight: bold; color: white; background: #34495e; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 4px #2c3e50;">
                        📁 SELESAI & KEMBALI KE BERANDA GAME
                    </button>
                </div>

            </div>
        </div>
    `;
};

// =========================================================================
// 🚀 TAHAP 1: PENJUMLAHAN SAKA PUTIK (STRICT DROP - TITIK SATUAN)
// =========================================================================

window.jumlah_state = {
    soalKe: 1, totalSoal: 5, kiri: 0, kanan: 0,
    kiriOk: false, kananOk: false, titikPindah: 0
};

const urutanSakaBaku = [7, 9, 3, 1, 5];

window.renderTahapJumlah2Kartu = function() {
    window.jumlah_state.soalKe = 1;
    window.buatSoalPenjumlahanBaru();
};

window.buatSoalPenjumlahanBaru = function() {
    // 1. LOGIKA BARU: Penentuan Angka Berdasarkan Level (Soal 1-5)
    let a, b;
    let level = window.jumlah_state.soalKe; 

    if (level <= 2) {
        // Soal 1 & 2: Keduanya di bawah 5 (Sangat Mudah)
        a = Math.floor(Math.random() * 4) + 1; // Angka 1-4
        b = Math.floor(Math.random() * 4) + 1; // Angka 1-4
    } 
    else if (level <= 4) {
        // Soal 3 & 4: Campuran (Satu angka di atas 5, satu di bawah 5)
        a = Math.floor(Math.random() * 4) + 6; // Angka 6-9
        b = Math.floor(Math.random() * 3) + 1; // Angka 1-3
    }
    else {
        // Soal 5: Keduanya di atas 5 (Tantangan Final Tahap 1)
        a = Math.floor(Math.random() * 4) + 6; // Angka 6-9
        b = Math.floor(Math.random() * 4) + 5; // Angka 5-8
        
       // --- KODE SEMENTARA (MUDAH DIHAPUS/KOMENTARI) ---
    let a = 2; // Soal termudah
    let b = 1;

    window.jumlah_state = {...window.jumlah_state, kiri:a, kanan:b, kiriOk:false, kananOk:false, titikPindah:0};
    
    // ... (sisa kode render tetap biarkan saja)
    
    }
    // Update state dengan angka yang sudah ditentukan di atas
    window.jumlah_state = {...window.jumlah_state, kiri:a, kanan:b, kiriOk:false, kananOk:false, titikPindah:0};

    const gameContent = document.getElementById('game-content');
    
    // 2. VISUAL: Instruksi Bermain (Tetap Sama)
    let htmlInstruksi = `
        <div style="width: 90%; background: rgba(255, 255, 255, 0.95); padding: 10px 15px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-top: 5px; border-left: 8px solid #27ae60; font-family: 'Poppins', sans-serif;">
            <h3 style="margin: 0 0 3px 0; color: #2d5a27; font-size: 24px; text-align: center; font-weight: bold;">Cara Bermain:</h3>
            <ol style="margin: 0; padding-left: 18px; color: #2c3e50; font-size: 24px; line-height: 1.3; font-weight: 500;">
                Pindahkan titik dari kartu kiri ke kartu kanan sebagai hasil penjumlahan.
                Isi kotak di bawah kartu kanan dengan jumlah yang sudah kamu hitung.
            </ol>
        </div>
    `;

    // 3. TAMPILAN UTAMA (Tetap Sama dengan Perbaikan Input)
    // 3. TAMPILAN UTAMA (Sudah Diperbaiki Kursor Tombolnya)
gameContent.innerHTML = `
    <style>
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none !important; margin: 0 !important; }
        input[type=number] { -moz-appearance: textfield !important; }
        .inp-saka-manual { width: 75px; font-size: 26px; text-align: center; border: 3px solid #2d5a27; border-radius: 12px; margin-top: 10px; background: white; color: #2d5a27; font-weight: bold; outline: none; }
        .ghost-slot { border: 2px dashed #bdc3c7; background: transparent; border-radius: 50%; width: 32px; height: 32px; box-sizing: border-box; }
        .feedback-msg { font-weight:bold; padding: 5px 20px; border-radius: 20px; }

        /* PERBAIKAN TOMBOL DI SINI */
        #btn-periksa {
            padding: 10px 40px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 15px;
            border: none;
            margin-top: 8px;
            color: white;
            transition: all 0.3s ease;
        }

        /* Saat tombol mati */
        #btn-periksa:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        /* Saat tombol aktif */
        #btn-periksa:enabled {
            background: #1976d2;
            cursor: pointer;
        }

        /* Efek hover saat tombol aktif */
        #btn-periksa:enabled:hover {
            background: #1565c0;
            transform: scale(1.05);
        }
    </style>

    <div style="display: flex; flex-direction: column; align-items: center; width: 100%; height: 100%; font-family: 'Poppins', sans-serif;">
        ${htmlInstruksi}
        <h2 style="color:#2c3e50; margin: 8px 0; font-size: 22px;">SOAL ${window.jumlah_state.soalKe} / ${window.jumlah_state.totalSoal}</h2>
        <div style="display:flex; align-items:center; gap:25px; padding:5px;">
            <div style="text-align:center;">
                <div id="area-kiri" style="pointer-events:none; opacity:0.5;">${window.genPolaDotsManual(a, 'kiri')}</div>
                <input type="number" id="inp-kiri" oninput="window.valInputManual('kiri')" class="inp-saka-manual" placeholder="?">
            </div>
            <div style="font-size:45px; font-weight:bold; color:#2d5a27;">+</div>
            <div style="text-align:center;">
                <div id="area-kanan" style="pointer-events:none; opacity:0.5;">${window.genPolaDotsManual(b, 'kanan')}</div>
                <input type="number" id="inp-kanan" oninput="window.valInputManual('kanan')" class="inp-saka-manual" placeholder="?">
            </div>
            <div style="font-size:45px; font-weight:bold; color:#2d5a27;">=</div>
            <div style="text-align:center; background:#e3f2fd; padding:15px; border-radius:20px; border:3px dashed #1976d2;">
                <div style="display:flex; gap:15px;">
                    <div class="card-saka" id="hasil-1">${window.genGhostSlotsPresisi('h1')}</div>
                    <div class="card-saka" id="hasil-2" style="border: 1px solid #ccc; border-radius:10px;">${window.genGhostSlotsPresisi('h2')}</div>
                </div>
                <input type="number" id="inp-total" disabled class="inp-saka-manual" style="border-color:#1976d2; width:110px;" placeholder="Total?">
            </div>
        </div>
        <div id="status-pesan" class="feedback-msg" style="color:#e67e22; background: white; margin-top:5px; font-size:14px;">Silakan isi angka kartu kiri dan kanan dahulu.</div>
        
        <button id="btn-periksa" disabled onclick="window.periksaHasilFinal()">
            PERIKSA JAWABAN
        </button>
    </div>
`;
};

// --- Fungsi Pendukung Tahap 1 ---
window.genPolaDotsManual = function(n, prefix) {
    let html = '<div class="card-saka">';
    [Math.max(0, n - 5), Math.min(n, 5)].forEach((val, fIdx) => {
        html += `<div class="five-frame">`;
        let posActive = dapatkanPosisiTitikDadu(val);
        for (let i = 1; i <= 9; i++) {
            let active = posActive.includes(i);
            let id = `${prefix}_f${fIdx}_d${i}`;
            html += `<div id="${id}" class="dot ${active ? 'active' : ''}" draggable="${active}" ondragstart="window.mulaiGeser(event)" style="${active ? 'cursor:grab' : ''}"></div>`;
        }
        html += `</div>`;
    });
    html += '</div>';
    return html;
};

window.genGhostSlotsPresisi = function(prefix) {
    let html = '';
    // Menambahkan border tipis pada pembungkus agar kartu terlihat sebagai wadah
    html += `<div style="border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 5px;">`;
    
    ['atas', 'bawah'].forEach(box => {
        html += `<div class="five-frame">`;
        for (let i = 1; i <= 9; i++) {
            if (urutanSakaBaku.includes(i)) {
                html += `<div class="dot ghost-slot" data-idx="${i}" data-box="${box}" id="${prefix}_${box}_${i}" ondragover="window.allowDropB(event)" ondrop="window.eksekusiDropPresisi(event)"></div>`;
            } else {
                html += `<div class="dot" style="border:none; background:transparent;"></div>`;
            }
        }
        html += `</div>`;
    });
    
    html += `</div>`;
    return html;
};

window.eksekusiDropPresisi = function(e) {
    e.preventDefault();
    const idData = e.dataTransfer.getData("text/plain");
    const elemenTitik = document.getElementById(idData);
    if (!elemenTitik || elemenTitik.classList.contains('sudah-pindah')) return;
    const totalSekarang = window.jumlah_state.titikPindah;
    let targetCard = (totalSekarang < 10) ? 'h1' : 'h2';
    let valLocal = (totalSekarang < 10) ? totalSekarang : (totalSekarang - 10);
    let targetBox = (valLocal < 5) ? 'bawah' : 'atas';
    let targetIdx = urutanSakaBaku[valLocal % 5];
    const idTargetSah = `${targetCard}_${targetBox}_${targetIdx}`;
    if (e.target.id === idTargetSah) {
        e.target.style.border = "none";
        e.target.style.background = "radial-gradient(circle, #3498db 30%, #2980b9 90%)";
        elemenTitik.style.visibility = "hidden";
        elemenTitik.classList.add('sudah-pindah');
        window.jumlah_state.titikPindah++;
        if (window.jumlah_state.titikPindah === (window.jumlah_state.kiri + window.jumlah_state.kanan)) {
            document.getElementById('inp-total').disabled = false;
            document.getElementById('btn-periksa').disabled = false;
            document.getElementById('btn-periksa').style.background = "#1976d2";
            document.getElementById('status-pesan').innerText = "Lengkap! Isi jumlah totalnya.";
        }
    }
};

window.valInputManual = function(tipe) {
    const inp = document.getElementById(`inp-${tipe}`);
    const target = (tipe === 'kiri') ? window.jumlah_state.kiri : window.jumlah_state.kanan;
    if (parseInt(inp.value) === target) {
        inp.disabled = true; inp.style.background = "#d4edda";
        window.jumlah_state[tipe + 'Ok'] = true;
        document.getElementById(`area-${tipe}`).style.pointerEvents = "auto";
        document.getElementById(`area-${tipe}`).style.opacity = "1";
    }
};

window.buatSoalDekoPro = function() {
    // Inisialisasi state awal
    window.deko_pro_state = {
        kiri_5: 5, kiri_sisa: 4, 
        kanan_5: 5, kanan_sisa: 2,
        tahap: "CARI_SEPULUH",
        bingkaiDipindah: []
    };
    
    // Panggil fungsi render jika sudah ada
    if (typeof window.renderPanggungDeko === 'function') {
        window.renderPanggungDeko();
    } else {
        console.error("Fungsi renderPanggungDeko belum ditemukan!");
    }
};


window.periksaHasilFinal = function() {
    const ans = parseInt(document.getElementById('inp-total').value);
    const correct = window.jumlah_state.kiri + window.jumlah_state.kanan;
    
    if (ans === correct) {
        alert("BENAR! 🌟");

        // --- BLOK INI DIKOMENTARI DENGAN RAPI ---
        /*
        if (window.jumlah_state.soalKe < window.jumlah_state.totalSoal) {
            window.jumlah_state.soalKe++;
            window.buatSoalPenjumlahanBaru();
        } else {
            alert("Hebat! Sekarang mari belajar cara mengelompokkan bingkai!");
        }
        */

        // --- LANGSUNG PINDAH KE TAHAP 2 ---
        setTimeout(function() {
            if (typeof window.buatSoalDekoPro === 'function') {
                window.buatSoalDekoPro();
            } else {
                console.error("Fungsi buatSoalDekoPro tidak ditemukan!");
            }
        }, 500);

    } else {
        alert("Ops! Coba hitung kembali jumlah seluruh titiknya ya. 😊");
    }
};

// Pastikan fungsi ini berada DI LUAR (setara) dengan periksaHasilFinal
window.buatSoalDekoPro = function() {
    // 1. Inisialisasi data state
    window.deko_pro_state = {
        kiri_5: 5, kiri_sisa: 4, 
        kanan_5: 5, kanan_sisa: 2,
        tahap: "CARI_SEPULUH",
        bingkaiDipindah: []
    };
    
    // 2. Langsung render panggung baru
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = "<h3>Misi 2 Berhasil Dimuat!</h3>"; // Uji coba tampilan
    console.log("Panggung Dekomposisi dimuat.");
};
/*// =========================================================================
// 🧩 REVISI VISUAL TAHAP 2: 2 KARTU HASIL & PERSAMAAN DI BAWAH
// =========================================================================

window.renderPanggungDeko = function() {
    const s = window.deko_pro_state;
    const gameContent = document.getElementById('game-content');
    
    // CSS Khusus untuk Kartu Hasil dan Slot
    const style = `
        <style>
            .bingkai-kunci { filter: grayscale(1); opacity: 0.3; cursor: not-allowed !important; }
            .container-kartu-hasil { display: flex; gap: 20px; align-items: center; justify-content: center; }
            .kartu-hasil-saka { 
                width: 140px; padding: 10px; border: 3px solid #1976d2; 
                border-radius: 15px; background: white; box-shadow: 0 4px #bbdefb;
            }
            .slot-hasil { 
                width: 120px; height: 100px; border: 2px dashed #e3f2fd; 
                margin-bottom: 5px; border-radius: 10px; display: flex;
                align-items: center; justify-content: center;
            }
            .slot-hasil:last-child { margin-bottom: 0; }
            .label-angka { font-size: 20px; font-weight: bold; color: #2d5a27; margin-bottom: 5px; }
        </style>
    `;

    gameContent.innerHTML = style + `
        <div style="display:flex; flex-direction:column; align-items:center; width:100%; font-family:sans-serif;">
            <div id="instruksi-deko" style="background:white; padding:10px 20px; border-radius:15px; border-left: 8px solid #27ae60; margin-bottom:15px; box-shadow: 0 4px rgba(0,0,0,0.1);">
                <b id="teks-instruksi" style="font-size:18px;">Langkah 1: Pindahkan dua bingkai 5 untuk membuat SEPULUH!</b>
            </div>

            <div style="display:flex; gap:50px; align-items:center;">
                <div style="display:flex; gap:20px;">
                    <div style="text-align:center;">
                        <div class="label-angka">KARTU 9</div>
                        <div id="slot_kiri_5">${window.renderBingkaiDeko(5, 'kiri_5', false)}</div>
                        <div id="slot_kiri_s">${window.renderBingkaiDeko(s.kiri_sisa, 'kiri_s', true)}</div>
                    </div>
                    <div style="text-align:center;">
                        <div class="label-angka">KARTU 7</div>
                        <div id="slot_kanan_5">${window.renderBingkaiDeko(5, 'kanan_5', false)}</div>
                        <div id="slot_kanan_s">${window.renderBingkaiDeko(s.kanan_sisa, 'kanan_s', true)}</div>
                    </div>
                </div>

                <div style="font-size:50px; font-weight:bold; color:#2d5a27;">➡️</div>

                <div style="text-align:center;">
                    <div class="label-angka">HASIL GABUNGAN</div>
                    <div class="container-kartu-hasil" id="area-drop-utama" ondragover="event.preventDefault()" ondrop="window.handleDropDeko(event)">
                        <div class="kartu-hasil-saka" id="hasil-kartu-1">
                            <div class="slot-hasil" id="target-slot-1"></div>
                            <div class="slot-hasil" id="target-slot-2"></div>
                        </div>
                        <div class="kartu-hasil-saka" id="hasil-kartu-2">
                            <div class="slot-hasil" id="target-slot-3"></div>
                            <div class="slot-hasil" id="target-slot-4"></div>
                        </div>
                    </div>
                    <div id="matematika-visual" style="font-size:36px; font-weight:bold; color:#1976d2; margin-top:15px; background:white; padding:5px 20px; border-radius:15px; border: 2px solid #e3f2fd;">
                        ... + ... = ...
                    </div>
                </div>
            </div>
        </div>
    `;
};

// --- Update Logika Drop agar Mengisi Slot Secara Berurutan ---
window.handleDropDeko = function(e) {
    e.preventDefault();
    const s = window.deko_pro_state;
    const draggedId = e.dataTransfer.getData("text");
    const elemen = document.getElementById(draggedId);
    
    let nilai = draggedId.includes('_5') ? 5 : (draggedId.includes('kiri') ? s.kiri_sisa : s.kanan_sisa);

    // Validasi Cari 10 dulu
    if (s.tahap === "CARI_SEPULUH" && nilai !== 5) {
        alert("Saka bilang: Pindahkan bingkai 5 dulu agar jadi 10!");
        return;
    }

    // Tentukan slot tujuan secara otomatis (1, 2, 3, atau 4)
    const slotTujuanId = `target-slot-${s.bingkaiDipindah.length + 1}`;
    const slotTujuan = document.getElementById(slotTujuanId);

    if (slotTujuan) {
        slotTujuan.appendChild(elemen);
        slotTujuan.style.border = "none"; // Hilangkan garis putus-putus jika sudah terisi
        elemen.setAttribute("draggable", "false");
        elemen.style.margin = "0"; // Rapikan posisi
        s.bingkaiDipindah.push(nilai);
    }

    // Cek Perkembangan Tahap
    if (s.bingkaiDipindah.filter(x => x === 5).length === 2 && s.tahap === "CARI_SEPULUH") {
        s.tahap = "CARI_SISA";
        document.getElementById('teks-instruksi').innerText = "Bagus! Sekarang pindahkan sisanya ke kartu sebelah!";
        document.querySelectorAll('.five-frame').forEach(el => {
            if(el.id.includes('_s')) {
                el.classList.remove('bingkai-kunci');
                el.setAttribute('draggable', 'true');
            }
        });
    }

    if (s.bingkaiDipindah.length === 4) window.prosesSintesisSisa();
    window.updateMatematikaDeko();
};

// --- Update Animasi Penggabungan (4+2 = 5+1) agar Sesuai Slot ---
window.prosesSintesisSisa = function() {
    const s = window.deko_pro_state;
    const totalSisa = s.kiri_sisa + s.kanan_sisa;

    if (totalSisa >= 5) {
        setTimeout(() => {
            // Animasi Gabung
            const slot3 = document.getElementById('target-slot-3');
            const slot4 = document.getElementById('target-slot-4');
            
            slot3.innerHTML = ""; // Bersihkan sisa lama
            slot4.innerHTML = "";

            // Isi dengan Bingkai 5 baru dan Sisanya
            slot3.innerHTML = window.renderBingkaiDeko(5, 'sintesis_5', false);
            if (totalSisa - 5 > 0) {
                slot4.innerHTML = window.renderBingkaiDeko(totalSisa - 5, 'sintesis_sisa', false);
            }

            // Update Persamaan Akhir
            document.getElementById('matematika-visual').innerHTML = 
                `<span style="color:#2d5a27">10 + 5 + ${totalSisa-5} = ${10 + 5 + (totalSisa-5)}</span>`;
            
            document.getElementById('teks-instruksi').innerHTML = "✨ HEBAT! 10 + 5 + " + (totalSisa-5);
            
            setTimeout(() => {
                alert("Luar Biasa! Kamu paham konsep 10 dan 5!");
                window.mulaiLatihanFinal(); // Lanjut ke Tahap Akhir
            }, 2000);
        }, 1000);
    }
};*/

/*// =========================================================================
// 🏆 TAHAP 3: LATIHAN FINAL (DEKOMPOSISI MENTAL)
// =========================================================================

window.latihan_final_state = { soalKe: 1, totalSoal: 10, skor: 0, n1: 0, n2: 0, komponenBenar: [] };

window.mulaiLatihanFinal = function() {
    window.latihan_final_state.soalKe = 1; window.latihan_final_state.skor = 0;
    window.buatSoalLatihanFinal();
};

window.buatSoalLatihanFinal = function() {
    let a = Math.floor(Math.random() * 4) + 6; 
    let b = Math.floor(Math.random() * 4) + 5;
    window.latihan_final_state.n1 = a; window.latihan_final_state.n2 = b;
    let comp1 = a > 5 ? [5, a - 5] : [a];
    let comp2 = b > 5 ? [5, b - 5] : [b];
    window.latihan_final_state.komponenBenar = [...comp1, ...comp2];

    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; width:100%; font-family:sans-serif;">
            <div style="background:white; padding:10px 30px; border-radius:15px; border:3px solid #005088; margin-bottom:15px;">
                <h2 style="margin:0; color:#005088;">LATIHAN FINAL: SOAL ${window.latihan_final_state.soalKe} / 10</h2>
            </div>
            <div style="display:flex; justify-content:center; align-items:center; gap:40px; margin-bottom:30px;">
                <div style="text-align:center;">${generatePolaDots(a)}<div style="font-size:24px; font-weight:bold;">${a}</div></div>
                <div style="font-size:50px;">+</div>
                <div style="text-align:center;">${generatePolaDots(b)}<div style="font-size:24px; font-weight:bold;">${b}</div></div>
            </div>
            <div style="display:flex; align-items:center; gap:10px; background:white; padding:20px; border-radius:20px; border:4px solid #005088;">
                ${window.latihan_final_state.komponenBenar.map((v, i) => `<input type="number" id="box-comp-${i}" class="final-math-box" placeholder="?">`).join('<span>+</span>')}
                <span>=</span>
                <input type="number" id="box-final-total" class="final-math-box" style="border-color:#e67e22; width:110px;" placeholder="Total?">
            </div>
            <button class="btn-final" onclick="window.cekJawabanLatihanFinal()" style="margin-top:20px; padding:15px 60px; font-size:22px; background:#005088; color:white; border-radius:50px; border:none; cursor:pointer;">PERIKSA JAWABAN</button>
        </div>
        <style>
            .final-math-box { width: 80px; height: 80px; font-size: 32px; text-align: center; border: 4px solid #005088; border-radius: 15px; font-weight: bold; }
            input::-webkit-inner-spin-button { -webkit-appearance: none; }
        </style>
    `;
};

window.cekJawabanLatihanFinal = function() {
    const state = window.latihan_final_state;
    let semuaBenar = true;
    state.komponenBenar.forEach((val, idx) => {
        const input = document.getElementById(`box-comp-${idx}`);
        if (parseInt(input.value) !== val) { semuaBenar = false; input.style.background = "#fdf2f2"; }
        else input.style.background = "#f2fdf5";
    });
    const finalVal = parseInt(document.getElementById('box-final-total').value);
    if (finalVal !== (state.n1 + state.n2)) semuaBenar = false;

    if (semuaBenar) {
        state.skor++; alert("HEBAT! Dekomposisi kamu sempurna!");
        if (state.soalKe < state.totalSoal) { state.soalKe++; window.buatSoalLatihanFinal(); }
        else { 
            alert("LUAR BIASA! Kamu telah menyelesaikan Kurikulum Saka Putik!");
            progresMisi = 6; localStorage.setItem('progresMisi_Saka', 6);
            updateSidebarLayout(); pilihMisi(6);
        }
    } else alert("Periksa kembali angka uraianmu!");
};
*/
// ========================================================
// 7. INITIAL RUNNING (WAJIB DI PALING BAWAH FILE)
// ========================================================

// 1. Ambil nilai progres asli siswa dari memori browser - DISELARASKAN KE KUNCI _Saka
let progresTerakhirSiswa = parseInt(localStorage.getItem('progresMisi_Saka')) || 1;

// 2. Kunci variabel progresMisi global agar tidak goyang atau ter-reset ke angka 1
progresMisi = progresTerakhirSiswa;

// 3. Jalankan fungsi layout gambar gembok/aktif bawaan Anda
updateSidebarLayout();

// 4. Paksa kunci sekali lagi nilainya setelah layout selesai digambar
progresMisi = progresTerakhirSiswa;

// 5. Jalankan panggung yang sesuai dengan tingkat pencapaian siswa
if (progresMisi > totalMisi) { 
    renderHasilBelajar(); 
} else { 
    pilihMisi(progresMisi); 
}
// 🧪 SUNTIKAN TESTING BEBAS KLIK ACAK:
// Buka tanda komentar '//' di bawah ini hanya jika Bapak ingin menguji coba kebebasan klik acak Tahap 1-4 saat refresh!
// localStorage.setItem('progresMisiLevel1', 4);
function keluarKeMenuUtama() {
    console.log("Siswa menekan tombol selesai. Membersihkan panggung Level 1...");
    
    // 1. Matikan paksa semua jenis hantu timer yang masih berdetak di latar belakang
    if (typeof timerInterval !== 'undefined') clearInterval(timerInterval);
    if (typeof timerIntervalMisi2 !== 'undefined') clearInterval(timerIntervalMisi2);
    if (typeof countdownInterval !== 'undefined') clearInterval(countdownInterval);
    if (window.misi1_state && window.misi1_state.timerInterval) clearInterval(window.misi1_state.timerInterval);
    if (window.misi2_state && window.misi2_state.timerInterval) clearInterval(window.misi2_state.timerInterval);
    
    // 2. Alihkan halaman secara total ke menu utama (Steril 100%)
    window.location.href = 'menu.html';
}

// TAMBAHKAN KODE INI DI BARIS PALING BAWAH logic-level.js
window.bukaMisi1 = function() {
    // ID 'btn-misi1' sudah saya temukan di file logic-level.js Anda
    const btn = document.getElementById('btn-misi1');
    if (btn) {
        btn.disabled = false; // Mengaktifkan tombol
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        btn.style.backgroundColor = "#e67e22"; // Memberi warna agar terlihat aktif
        console.log("Misi 1 telah dibuka!");
    }
};
