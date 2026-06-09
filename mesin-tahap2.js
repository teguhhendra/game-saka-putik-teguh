

// Data State
// Berikan nilai default agar kartu tidak kosong saat pertama kali loading

window.streakBenar = 0;
window.currentLevelLatihan = 1; // Pastikan ini ada di luar fungsi

window.tentukanSoal = function(level) {
    let k1, k2, total;
    
    // Logika level tetap sama
    if (level === 1) {
        total = Math.floor(Math.random() * 8) + 2; 
        k1 = Math.floor(Math.random() * (total - 1)) + 1;
        k2 = total - k1;
    } else if (level === 2) {
        total = Math.floor(Math.random() * 5) + 11;
        k1 = Math.floor(Math.random() * 9) + 1;
        k2 = total - k1;
        if (k2 < 1 || k2 > 9) return window.tentukanSoal(2);
    } else if (level === 3) {
        total = Math.floor(Math.random() * 5) + 16;
        k1 = Math.floor(Math.random() * 9) + 1;
        k2 = total - k1;
        if (k2 < 1 || k2 > 9) return window.tentukanSoal(3);
    } else if (level === 4) {
        total = Math.floor(Math.random() * 8) + 11; // 11-18
        k1 = Math.floor(Math.random() * 9) + 1;
        k2 = total - k1;
        if (k2 < 1 || k2 > 9) return window.tentukanSoal(4);
    }
    
    // UPDATE STATE SECARA EKSPLISIT
    window.jumlah_state = { kiri1: k1, kiri2: k2, total: total };
    
    // LANGSUNG RENDER ULANG
    window.buatSoalDekoPro();
};

window.buatSoalDekoPro = function() {
    // Selalu gunakan window.jumlah_state yang terbaru
    const state = window.jumlah_state;
    const gameContent = document.getElementById('game-content');
    
    // Pastikan elemen ada sebelum mengisi innerHTML
    if (!gameContent) return; 

    const style = `<style>
        .main-wrapper { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 20px; font-family: 'Poppins', sans-serif; }
        .card-container { display: flex; align-items: flex-start; justify-content: center; gap: 20px; }
        .col-wrapper { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .card-saka { border: 4px solid #2d5a27; border-radius: 15px; padding: 10px; width: 170px; background: white; }
        .five-frame { width: 150px; height: 150px; border: 2px solid #ccc; border-radius: 8px; margin: 0 auto 5px; display: grid; grid-template-columns: repeat(3, 1fr); padding: 5px; box-sizing: border-box; }
        .ghost-slot { border: 2px dashed #bdc3c7; border-radius: 50%; width: 32px; height: 32px; margin: auto; display: flex; align-items: center; justify-content: center; }
        .dot { width: 32px; height: 32px; background: #2d5a27; border-radius: 50%; }
        .inp-saka-manual { width: 80px; height: 50px; font-size: 24px; text-align: center; border: 3px solid #2d5a27; border-radius: 10px; font-weight: bold; }
    </style>`;

    gameContent.innerHTML = `${style}
    <div class="main-wrapper">
        <h2 style="color:black; margin:0;">${window.modeTantangan ? 'Tantangan: Level Mahir' : 'Tahap 2: Dekomposisi Frame'}</h2>
        <div class="card-container">
            <div class="col-wrapper">
                <div class="card-saka">${window.renderKartuStatis(state.kiri1)}</div>
                <input type="number" class="inp-saka-manual" value="${state.kiri1}" readonly style="background:#f0f0f0;">
            </div>
            <div style="font-size:40px; margin-top:120px;">+</div>
            <div class="col-wrapper">
                <div class="card-saka">${window.renderKartuStatis(state.kiri2)}</div>
                <input type="number" class="inp-saka-manual" value="${state.kiri2}" readonly style="background:#f0f0f0;">
            </div>
            <div style="font-size:40px; margin-top:120px;">=</div>
            <div class="col-wrapper">
                <div style="display:flex; gap:10px;">
                    <div class="card-saka">${window.renderKartuAktif(state.kiri1, 'c1')}</div>
                    <div class="card-saka">${window.renderKartuAktif(state.kiri2, 'c2')}</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px; margin-top:10px;">
                    <input type="number" id="inputKanan1" class="inp-saka-manual" placeholder="?">
                    <input type="number" id="inputKanan2" class="inp-saka-manual" placeholder="?">
                    <span style="font-size:30px;">=</span>
                    <input type="number" id="inputHasil" class="inp-saka-manual" style="border-color:#1976d2;">
                </div>
            </div>
        </div>
        <button onclick="window.periksaDeko()" style="padding:15px 40px; font-size:20px; font-weight:bold; background:#27ae60; color:white; border:none; border-radius:10px; cursor:pointer;">CEK HASIL</button>
    </div>`;
};

