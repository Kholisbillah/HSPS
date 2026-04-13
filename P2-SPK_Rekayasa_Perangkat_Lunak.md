# UJI KOMPETENSI KEAHLIAN

# TAHUN PELAJARAN 2025/2026

**P2-25/26** | Hak Cipta pada Kemendikdasmen | SPK-1/4

---

## SOAL PRAKTIK KEJURUAN

|                                |                                |
| ------------------------------ | ------------------------------ |
| **Satuan Pendidikan**    | : Sekolah Menengah Kejuruan    |
| **Konsentrasi Keahlian** | : Rekayasa Perangkat Lunak     |
| **Kode**                 | : KM25.4.1.1                   |
| **Alokasi Waktu**        | : 11 jam                       |
| **Bentuk Soal**          | : Penugasan Perorangan         |
| **Judul Tugas**          | : Pengembangan Aplikasi Parkir |

**Paket 2**

---

## I. PETUNJUK UMUM

1. Periksalah dengan teliti dokumen soal ujian praktik, yang terdiri dari 4 halaman
2. Periksalah peralatan dan bahan yang dibutuhkan
3. Gunakan peralatan utama dan peralatan keselamatan kerja yang telah disediakan
4. Gunakan peralatan sesuai dengan SOP (*Standard Operating Procedure*)
5. Bekerjalah dengan memperhatikan petunjuk Pembimbing/ Penguji

---

## II. DAFTAR PERALATAN

| No.         | Nama Alat dan Bahan                 | Spesifikasi Minimal           | Jumlah      | Keterangan  |
| ----------- | ----------------------------------- | ----------------------------- | ----------- | ----------- |
| **1** | **2**                         | **3**                   | **4** | **5** |
|             | **ALAT**                      |                               |             |             |
| 1           | PC Client/Laptop                    | *Processor*: Setara 2,0 GHz | 1 set       |             |
|             |                                     | RAM: 4 GB*Harddisk*         |             |             |
|             |                                     | NIC: 10/100 Mbps              |             |             |
|             |                                     | *Monitor* 14 "              |             |             |
|             |                                     | *Mouse*                     |             |             |
|             |                                     | *Keyboard*                  |             |             |
| 2           | Koneksi Internet                    | Minimal 1 Mbps                | 1 line      |             |
|             | **KOMPONEN**                  |                               |             |             |
| 1           | Sistem Operasi                      | Sesuai Kebutuhan              | 1 unit      |             |
| 2           | *Text Editor* / Tools Pemrograman | Sesuai Kebutuhan              | 1 unit      |             |
| 3           | Aplikasi Server Basis Data          | Sesuai Kebutuhan              | 1 unit      |             |
| 4           | *Debugging Tools*                 | Sesuai Kebutuhan              | 1 unit      |             |
| 5           | Aplikasi Pengolahan Kata            | Sesuai Kebutuhan              | 1 unit      |             |

---

**P2-25/26** | Hak Cipta pada Kemendikdasmen | SPK-2/4

---

## IV. SOAL/TUGAS

**Judul Tugas : Pengembangan Aplikasi Parkir**

Sebagai seorang Program Pemula (*Novice Programmer*) pada sebuah Perusahaan *Software Developer*, anda ditugaskan sebagai **programmer**, anda diminta untuk membuat sebuah Aplikasi Parkir.

Tugas Anda adalah membuat sebuah aplikasi parkir dengan 3 level pengguna dengan ketentuan sebagai berikut:

---

### Skema *Database* Aplikasi Parkir

**Tabel: parkir tb_kendaraan**

| Kolom           | Tipe                     |
| --------------- | ------------------------ |
| id_kendaraan    | int(11)*(Primary Key)* |
| plat_nomor      | varchar(15)              |
| jenis_kendaraan | varchar(20)              |
| warna           | varchar(20)              |
| pemilik         | varchar(100)             |
| id_user         | int(11)                  |

**Tabel: parkir tb_transaksi**

| Kolom        | Tipe                      |
| ------------ | ------------------------- |
| id_parkir    | int(11)*(Primary Key)*  |
| id_kendaraan | int(11)                   |
| waktu_masuk  | datetime                  |
| waktu_keluar | datetime                  |
| id_tarif     | int(11)                   |
| durasi_jam   | int(5)                    |
| biaya_total  | decimal(10,0)             |
| status       | enum('masuk','keluar','') |
| id_user      | int(11)                   |
| id_area      | int(11)                   |

**Tabel: parkir tb_tarif**

