
window.buatSoalDekoPro = function() {
    // 1. Inisialisasi state angka acak (1-5 agar pas di 1 frame)
    window.deko_pro_state = {
        val1: Math.floor(Math.random() * 5) + 1, 
        val2: Math.floor(Math.random() * 5) + 1  
    };

    // 2. Render panggung kosong terlebih dahulu
    window.renderPanggungDeko();

    // 3. Isi titik di kartu kiri (k1 dan k2) setelah panggung muncul
    // Ganti blok setTimeout lama dengan ini di dalam window.buatSoalDekoPro
// Ganti blok setTimeout Anda dengan ini:
setTimeout(() => {
    // 1. Buat bingkai untuk kartu kiri 1 dan masukkan ke area 'atas'
    const frame1 = window.buatBingkai('frame_kiri_1', window.deko_pro_state.val1);
    document.getElementById('k1_atas_zone').appendChild(frame1);
    
    // 2. Buat bingkai untuk kartu kiri 2
    const frame2 = window.buatBingkai('frame_kiri_2', window.deko_pro_state.val2);
    document.getElementById('k2_atas_zone').appendChild(frame2);
    
    // Update input angka di bawah kartu kiri
    document.getElementById('t2_inp_kiri1').value = window.deko_pro_state.val1;
    document.getElementById('t2_inp_kiri2').value = window.deko_pro_state.val2;
}, 100);
};

window.renderPanggungDeko = function() {
    const gameContent = document.getElementById('game-content');
    
    // CSS diperbarui dengan margin tambahan untuk input dan posisi tanda operasi
    const style = `
    <style>
        .card-saka { border: 4px solid #2d5a27; border-radius: 15px; background: #fcfcfc; padding: 10px; width: 170px; height: 350px; display: flex; flex-direction: column; gap: 10px; }
        .five-frame { width: 150px; height: 150px; border: 2px solid #ccc; border-radius: 8px; display: grid; grid-template-columns: repeat(3, 1fr); padding: 5px; box-sizing: border-box; }
        .inp-saka-manual { width: 80px; font-size: 24px; text-align: center; border: 3px solid #2d5a27; border-radius: 12px; background: white; color: #2d5a27; font-weight: bold; margin-top: 20px; } /* Margin-top ditambah agar tidak menempel */
        .t2_wrapper { display:flex; align-items:center; justify-content:center; gap:20px; margin-top: 20px; }
        .op-sign { font-size:40px; font-weight:bold; color:#2d5a27; }
        .input-group { margin-top: 20px; text-align: center; } /* Margin-top ditambah */
        /* Tambahkan ini ke dalam tag <style> di renderPanggungDeko */
        .dot { 
            width: 32px; 
            height: 32px; 
            background: #2d5a27; 
            border-radius: 50%; 
            margin: auto; 
            display: block; 
        }
            /* DEFINISI BARU UNTUK DRAG AND DROP */
        /* Tambahkan atau perbarui CSS ini di dalam style di renderPanggungDeko */
        .drop-zone { 
        width: 150px; 
        height: 150px; 
        border: 2px solid #ccc; 
        border-radius: 8px; 
        position: relative;
    }
    
    .ghost-bg {
        /* Membuat grid 3x3 untuk titik-titik samar */
        background-image: 
            radial-gradient(circle, #bdc3c7 20%, transparent 20%),
            radial-gradient(circle, #bdc3c7 20%, transparent 20%),
            radial-gradient(circle, #bdc3c7 20%, transparent 20%),
            radial-gradient(circle, #bdc3c7 20%, transparent 20%),
            radial-gradient(circle, #bdc3c7 20%, transparent 20%);
        background-position: 
            16% 16%, 84% 16%, 50% 50%, 16% 84%, 84% 84%; /* Posisi 1, 3, 5, 7, 9 */
        background-size: 32px 32px;
        background-repeat: no-repeat;
    }

    .draggable-frame { 
        position: absolute; 
        top: 0; left: 0;
        z-index: 10; 
        width: 150px; 
        height: 150px;
        background: rgba(255, 255, 255, 0.95); 
        border: 2px solid #2d5a27; 
        border-radius: 8px; 
        display: grid; 
        grid-template-columns: repeat(3, 1fr); 
        padding: 5px; 
        box-sizing: border-box;
    }
    
        .draggable-frame:active { cursor: grabbing; }
    </style>`;

    gameContent.innerHTML = `${style}
    <div style="text-align: center; font-family: 'Poppins', sans-serif;">
        <h2 style="color:#2c3e50;">Tahap 2: Dekomposisi Frame</h2>
        
        <div class="t2_wrapper">
            <div style="text-align:center;">
                <div class="card-saka" id="t2_kiri_1">${window.genGhostFrame('k1')}</div>
                <input type="number" id="t2_inp_kiri1" class="inp-saka-manual" placeholder="?">
            </div>
            
            <div class="op-sign">+</div>
            
            <div style="text-align:center;">
                <div class="card-saka" id="t2_kiri_2">${window.genGhostFrame('k2')}</div>
                <input type="number" id="t2_inp_kiri2" class="inp-saka-manual" placeholder="?">
            </div>
            
            <div class="op-sign">=</div>
            
            <div style="text-align:center;">
                <div class="card-saka" id="t2_kanan_1">${window.genGhostFrame('ka1')}</div>
                <div class="input-group">
                    <input type="number" id="t2_f1" class="inp-saka-manual" style="width:50px;"> + 
                    <input type="number" id="t2_f2" class="inp-saka-manual" style="width:50px;">
                </div>
            </div>
            
            <div style="text-align:center;">
                <div class="card-saka" id="t2_kanan_2">${window.genGhostFrame('ka2')}</div>
                <div class="input-group">
                    <input type="number" id="t2_f3" class="inp-saka-manual" style="width:50px;"> + 
                    <input type="number" id="t2_f4" class="inp-saka-manual" style="width:50px;"> = 
                    <input type="number" id="t2_total" class="inp-saka-manual" style="width:70px; border-color:#1976d2;">
                </div>
            </div>
        </div>
        
        <button id="t2_btn_periksa" style="margin-top:30px; padding:12px 40px; font-size:18px;">PERIKSA DEKOMPOSISI</button>
    </div>`;
};

