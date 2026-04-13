-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306:8111
-- Generation Time: Mar 31, 2026 at 08:24 AM
-- Server version: 10.4.22-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hermina_parking`
--

-- --------------------------------------------------------

--
-- Table structure for table `area_parkir`
--

CREATE TABLE `area_parkir` (
  `id_area` bigint(20) UNSIGNED NOT NULL,
  `nama_area` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kapasitas` int(11) NOT NULL,
  `peruntukan` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'semua',
  `terisi` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `area_parkir`
--

INSERT INTO `area_parkir` (`id_area`, `nama_area`, `kapasitas`, `peruntukan`, `terisi`, `created_at`, `updated_at`) VALUES
(1, 'Basement 1 - Motor Umum', 200, 'motor', 2, '2026-03-18 14:19:10', '2026-03-31 00:14:20'),
(2, 'Pelataran Depan - Mobil Umum', 50, 'mobil', 0, '2026-03-18 14:19:10', '2026-03-28 07:41:49'),
(3, 'Area VIP / Dokter', 20, 'mobil', 0, '2026-03-18 14:19:10', '2026-03-29 06:10:41'),
(4, 'IGD / Emergency Drop', 5, 'semua', 0, '2026-03-18 14:19:10', '2026-03-18 14:19:10');

-- --------------------------------------------------------

--
-- Table structure for table `gates`
--

