// =========================================================================
// 📊 ENGINE RAPOR KOMPILASI GLOBAL (LEVEL 1 - LEVEL 6) UNTUK MENU UTAMA
// =========================================================================

window.renderRaporKompilasi = function() {
    // Pastikan ada container khusus di menu.html untuk menampilkan rapor ini
    const menuContent = document.getElementById('info-display'); || document.getElementById('game-content');
    if (!menuContent) {
        console.error("Wadah tampilan menu_content tidak ditemukan!");
        return;
    }

    // 1. Ambil Identitas Siswa dari Memori Utama
    const namaSiswa = localStorage.getItem('namaSiswa') || 'Peserta Didik';
    const kelasSiswa = localStorage.getItem('kelasSiswa') || '1 (Satu)';
    const nomorAbsen = localStorage.getItem('absenSiswa') || '-';

    // 2. AMBIL DATA RIIL DARI ID KONSTAN (LEVEL 1 SAMPAI LEVEL 6)
    const dataSkor = {
        lvl1: { m1: parseInt(localStorage.getItem('nilaiAsesmenMisi1_Saka')) || 0, m2: parseInt(localStorage.getItem('skorAsesmenMisi2')) || 0, nama: "Level 1: SAKA PUTIK", aktif: localStorage.getItem('nilaiAsesmenMisi1_Saka') !== null },
        lvl2: { m1: parseInt(localStorage.getItem('nilaiAsesmenMisi1_Lvl2')) || 0, m2: parseInt(localStorage.getItem('skorAsesmenMisi2_Lvl2')) || 0, nama: "Level 2: Pindah Titik (Sub B)", aktif: localStorage.getItem('nilaiAsesmenMisi1_Lvl2') !== null },
        lvl3: { m1: parseInt(localStorage.getItem('nilaiAsesmenMisi1_Lvl3')) || 0, m2: parseInt(localStorage.getItem('skorAsesmenMisi2_Lvl3')) || 0, nama: "Level 3: Pola Senilai", aktif: localStorage.getItem('nilaiAsesmenMisi1_Lvl3') !== null },
        lvl4: { m1: parseInt(localStorage.getItem('nilaiAsesmenMisi1_Lvl4')) || 0, m2: parseInt(localStorage.getItem('skorAsesmenMisi2_Lvl4')) || 0, nama: "Level 4: Tahap D", aktif: localStorage.getItem('nilaiAsesmenMisi1_Lvl4') !== null },
        lvl5: { m1: parseInt(localStorage.getItem('nilaiAsesmenMisi1_Lvl5')) || 0, m2: parseInt(localStorage.getItem('skorAsesmenMisi2_Lvl5')) || 0, nama: "Level 5: Tahap E", aktif: localStorage.getItem('nilaiAsesmenMisi1_Lvl5') !== null },
        lvl6: { m1: parseInt(localStorage.getItem('nilaiAsesmenMisi1_Lvl6')) || 0, m2: parseInt(localStorage.getItem('skorAsesmenMisi2_Lvl6')) || 0, nama: "Level 6: Evaluasi Akhir", aktif: localStorage.getItem('nilaiAsesmenMisi1_Lvl6') !== null }
    };

    // 3. KALKULASI INTEGRASI TEORI KOGNITIF (GABUNGAN SELURUH LEVEL YA K)
    let totalMisi1 = 0, totalMisi2 = 0, levelDimainkan = 0;
    
    Object.keys(dataSkor).forEach(key => {
        if (dataSkor[key].aktif) {
            totalMisi1 += dataSkor[key].m1;
            totalMisi2 += dataSkor[key].m2;
            levelDimainkan++;
        }
    });

    // Cegah pembagian dengan angka nol jika belum ada game dimainkan sama sekali
    let pembagi = levelDimainkan > 0 ? levelDimainkan : 1;
    let rataMisi1 = totalMisi1 / pembagi;
    let rataMisi2 = totalMisi2 / pembagi;

    // Hitung rata-rata persentase rumpun teori kognitif matematika
    let persenSubitizing = Math.min(100, Math.round(((rataMisi1 * 0.5 + rataMisi2 * 0.5) / 10) * 100));
    let persenDecomposing = Math.max(0, Math.min(100, levelDimainkan > 0 ? persenSubitizing - 10 : 0));
    let persenIkonik = Math.min(100, Math.round(((rataMisi1 * 0.6 + rataMisi2 * 0.4) / 10) * 100));
    let persenSimbolik = Math.min(100, Math.round(((rataMisi1 * 0.4 + rataMisi2 * 0.6) / 10) * 100));

    // Predikat otomatis berdasarkan persentase skor
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

    // 4. HITUNG TOTAL MEDALI EMAS YANG DIKUMPULKAN SISWA
    let jumlahMedali = 0;
    Object.keys(dataSkor).forEach(key => {
        if (dataSkor[key].aktif && (dataSkor[key].m1 + dataSkor[key].m2 >= 14)) {
            jumlahMedali++; // Berikan medali jika total nilai per-level mencapai >= 14 dari 20 soal
        }
    });

    // 5. GENERATOR REKOMENDASI PROFILING GLOBAL UNTUK GURU
    let analisisTesis = "";
    if (levelDimainkan === 0) {
        analisisTesis = "Siswa belum memulai pengerjaan instrumen game pada level manapun.";
    } else {
        let nilaiTerendah = Math.min(persenSubitizing, persenDecomposing, persenIkonik, persenSimbolik);
        if (nilaiTerendah === persenSimbolik) {
            analisisTesis = `Secara keseluruhan, Ananda <strong>${namaSiswa}</strong> menunjukkan kecerdasan visual spasial yang sangat baik di ${levelDimainkan} Level. Namun, ia memerlukan bimbingan konsisten pada penguatan <strong>Abstrak-Simbolik</strong> (menghubungkan visual dengan lambang bilangan angka numerik).`;
        } else if (nilaiTerendah === persenDecomposing) {
            analisisTesis = `Profil kognitif Ananda <strong>${namaSiswa}</strong> menunjukkan pemahaman subitizing objek kecil yang matang, namun perlu diberikan porsi latihan lebih pada teknik <strong>Decomposing</strong> (mengurai bilangan besar berbasis Five-Frame).`;
        } else {
            analisisTesis = `Ananda <strong>${namaSiswa}</strong> telah mengikuti alur perkembangan kognitif instrumen dengan stabil. Disarankan untuk melanjutkan ke tahap konseptual penguatan formal sekolah dasar kelas tinggi.`;
        }
    }

    // 6. RENDER ANTARMUKA DASHBOARD LANDSCAPE KOMPILASI
    menuContent.innerHTML = `
        <div style="width: 100%; max-width: 1250px; margin: 15px auto; background: #fff; border-radius: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); overflow: hidden; font-family: 'Poppins', sans-serif; border: 3px solid #2c3e50;">
            
            <div style="background: linear-gradient(135deg, #1abc9c, #16a085); color: white; padding: 25px 35px; text-align: center; position: relative;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">🎓 DASHBOARD HASIL BELAJAR KOMPILASI (LEVEL 1-6)</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Rekam Jejak Kognitif dan Profiling Kemampuan Matematika Siswa</p>
                
                <div style="position: absolute; right: 35px; top: 20px; font-size: 28px; background: rgba(255,255,255,0.2); padding: 5px 20px; border-radius: 50px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                    🏆 <span style="font-size: 18px;">${jumlahMedali} Piala</span>
                </div>
            </div>

            <div style="padding: 30px;">
                
                <div style="background: #f8fafc; border-radius: 15px; padding: 15px 25px; margin-bottom: 25px; border-left: 6px solid #1abc9c; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 15px; color: #2c3e50; line-height: 1.6;">
                        <strong>Nama Peserta Didik :</strong> <span style="color:#16a085; font-weight:bold;">${namaSiswa}</span> <br>
                        <strong>Identitas Kelas :</strong> Kelas ${kelasSiswa} | <strong>Nomor Absen :</strong> ${nomorAbsen}
                    </div>
                    <div style="text-align: right; font-size: 13px; color: #7f8c8d;">
                        <strong>Status Instrumen:</strong> <br>
                        <span style="background: #34495e; color: white; padding: 4px 12px; border-radius: 6px; font-weight: bold; font-size: 12px;">${levelDimainkan} / 6 Level Diikuti</span>
                    </div>
                </div>

                <div style="display: flex; gap: 25px; margin-bottom: 25px;">
                    
                    <div style="flex: 1; background: #fff; border: 1px solid #e2e8f0; border-radius: 15px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                        <h3 style="color: #2c3e50; font-size: 15px; font-weight: 800; border-bottom: 2px solid #1abc9c; padding-bottom: 8px; margin-top:0; margin-bottom: 15px;">1. RUMPUN TEORI KOGNISI BILANGAN AWAL</h3>
                        <div style="margin-bottom: 15px;">
                            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:14px; margin-bottom:5px;"><span>Subitizing</span> <span style="color:${pSubitizing.warna}">${persenSubitizing}% (${pSubitizing.teks})</span></div>
                            <div style="width:100%; background:#e2e8f0; height:12px; border-radius:10px; overflow:hidden;"><div style="width:${persenSubitizing}%; background:${pSubitizing.warna}; height:100%;"></div></div>
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:14px; margin-bottom:5px;"><span>Decomposing</span> <span style="color:${pDecomposing.warna}">${persenDecomposing}% (${pDecomposing.teks})</span></div>
                            <div style="width:100%; background:#e2e8f0; height:12px; border-radius:10px; overflow:hidden;"><div style="width:${persenDecomposing}%; background:${pDecomposing.warna}; height:100%;"></div></div>
                        </div>
                    </div>

                    <div style="flex: 1; background: #fff; border: 1px solid #e2e8f0; border-radius: 15px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                        <h3 style="color: #2c3e50; font-size: 15px; font-weight: 800; border-bottom: 2px solid #e67e22; padding-bottom: 8px; margin-top:0; margin-bottom: 15px;">2. RUMPUN REPRESENTASI KOGNITIF (BRUNER)</h3>
                        <div style="margin-bottom: 15px;">
                            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:14px; margin-bottom:5px;"><span>Ikonik (Visual-Spasial)</span> <span style="color:${pIkonik.warna}">${persenIkonik}% (${pIkonik.teks})</span></div>
                            <div style="width:100%; background:#e2e8f0; height:12px; border-radius:10px; overflow:hidden;"><div style="width:${persenIkonik}%; background:${pIkonik.warna}; height:100%;"></div></div>
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:14px; margin-bottom:5px;"><span>Simbolik (Abstrak)</span> <span style="color:${pSimbolik.warna}">${persenSimbolik}% (${pSimbolik.teks})</span></div>
                            <div style="width:100%; background:#e2e8f0; height:12px; border-radius:10px; overflow:hidden;"><div style="width:${persenSimbolik}%; background:${pSimbolik.warna}; height:100%;"></div></div>
                        </div>
                    </div>

                </div>

                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 15px; padding: 20px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                    <h3 style="color: #2c3e50; font-size: 15px; font-weight: 800; margin-top: 0; margin-bottom: 15px;">📋 MATRIKS CAPAIAN PEMAHAMAN TIAP LEVEL</h3>
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                        <thead>
                            <tr style="background: #34495e; color: white;">
                                <th style="padding: 12px; border: 1px solid #cbd5e1;">Level Game</th>
                                <th style="padding: 12px; border: 1px solid #cbd5e1; text-align: center;">Skor Evaluasi I</th>
                                <th style="padding: 12px; border: 1px solid #cbd5e1; text-align: center;">Skor Evaluasi II</th>
                                <th style="padding: 12px; border: 1px solid #cbd5e1; text-align: center;">Rata-Rata</th>
                                <th style="padding: 12px; border: 1px solid #cbd5e1; text-align: center;">Status Capaian</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(dataSkor).map(key => {
                                const lvl = dataSkor[key];
                                const rataRata = lvl.aktif ? Math.round(((lvl.m1 + lvl.m2) / 20) * 100) : 0;
                                const pLvl = dapatkanPredikat(rataRata);
                                return `
                                    <tr style="background: ${lvl.aktif ? '#ffffff' : '#f8fafc'}; opacity: ${lvl.aktif ? '1' : '0.6'};">
                                        <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #2c3e50;">${lvl.nama}</td>
                                        <td style="padding: 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${lvl.aktif ? lvl.m1 + ' / 10' : '-'}</td>
                                        <td style="padding: 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${lvl.aktif ? lvl.m2 + ' / 10' : '-'}</td>
                                        <td style="padding: 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #16a085;">${lvl.aktif ? rataRata + '%' : '-'}</td>
                                        <td style="padding: 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${lvl.aktif ? pLvl.warna : '#95a5a6'};">
                                            ${lvl.aktif ? pLvl.teks : '🔒 Belum Diikuti'}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <div style="background: #e8f8f5; border: 2px dashed #1abc9c; border-radius: 15px; padding: 20px; font-size: 14px; color: #117a65; line-height: 1.6; margin-bottom: 25px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 15px; color: #16a085; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                        📌 ANALISIS PROFILING DIAGNOSTIK GLOBAL (UNTUK PENELITI / GURU)
                    </h4>
                    ${analisisTesis}
                </div>

                <div style="text-align: center;">
                    <button onclick="tutupRaporKompilasi();" style="padding: 12px 40px; font-size: 15px; font-weight: bold; color: white; background: #e74c3c; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 4px #c0392b;">
                        ❌ TUTUP RAPOR KOMPILASI
                    </button>
                </div>

            </div>
        </div>
    `;
};

function tutupRaporKompilasi() {
    console.log("Menutup tampilan rapor kompilasi...");
    const display = document.getElementById('info-display');
    if (display) {
        // Kembalikan tulisan selamat bermain bawaan asli menu.html Bapak
        display.innerHTML = `
            <h2>Selamat Bermain!</h2>
            <p>Pilih level di samping untuk memulai petualangan angka.</p>
        `;
    }
}