// Fungsi pembantu untuk membuat 2 frame kosong berisi ghost-slots
// Ganti fungsi genGhostFrame Anda dengan ini:
// GANTI FUNGSI genGhostFrame DENGAN KODE INI
window.genGhostFrame = function(prefix) {
    let html = '';
    ['atas', 'bawah'].forEach(pos => {
        // Class 'drop-zone' untuk deteksi, 'ghost-bg' untuk visual titik samar
        html += `<div class="five-frame drop-zone ghost-bg" 
                     id="${prefix}_${pos}_zone" 
                     ondrop="window.eksekusiDropFrame(event)" 
                     ondragover="window.allowDrop(event)">
                 </div>`;
    });
    return html;
};
/*// Tambahkan fungsi ini di bawah semua fungsi yang sudah ada
window.isiTitikPola = function(containerId, nilai) {
    const urutan = [7, 9, 3, 1, 5]; // Pola Saka Putik
    
    // Hitung distribusi: maksimal 5 di atas, sisanya di bawah
    const atas = Math.min(nilai, 5);
    const bawah = Math.max(0, nilai - 5);

    // Isi frame atas
    for (let i = 0; i < atas; i++) {
        const slot = document.getElementById(`${containerId}_atas_${urutan[i]}`);
        if (slot) slot.innerHTML = `<div class="dot active"></div>`;
    }
    // Isi frame bawah
    for (let i = 0; i < bawah; i++) {
        const slot = document.getElementById(`${containerId}_bawah_${urutan[i]}`);
        if (slot) slot.innerHTML = `<div class="dot active"></div>`;
    }
};
*/

window.allowDrop = function(e) {
    e.preventDefault(); // Mengizinkan elemen untuk bisa di-drop
};

