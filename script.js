/**
 * FUNGSI UTAMA: Digunakan di index.html
 */
function startLoading() {
    console.log("Tombol Mulai berhasil ditekan!"); // Muncul di Console (F12)

    // Mengambil elemen input
    const inputNama = document.getElementById('userName');
    const inputKelas = document.getElementById('userClass');

    // Cek apakah elemen input ada di HTML
    if (!inputNama || !inputKelas) {
        console.error("EROR: ID 'userName' atau 'userClass' tidak ditemukan di index.html");
        alert("Terjadi kesalahan teknis. Pastikan input memiliki ID yang benar.");
        return;
    }

    const nama = inputNama.value.trim();
    const kelas = inputKelas.value.trim();

    // Validasi input kosong
    if (nama === "" || kelas === "") {
        alert("Halo Adik-adik! Jangan lupa isi Nama dan Kelas dulu ya... 😊");
    } else {
        // Simpan data ke memori browser
        localStorage.setItem('namaSiswa', nama);
        localStorage.setItem('kelasSiswa', kelas);
        
        console.log("Data disimpan: " + nama + " dari kelas " + kelas);
        
        // PINDAH HALAMAN
        // Menggunakan location.replace agar lebih pasti mengeksekusi perpindahan
        window.location.href = "menu.html";
    }
}

/**
 * FUNGSI NAVIGASI: Digunakan di menu.html
 */
function goToPage(pageName) {
    window.location.href = pageName + ".html";
}

/**
 * FITUR ENTER: Memungkinkan user menekan tombol Enter untuk masuk
 */
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const inputNama = document.getElementById('userName');
        if (inputNama) { // Hanya jalankan jika kita ada di halaman Login
            startLoading();
        }
    }
});
function inisialisasiHalaman() {
    // Ambil nama dari penyimpanan browser
    const nama = localStorage.getItem('namaSiswa') || "Siswa";
    
    // Cari elemen dengan ID 'salam'
    const elemenSalam = document.getElementById('salam');
    
    // Jika elemennya ada, ganti teksnya
    if (elemenSalam) {
        elemenSalam.innerText = "Halo, " + nama + "!";
    }
}
const audio = document.getElementById('bgMusic');
const muteBtn = document.getElementById('muteBtn');

// Atur volume ke 40% agar tidak mengejutkan siswa
audio.volume = 0.4;

function toggleMusic() {
    if (audio.paused) {
        audio.play();
        muteBtn.innerText = "🔊";
    } else {
        audio.pause();
        muteBtn.innerText = "🔈";
    }
}

// Otomatis putar musik saat klik pertama di mana saja
document.addEventListener('click', function() {
    audio.play().catch(error => {
        console.log("Menunggu interaksi pengguna untuk memutar musik.");
    });
}, { once: true });

// Jalankan fungsi saat halaman terbuka
window.onload = inisialisasiHalaman;