CREATE TABLE `gates` (
  `id_gate` bigint(20) UNSIGNED NOT NULL,
  `kode_gate` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_gate` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_kendaraan` enum('motor','mobil','semua') COLLATE utf8mb4_unicode_ci NOT NULL,
  `direction` enum('masuk','keluar') COLLATE utf8mb4_unicode_ci NOT NULL,
  `metode_pembayaran` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gates`
--

INSERT INTO `gates` (`id_gate`, `kode_gate`, `nama_gate`, `jenis_kendaraan`, `direction`, `metode_pembayaran`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'gate_in_motor', 'Gate Masuk A — Roda 2 (Motor)', 'motor', 'masuk', NULL, 1, '2026-03-29 06:00:38', '2026-03-29 06:24:53'),
(2, 'gate_in_mobil', 'Gate Masuk B — Roda 4 (Mobil)', 'mobil', 'masuk', NULL, 1, '2026-03-29 06:00:38', '2026-03-29 06:24:53'),
(3, 'gate_out_1', 'Gate Keluar 1 — Roda 2, Cash', 'motor', 'keluar', 'cash', 1, '2026-03-29 06:00:38', '2026-03-29 06:24:53'),
(4, 'gate_out_2', 'Gate Keluar 2 — Roda 4, Cash', 'mobil', 'keluar', 'cash', 1, '2026-03-29 06:00:38', '2026-03-29 06:24:53'),
(5, 'gate_out_3', 'Gate Keluar 3 — Roda 2, Cashless', 'motor', 'keluar', 'cashless', 1, '2026-03-29 06:00:38', '2026-03-29 06:24:53'),
(6, 'gate_out_4', 'Gate Keluar 4 — Roda 4, Cashless', 'mobil', 'keluar', 'cashless', 1, '2026-03-29 06:00:38', '2026-03-29 06:24:53');

-- --------------------------------------------------------

--
-- Table structure for table `kendaraan`
--

CREATE TABLE `kendaraan` (
  `id_kendaraan` bigint(20) UNSIGNED NOT NULL,
  `plat_nomor` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_kendaraan` enum('motor','mobil','lainnya') COLLATE utf8mb4_unicode_ci NOT NULL,
  `warna` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pemilik` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `id_user` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kendaraan`
--

INSERT INTO `kendaraan` (`id_kendaraan`, `plat_nomor`, `jenis_kendaraan`, `warna`, `pemilik`, `created_at`, `updated_at`, `id_user`) VALUES
(1, 'B2175TOR', 'mobil', 'Putih', 'Dr. Tauhidan Aminn', '2026-03-18 14:20:20', '2026-03-18 14:20:20', 1);

-- --------------------------------------------------------

--
-- Table structure for table `log_aktivitas`
--

CREATE TABLE `log_aktivitas` (
  `id_log` bigint(20) UNSIGNED NOT NULL,
  `id_user` bigint(20) UNSIGNED NOT NULL,
  `aktivitas` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `waktu_aktivitas` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `log_aktivitas`
--

INSERT INTO `log_aktivitas` (`id_log`, `id_user`, `aktivitas`, `waktu_aktivitas`) VALUES
(1, 1, 'User melakukan Login', '2026-03-18 21:20:04'),
(2, 1, 'Admin mendaftarkan Member baru: B2175TOR', '2026-03-18 21:20:20'),
(3, 1, 'User melakukan Login', '2026-03-28 14:10:49'),
(4, 1, 'Petugas memproses Kendaraan Masuk: B1223H (via Manual)', '2026-03-28 14:11:38'),
(5, 1, 'Petugas memproses Checkout: B1223H (Rp 2,000)', '2026-03-28 14:11:55'),
(6, 1, 'Petugas memproses Kendaraan Masuk: B2175TOR (via QR)', '2026-03-28 14:37:08'),
(7, 1, 'Petugas memproses Checkout: B2175TOR (Member - Gratis)', '2026-03-28 14:41:49'),
(8, 1, 'Petugas memproses Kendaraan Masuk: B2175TOR (via QR)', '2026-03-28 14:42:26'),
(9, 1, 'User melakukan Login', '2026-03-28 18:01:54'),
(10, 4, 'User melakukan Login', '2026-03-29 13:09:56'),
(11, 4, 'Petugas memproses Checkout: B2175TOR (VIP - Gratis)', '2026-03-29 13:10:41'),
(12, 4, 'User melakukan Logout', '2026-03-29 13:12:18'),
(13, 1, 'User melakukan Login', '2026-03-29 13:12:26'),
(14, 1, 'User melakukan Logout', '2026-03-29 13:13:38'),
(15, 2, 'User melakukan Login', '2026-03-29 13:13:46'),
(16, 2, 'User melakukan Logout', '2026-03-29 13:14:10'),
(17, 3, 'User melakukan Login', '2026-03-29 13:14:21'),
(18, 3, 'User melakukan Logout', '2026-03-29 13:17:33'),
(19, 4, 'User melakukan Login', '2026-03-29 13:17:44'),
(20, 4, 'User melakukan Logout', '2026-03-29 13:19:12'),
(21, 1, 'User melakukan Login', '2026-03-29 13:19:20'),
(22, 1, 'DARURAT: Semua gate diaktifkan oleh Admin.', '2026-03-29 13:24:53'),
(23, 1, 'User melakukan Login', '2026-03-29 13:26:24'),
(24, 1, 'User melakukan Logout', '2026-03-29 13:34:28'),
(25, 2, 'User melakukan Login', '2026-03-29 13:34:36'),
(26, 2, 'User melakukan Logout', '2026-03-29 13:34:43'),
(27, 4, 'User melakukan Login', '2026-03-29 13:34:57'),
(28, 4, 'User melakukan Logout', '2026-03-29 13:54:08'),
(29, 2, 'User melakukan Login', '2026-03-29 13:54:27'),
(30, 2, 'User melakukan Login', '2026-03-31 06:45:30'),
(31, 2, 'User melakukan Logout', '2026-03-31 06:54:35'),
(32, 2, 'User melakukan Login', '2026-03-31 06:56:09'),
(33, 2, 'Kendaraan Masuk: B2175TOR via Gate MOTOR (QR) [VIP]', '2026-03-31 07:01:32'),
(34, 2, 'Kendaraan Masuk: B2175TOR via Gate MOTOR (QR) [VIP]', '2026-03-31 07:02:00'),
(35, 2, 'User melakukan Logout', '2026-03-31 07:10:53'),
(36, 2, 'User melakukan Login', '2026-03-31 07:11:04'),
(37, 2, 'Kendaraan Masuk: GATE-M-31071254 via Gate MOTOR (Manual)', '2026-03-31 07:12:54'),
(38, 2, 'Checkout: B2175TOR via gate_out_1 [VIP - Gratis]', '2026-03-31 07:14:20'),
(39, 2, 'User melakukan Logout', '2026-03-31 07:51:38'),
(40, 2, 'User melakukan Login', '2026-03-31 08:16:15'),
(41, 2, 'User melakukan Logout', '2026-03-31 08:19:00'),
(42, 2, 'User melakukan Login', '2026-03-31 08:34:57'),
(43, 2, 'User melakukan Logout', '2026-03-31 08:53:47'),
(44, 2, 'User melakukan Login', '2026-03-31 08:55:29'),
(45, 2, 'User melakukan Logout', '2026-03-31 09:02:16'),
(46, 1, 'User melakukan Login', '2026-03-31 09:02:40'),
(47, 1, 'User melakukan Logout', '2026-03-31 09:05:09'),
(48, 3, 'User melakukan Login', '2026-03-31 09:05:21'),
(49, 3, 'User melakukan Logout', '2026-03-31 09:06:27'),
(50, 2, 'User melakukan Login', '2026-03-31 09:14:22'),
(51, 2, 'User melakukan Login', '2026-03-31 13:20:59');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(2, '2024_01_01_000001_create_users_table', 1),
(3, '2024_01_01_000002_create_area_parkir_table', 1),
(4, '2024_01_01_000003_create_tarif_table', 1),
(5, '2024_01_01_000004_create_kendaraan_table', 1),
(6, '2024_01_01_000005_create_transaksi_table', 1),
(7, '2024_01_01_000006_create_log_aktivitas_table', 1),
(8, '2026_02_04_000001_remove_id_user_from_kendaraan', 1),
(9, '2026_02_04_000003_add_id_user_to_kendaraan', 1),
(10, '2026_02_04_131821_align_kendaraan_structure_to_prd', 1),
(11, '2026_02_04_134209_remove_id_user_from_kendaraan_table', 1),
(12, '2026_02_04_135550_add_id_user_to_kendaraan_table', 1),
(13, '2026_02_19_000001_add_jenis_kendaraan_to_transaksi_table', 1),
(14, '2026_02_21_000001_rename_id_transaksi_to_id_parkir_and_add_id_kendaraan', 1),
(15, '2026_02_21_000002_add_performance_indexes', 1),
(16, '2026_02_23_000001_add_peruntukan_to_area_parkir', 1),
(17, '2026_02_23_000001_change_tarif_decimal_precision', 1),
(18, '2026_02_24_164242_change_status_aktif_type_on_users_table', 1),
(19, '2026_03_28_140123_add_metode_entry_to_transaksi_table', 2),
(20, '2026_03_29_000001_add_gate_fields_to_transaksi_table', 3),
(21, '2026_03_29_000002_add_tipe_tarif_to_tarif_table', 3),
(22, '2026_03_29_000003_create_gates_table', 3);

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tarif`
--

CREATE TABLE `tarif` (
  `id_tarif` bigint(20) UNSIGNED NOT NULL,
  `jenis_kendaraan` enum('motor','mobil','lainnya') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tarif_per_jam` decimal(10,0) NOT NULL,
  `tipe_tarif` enum('normal','denda') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tarif`
--

INSERT INTO `tarif` (`id_tarif`, `jenis_kendaraan`, `tarif_per_jam`, `tipe_tarif`, `created_at`, `updated_at`) VALUES
(1, 'motor', 2000, 'normal', '2026-03-18 14:19:10', '2026-03-18 14:19:10'),
(2, 'mobil', 5000, 'normal', '2026-03-18 14:19:10', '2026-03-18 14:19:10'),
(3, 'lainnya', 0, 'normal', '2026-03-18 14:19:10', '2026-03-18 14:19:10'),
(4, 'motor', 20000, 'denda', '2026-03-29 06:00:38', '2026-03-29 06:00:38'),
(5, 'mobil', 50000, 'denda', '2026-03-29 06:00:38', '2026-03-29 06:00:38');

-- --------------------------------------------------------

--
-- Table structure for table `transaksi`
--

CREATE TABLE `transaksi` (
  `id_parkir` bigint(20) UNSIGNED NOT NULL,
  `id_tarif` bigint(20) UNSIGNED NOT NULL,
  `id_area` bigint(20) UNSIGNED NOT NULL,
  `id_user` bigint(20) UNSIGNED NOT NULL,
  `id_kendaraan` bigint(20) UNSIGNED DEFAULT NULL,
  `plat_nomor` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_kendaraan` enum('motor','mobil','lainnya') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `waktu_masuk` datetime NOT NULL,
  `waktu_keluar` datetime DEFAULT NULL,
  `durasi_jam` int(11) DEFAULT NULL,
  `biaya_total` decimal(10,0) DEFAULT NULL,
  `status` enum('masuk','keluar') COLLATE utf8mb4_unicode_ci NOT NULL,
  `metode_entry` enum('OCR','QR','Manual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Manual',
  `gate_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metode_pembayaran` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transaksi`
--

INSERT INTO `transaksi` (`id_parkir`, `id_tarif`, `id_area`, `id_user`, `id_kendaraan`, `plat_nomor`, `jenis_kendaraan`, `waktu_masuk`, `waktu_keluar`, `durasi_jam`, `biaya_total`, `status`, `metode_entry`, `gate_type`, `metode_pembayaran`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, NULL, 'B1223H', 'motor', '2026-03-28 14:11:38', '2026-03-28 14:11:55', 1, 2000, 'keluar', 'Manual', NULL, NULL, '2026-03-28 07:11:38', '2026-03-28 07:11:55'),
(2, 2, 2, 1, 1, 'B2175TOR', 'mobil', '2026-03-28 14:37:08', '2026-03-28 14:41:49', 1, 0, 'keluar', 'QR', NULL, NULL, '2026-03-28 07:37:08', '2026-03-28 07:41:49'),
(3, 2, 3, 1, 1, 'B2175TOR', 'mobil', '2026-03-28 14:42:26', '2026-03-29 13:10:41', 23, 0, 'keluar', 'QR', NULL, NULL, '2026-03-28 07:42:26', '2026-03-29 06:10:41'),
(4, 1, 1, 2, 1, 'B2175TOR', 'motor', '2026-03-31 07:01:32', NULL, NULL, 0, 'masuk', 'QR', 'gate_in_motor', NULL, '2026-03-31 00:01:32', '2026-03-31 00:01:32'),
(5, 1, 1, 2, 1, 'B2175TOR', 'motor', '2026-03-31 07:02:00', '2026-03-31 07:14:20', 1, 0, 'keluar', 'QR', 'gate_out_1', 'vip', '2026-03-31 00:02:00', '2026-03-31 00:14:20'),
(6, 1, 1, 2, NULL, 'GATE-M-31071254', 'motor', '2026-03-31 07:12:54', NULL, NULL, 0, 'masuk', 'Manual', 'gate_in_motor', NULL, '2026-03-31 00:12:54', '2026-03-31 00:12:54');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id_user` bigint(20) UNSIGNED NOT NULL,
  `nama_lengkap` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','petugas','owner') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_aktif` enum('aktif','nonaktif') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id_user`, `nama_lengkap`, `username`, `password`, `role`, `status_aktif`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin System', 'admin', '$2y$10$qr8k1yPYqWPzwint2oYw2O2vy/2O8Uo8KBjLGuCC6/pnRRvmZKlzq', 'admin', 'aktif', NULL, '2026-03-18 14:19:09', '2026-03-18 14:19:09'),
(2, 'Petugas Gate 1', 'petugas', '$2y$10$o8eDcDMxnMkwK0fe/cB3n.HANKI8cNHNrRs87yaiZnLLlvZAiY/yC', 'petugas', 'aktif', NULL, '2026-03-18 14:19:09', '2026-03-18 14:19:09'),
(3, 'Owner Hermina', 'owner', '$2y$10$LSa8/TKLNS.I9rsdh1sjgOyzmQ97Y4Wn3fJ7oInY6AnMyD1zP2DlG', 'owner', 'aktif', NULL, '2026-03-18 14:19:10', '2026-03-18 14:19:10'),
(4, 'Sistem Gate Motor', 'gate-motor', '$2y$10$tONbgC08sYnU1OrBOfre9ekqLfAHM/9F13dUFnflvoJYBK..qhvo6', 'petugas', 'aktif', NULL, '2026-03-29 06:01:41', '2026-03-29 06:01:41'),
(5, 'Sistem Gate Mobil', 'gate-mobil', '$2y$10$EI7AQxertRy2s76nITm.Q.Rg1kTiYpIz05tXkt7auFfi.a1.hJ3kq', 'petugas', 'aktif', NULL, '2026-03-29 06:01:41', '2026-03-29 06:01:41');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `area_parkir`
--
ALTER TABLE `area_parkir`
  ADD PRIMARY KEY (`id_area`);

--
-- Indexes for table `gates`
--
ALTER TABLE `gates`
  ADD PRIMARY KEY (`id_gate`),
  ADD UNIQUE KEY `gates_kode_gate_unique` (`kode_gate`);

--
-- Indexes for table `kendaraan`
--
ALTER TABLE `kendaraan`
  ADD PRIMARY KEY (`id_kendaraan`),
  ADD UNIQUE KEY `kendaraan_plat_nomor_unique` (`plat_nomor`),
  ADD KEY `kendaraan_id_user_foreign` (`id_user`);

--
-- Indexes for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `log_aktivitas_id_user_foreign` (`id_user`),
  ADD KEY `log_aktivitas_waktu_aktivitas_index` (`waktu_aktivitas`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `tarif`
--
ALTER TABLE `tarif`
  ADD PRIMARY KEY (`id_tarif`);

--
-- Indexes for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD PRIMARY KEY (`id_parkir`),
  ADD KEY `transaksi_id_tarif_foreign` (`id_tarif`),
  ADD KEY `transaksi_id_area_foreign` (`id_area`),
  ADD KEY `transaksi_id_user_foreign` (`id_user`),
  ADD KEY `transaksi_id_kendaraan_foreign` (`id_kendaraan`),
  ADD KEY `transaksi_plat_nomor_index` (`plat_nomor`),
  ADD KEY `transaksi_status_index` (`status`),
  ADD KEY `transaksi_waktu_masuk_index` (`waktu_masuk`),
  ADD KEY `transaksi_waktu_keluar_index` (`waktu_keluar`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `users_username_unique` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `area_parkir`
--
ALTER TABLE `area_parkir`
  MODIFY `id_area` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `gates`
--
ALTER TABLE `gates`
  MODIFY `id_gate` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `kendaraan`
--
ALTER TABLE `kendaraan`
  MODIFY `id_kendaraan` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  MODIFY `id_log` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tarif`
--
ALTER TABLE `tarif`
  MODIFY `id_tarif` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `id_parkir` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id_user` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `kendaraan`
--
ALTER TABLE `kendaraan`
  ADD CONSTRAINT `kendaraan_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  ADD CONSTRAINT `log_aktivitas_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD CONSTRAINT `transaksi_id_area_foreign` FOREIGN KEY (`id_area`) REFERENCES `area_parkir` (`id_area`),
  ADD CONSTRAINT `transaksi_id_kendaraan_foreign` FOREIGN KEY (`id_kendaraan`) REFERENCES `kendaraan` (`id_kendaraan`) ON DELETE SET NULL,
  ADD CONSTRAINT `transaksi_id_tarif_foreign` FOREIGN KEY (`id_tarif`) REFERENCES `tarif` (`id_tarif`),
  ADD CONSTRAINT `transaksi_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