// --- Helper Functions ---
window.dapatkanPosisiTitikDadu = (n) => [7, 9, 3, 1, 5].slice(0, n);
window.renderKartuStatis = function(n) {
    let html = '';
    const bawah = Math.max(0, n - 5);
    const atas = Math.min(n, 5);
    [bawah, atas].forEach(val => {
        html += `<div class="five-frame">`;
        let pos = window.dapatkanPosisiTitikDadu(val);
        for(let i=1; i<=9; i++) html += pos.includes(i) ? `<div class="dot"></div>` : `<div></div>`;
        html += `</div>`;
    });
    return html;
};

window.renderKartuAktif = function(n, cardId) {
    let html = '';
    const bawah = Math.max(0, n - 5);
    const atas = Math.min(n, 5);
    [bawah, atas].forEach((val, fIdx) => {
        html += `<div class="five-frame">`;
        let posBaku = window.dapatkanPosisiTitikDadu(val);
        for(let i=1; i<=9; i++) {
            if ([7, 9, 3, 1, 5].includes(i)) {
                let hasDot = posBaku.includes(i);
                html += `<div class="ghost-slot" id="slot_${cardId}_${fIdx}_${i}" ondragover="event.preventDefault()" ondrop="window.dropDeko(event)">
                            ${hasDot ? `<div class="dot" draggable="true" ondragstart="window.dragStart(event)"></div>` : ''}
                         </div>`;
            } else { html += `<div></div>`; }
        }
        html += `</div>`;
    });
    return html;
};

window.dragStart = (e) => { e.dataTransfer.setData("dotHTML", e.target.outerHTML); e.dataTransfer.setData("sourceId", e.target.parentElement.id); };
window.dropDeko = (e) => {
    e.preventDefault();
    const targetSlot = e.target.closest('.ghost-slot');
    const sourceId = e.dataTransfer.getData("sourceId");
    if (targetSlot && targetSlot.innerHTML.trim() === "" && targetSlot.id !== sourceId) {
        targetSlot.innerHTML = e.dataTransfer.getData("dotHTML");
        document.getElementById(sourceId).innerHTML = "";
    }
};

// Tambahkan ini di bagian atas file
window.modeTantangan = false; 
window.soalTantanganCount = 0; 

window.periksaDeko = function() {
    let n1Input = parseInt(document.getElementById('inputKanan1').value) || 0;
    let n2Input = parseInt(document.getElementById('inputKanan2').value) || 0;
    let hasilInput = parseInt(document.getElementById('inputHasil').value) || 0;
    let n1Riil = document.querySelectorAll(`[id^="slot_c1"] .dot`).length;
    let n2Riil = document.querySelectorAll(`[id^="slot_c2"] .dot`).length;

    if(n1Input === n1Riil && n2Input === n2Riil && hasilInput === (n1Riil + n2Riil)) {
        
        if (window.modeTantangan) {
            window.soalTantanganCount++;
            window.streakBenar++; 
            
            if (window.soalTantanganCount >= 10) {
                if (window.streakBenar >= 7) {
                    alert("SELESAI! Benar " + window.streakBenar + "/10. Misi 1 Terbuka!");
                    window.bukaMisiOtomatis(6); 
                } else {
                    alert("Tantangan selesai! Kamu benar " + window.streakBenar + ". Coba lagi nanti.");
                    window.modeTantangan = false;
                    window.tentukanSoal(1);
                }
            } else {
                alert("BENAR! Soal ke-" + window.soalTantanganCount);
                resetInput();
                window.tentukanSoal(4);
            }
        } else {
            // LATIHAN: Aturan 3 berturut-turut untuk buka Tantangan
            window.streakBenar++;
            if (window.streakBenar >= 3) {
                tampilkanModalTantangan(); 
            } else {
                alert("BENAR! Lanjut ke soal berikutnya.");
                resetInput();
                // Urutan 1 -> 2 -> 3 -> 1
                window.currentLevelLatihan = (window.currentLevelLatihan % 3) + 1;
                window.tentukanSoal(window.currentLevelLatihan);
            }
        }
    } else {
        alert("Periksa kembali!");
        document.getElementById('inputHasil').style.borderColor = "#e74c3c";
    }
};