| Kolom           | Tipe                               |
| --------------- | ---------------------------------- |
| id_tarif        | int(11)*(Primary Key)*           |
| jenis_kendaraan | enum('motor','mobil','lainnya','') |
| tarif_per_jam   | decimal(10,0)                      |

**Tabel: parkir tb_user**

| Kolom        | Tipe                               |
| ------------ | ---------------------------------- |
| id_user      | int(11)*(Primary Key)*           |
| nama_lengkap | varchar(50)                        |
| username     | varchar(50)                        |
| password     | varchar(100)                       |
| role         | enum('admin','petugas','owner','') |
| status_aktif | tinyint(1)                         |

**Tabel: parkir tb_area_parkir**

| Kolom     | Tipe                     |
| --------- | ------------------------ |
| id_area   | int(11)*(Primary Key)* |
| nama_area | varchar(50)              |
| kapasitas | int(5)                   |
| terisi    | int(5)                   |

**Tabel: parkir tb_log_aktivitas**

| Kolom           | Tipe                     |
| --------------- | ------------------------ |
| id_log          | int(11)*(Primary Key)* |
| id_user         | int(11)                  |
| aktivitas       | varchar(100)             |
| waktu_aktivitas | datetime                 |

---

### Tabel Fitur Aplikasi Parkir

| Fitur                                     | Admin | Petugas | Owner |
| ----------------------------------------- | :---: | :-----: | :---: |
| *Login*                                 |   V   |    V    |   V   |
| *Logout*                                |   V   |    V    |   V   |
| CRUD*User*                              |   V   |        |      |
| CRUD Tarif Parkir                         |   V   |        |      |
| CRUD Area Parkir                          |   V   |        |      |
| CRUD Kendaraan                            |   V   |        |      |
| Akses Log Aktifitas                       |   V   |        |      |
| Cetak struk parkir                        |      |    V    |      |
| Transaksi                                 |      |    V    |      |
| Rekap transaksi sesuai waktu yang diminta |      |        |   V   |

---

**P2-25/26** | Hak Cipta pada Kemendikdasmen | SPK-3/4

---

### Langkah Kerja:

1. Siapkan lingkungan kerja dengan mempersiapkan komputer yang akan di-install
2. Lakukan instalasi sistem operasi
3. Lakukan instalasi software aplikasi yang akan digunakan
4. Pastikan sistem operasi dan software aplikasi berjakan dengan baik
5. Buatlah struktur data dan akses terhadap struktur data termasuk dengan tipe data dan control program untuk aplikasi
6. Gunakan metode Waterfall sederhana atau prototype:
   - a. Analisis Kebutuhan
   - b. Desain (ERD dan diagram program)
   - c. Implementasi kode
   - d. Pengujian
   - e. Dokumentasi
7. Buatlah deskripsi dan diagram alur (flowchart) atau pseudocode untuk minimal:
   - a. Proses login
   - b. Proses transaksi
   - c. Cetak struk
8. Buat dokumentasi terpisah untuk setiap modul (tuliskan input, proses dan output) untuk setiap proses beserta fungsi, prosedur dan method.
9. Dengan menggunakan ERD yang dibuat dari poin 2 silakan mulai membuat database
10. Buat Folder projek, jalankan semua aplikasi yang programmer perlukan
11. Buatlah aplikasi dengan memperhatikan Coding Guidelines dan Best Practices. Perhatikan:
    - a. Pastikan halaman memuat dengan cepat (gunakan query yang efisien)
    - b. Gunakan prosedur dan fungsi
    - c. Gunakan array
    - d. Hindari looping yang tidak perlu
    - e. Gunakan limit ketika menggunakan data besar
12. Lakukan debugging ketika menemukan error dan perbaiki
13. Buat Laporan Singkat :
    - a. Fitur yang sudah berjalan dengan baik
    - b. Bug yang belum diperbaiki
    - c. Rencana Pengembangan berikutnya

---

**P2-25/26** | Hak Cipta pada Kemendikdasmen | SPK-4/4

---

## Hasil yang diharapkan

Hasil yang diharapkan dari rangkaian kerja di atas adalah terbuatnya Aplikasi Parkir sesuai dengan ketentuan fitur, dibuktikan dengan pengumpulan :

1. Folder Proyek Aplikasi (kode program lengkap)
2. Database dengan ekstensi .sql
3. Dokumentasi :
   - a. ERD
   - b. Deskripsi Program
   - c. Dokumentasi fungsi/ prosedur
   - d. Debuging
4. Laporan evaluasi singkat

---

> **"SELAMAT & SUKSES"**