window.eksekusiDropFrame = function(e) {
    e.preventDefault();
    e.stopPropagation();

    const data = e.dataTransfer.getData("text/plain");
    const draggedEl = document.getElementById(data);
    const cardTarget = e.target.closest('.drop-zone');
    const cellTarget = e.target.closest('.cell-slot');

    if (cellTarget && draggedEl.classList.contains('dot')) {
        if (cellTarget.children.length === 1) {
            cellTarget.appendChild(draggedEl);
        }
    } else if (cardTarget && draggedEl.classList.contains('draggable-frame')) {
        draggedEl.style.position = "relative";
        cardTarget.appendChild(draggedEl);
    }

    // --- PEMBARUAN OTOMATIS INPUT ---
    // Setelah drop, cari semua frame di panggung dan update nilai inputnya
    const frames = document.querySelectorAll('.draggable-frame');
    frames.forEach(frame => {
        const parentId = frame.parentElement.id;
        let inputId = "";
        
        // Logika sederhana: sesuaikan dengan ID input Anda
        if (parentId === 'ka1_atas_zone') inputId = 't2_f1';
        else if (parentId === 'ka1_bawah_zone') inputId = 't2_f2';
        else if (parentId === 'ka2_atas_zone') inputId = 't2_f3';
        else if (parentId === 'ka2_bawah_zone') inputId = 't2_f4';

        if (inputId) {
            document.getElementById(inputId).value = window.hitungTitikDiBingkai(frame);
        }
    });
};

window.hitungTitikDiBingkai = function(frameElement) {
    // Mencari semua elemen dengan class 'dot' di dalam frame
    const dots = frameElement.querySelectorAll('.dot.active');
    return dots.length;
};

window.buatBingkai = function(id, nilai) {
    const frame = document.createElement('div');
    frame.id = id;
    frame.className = 'draggable-frame';
    frame.draggable = true;
    // Style frame
    frame.style.cssText = "position: absolute; z-index: 10; width: 150px; height: 150px; background: rgba(255, 255, 255, 0.95); border: 2px solid #2d5a27; border-radius: 8px; display: grid; grid-template-columns: repeat(3, 1fr); padding: 5px; box-sizing: border-box; cursor: grab;";
    
    // Mencegah frame ikut ter-drag saat titik ditarik
    frame.ondragstart = (e) => {
        if (e.target.classList.contains('dot')) e.stopPropagation();
        else e.dataTransfer.setData("text/plain", e.target.id);
    };

    const urutan = [7, 9, 3, 1, 5];
    for (let i = 1; i <= 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell-slot';
        cell.ondragover = window.allowDrop;
        cell.ondrop = window.eksekusiDropFrame;
        cell.style.cssText = "display: flex; align-items: center; justify-content: center; position: relative;";
        
        if (urutan.includes(i)) {
            const ghost = document.createElement('div');
            ghost.style.cssText = "width: 32px; height: 32px; border: 2px dashed #bdc3c7; border-radius: 50%; position: absolute;";
            cell.appendChild(ghost);
        }

        const indexUrutan = urutan.indexOf(i);
        if (indexUrutan !== -1 && indexUrutan < nilai) {
            const dot = document.createElement('div');
            dot.className = 'dot active';
            dot.id = `${id}_dot_${i}`;
            dot.draggable = true;
            dot.ondragstart = (e) => {
                e.dataTransfer.setData("text/plain", e.target.id);
                e.stopPropagation();
            };
            cell.appendChild(dot);
        }
        frame.appendChild(cell);
    }
    return frame;
};

window.periksaDekomposisi = function() {
    const f1 = parseInt(document.getElementById('t2_f1').value) || 0;
    const f2 = parseInt(document.getElementById('t2_f2').value) || 0;
    const f3 = parseInt(document.getElementById('t2_f3').value) || 0;
    const f4 = parseInt(document.getElementById('t2_f4').value) || 0;
    const totalInput = parseInt(document.getElementById('t2_total').value) || 0;
    
    const targetTotal = window.deko_pro_state.val1 + window.deko_pro_state.val2;

    if ((f1 + f2 + f3 + f4) === targetTotal && totalInput === targetTotal) {
        alert("Selamat! Dekomposisi Benar!");
        window.lanjutSoal(); // Panggil fungsi next level
    } else {
        alert("Coba cek lagi jumlah titiknya!");
    }
};