function resetInput() {
    document.getElementById('inputKanan1').value = '';
    document.getElementById('inputKanan2').value = '';
    document.getElementById('inputHasil').value = '';
    document.getElementById('inputHasil').style.borderColor = "#2d5a27";
}

window.mulaiTantangan = function() {
    window.streakBenar = 0;
    window.soalTantanganCount = 0;
    window.modeTantangan = true; // AKTIFKAN MODE INI
    window.tentukanSoal(4);
    setTimeout(() => {
        let title = document.querySelector('h2');
        if(title) { title.innerText = "Tantangan: Level Mahir"; title.style.color = "red"; }
    }, 100);
};

function tampilkanModalTantangan() {
    document.getElementById('game-content').innerHTML = `
    <div class="main-wrapper" style="text-align:center; padding:50px;">
        <h2 style="color:black;">Selamat, Kamu benar 3 kali berturut-turut!</h2>
        <button onclick="window.tentukanSoal(1); window.streakBenar=0;" style="padding:15px; margin:10px;">LATIHAN LAGI</button>
        <button onclick="window.mulaiTantangan()" style="padding:15px; margin:10px; background:gold;">TANTANGAN</button>
    </div>`;
}

// =========================================================================
// 🎯 MODUL GENERATOR SOAL MISI 2 (HIBRIDA & DIAGNOSTIK)
// Dibuat untuk menggantikan logika random bebas dengan distribusi terstruktur
// =========================================================================

window.generateSoalMisi2 = function(nomor) {
    let k1, k2, kategori;

    // --- MULAI DISTRIBUSI SOAL ---
    if (nomor <= 2) { 
        // 2 Soal Mudah: Subitizing
        k1 = Math.floor(Math.random() * 5) + 1;
        k2 = Math.floor(Math.random() * 5) + 1;
        kategori = 'subitizing';
    } 
    else if (nomor <= 4) { 
        // 2 Soal: k1 besar (6-9), k2 kecil (1-5)
        k1 = Math.floor(Math.random() * 4) + 6;
        k2 = Math.floor(Math.random() * 5) + 1;
        kategori = 'decomposing';
    } 
    else if (nomor <= 6) { 
        // 2 Soal: k2 besar (6-9), k1 kecil (1-5)
        k1 = Math.floor(Math.random() * 5) + 1;
        k2 = Math.floor(Math.random() * 4) + 6;
        kategori = 'decomposing';
    } 
    else { 
        // 4 Soal: Total 16-18, hindari nilai 10
        let total = Math.floor(Math.random() * 3) + 16;
        do {
            k1 = Math.floor(Math.random() * 9) + 1;
            k2 = total - k1;
        } while (k1 === 10 || k2 === 10 || k1 > 9 || k2 > 9 || k1 < 1 || k2 < 1);
        
        // Tandai 2 soal sebagai Ikonik, 2 soal sebagai Simbolik
        kategori = (nomor <= 8) ? 'ikonik' : 'simbolik';
    }
    // --- AKHIR DISTRIBUSI SOAL ---

    // Mengembalikan objek yang berisi angka soal dan kategori untuk keperluan Rapor Diagnostik
    return { k1: k1, k2: k2, total: k1 + k2, kategori: kategori };
};
// =========================================================================
// 🏁 AKHIR MODUL GENERATOR SOAL MISI 2
// =========================================================================
window.mulaiMisi2Diagnostik = function(nomorSoal) {
    let data = window.generateSoalMisi2(nomorSoal);
    window.jumlah_state = { kiri1: data.k1, kiri2: data.k2, total: data.total };
    window.kategoriAktif = data.kategori;
    window.buatSoalDekoPro();
};
//window.tentukanSoal(1);
window.bukaMisiOtomatis = function(idMisi) {
    console.log("Memicu Navigasi ke Misi: " + idMisi);
    
    // 1. Update progres global agar sinkron
    window.progresMisi = 6;
    localStorage.setItem('progresMisi_Saka', 6);
    
    // 2. BUKA PAKSA TOMBOL SIDEBAR (ID misi-6 untuk Misi 1)
    let tombolMisi1 = document.getElementById('misi-6');
    if (tombolMisi1) {
        tombolMisi1.classList.remove('locked');
        tombolMisi1.style.opacity = "1";
        tombolMisi1.style.pointerEvents = "auto"; // Pastikan bisa diklik
    }

    // 3. Panggil router navigasi
    if (typeof window.renderSoalMisi === "function") {
        window.renderSoalMisi(idMisi);
    }
};