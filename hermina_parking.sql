-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306:8111
-- Generation Time: Feb 23, 2026 at 03:45 PM
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
(1, 'Basement 1 - Motor Umum', 200, 'motor', 0, '2026-02-23 12:23:53', '2026-02-23 12:23:53'),
(2, 'Pelataran Depan - Mobil Umum', 50, 'mobil', 0, '2026-02-23 12:23:53', '2026-02-23 12:23:53'),
(3, 'Area VIP / Dokter', 20, 'mobil', 0, '2026-02-23 12:23:53', '2026-02-23 12:23:53'),
(4, 'IGD / Emergency Drop', 5, 'semua', 0, '2026-02-23 12:23:53', '2026-02-23 12:23:53');

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
(17, '2026_02_23_000001_change_tarif_decimal_precision', 1);

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
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tarif`
--

INSERT INTO `tarif` (`id_tarif`, `jenis_kendaraan`, `tarif_per_jam`, `created_at`, `updated_at`) VALUES
(1, 'motor', 2000, '2026-02-23 12:23:53', '2026-02-23 12:23:53'),
(2, 'mobil', 5000, '2026-02-23 12:23:53', '2026-02-23 12:23:53'),
(3, 'lainnya', 0, '2026-02-23 12:23:53', '2026-02-23 12:23:53');

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
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(1, 'Admin System', 'admin', '$2y$10$TqH5iOzVPSbdxXdPHTNl4uiKBfZCPvuX5p/qEhO7o5B0YgXbuxR6i', 'admin', 'aktif', NULL, '2026-02-23 12:23:53', '2026-02-23 12:23:53'),
(2, 'Petugas Gate 1', 'petugas', '$2y$10$CnIUcf9ypjhFOs/MUgH8uuwcJBTpn/hwipMgJElakiQ.1XMXUJgTm', 'petugas', 'aktif', NULL, '2026-02-23 12:23:53', '2026-02-23 12:23:53'),
(3, 'Owner Hermina', 'owner', '$2y$10$BhgB666eRuKQrXdEHWYrAeCwSM.L0HF4/cg/xddEGFog3G3W0RQKu', 'owner', 'aktif', NULL, '2026-02-23 12:23:53', '2026-02-23 12:23:53');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `area_parkir`
--
ALTER TABLE `area_parkir`
  ADD PRIMARY KEY (`id_area`);

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
-- AUTO_INCREMENT for table `kendaraan`
--
ALTER TABLE `kendaraan`
  MODIFY `id_kendaraan` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  MODIFY `id_log` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tarif`
--
ALTER TABLE `tarif`
  MODIFY `id_tarif` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `id_parkir` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id_user` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
