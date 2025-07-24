-- HostBill Affiliate System - Database Tables
-- Verze: 1.0.0
-- Spusťte tento skript v HostBill databázi
-- 
-- NÁVOD:
-- 1. Přihlaste se do HostBill Admin → System → Database → SQL Query
-- 2. Zkopírujte a vložte tento SQL kód
-- 3. Klikněte na "Execute Query"

-- =====================================================
-- TABULKA PRO AFFILIATE NÁVŠTĚVY
-- =====================================================
CREATE TABLE IF NOT EXISTS `tblaffiliatevisits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `affiliate_id` int(11) NOT NULL,
  `page` varchar(255) NOT NULL DEFAULT '',
  `referrer` varchar(500) DEFAULT NULL,
  `ip_address` varchar(45) NOT NULL DEFAULT '',
  `user_agent` text,
  `visit_date` datetime NOT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `country` varchar(2) DEFAULT NULL,
  `browser` varchar(50) DEFAULT NULL,
  `os` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_affiliate_id` (`affiliate_id`),
  KEY `idx_visit_date` (`visit_date`),
  KEY `idx_ip_address` (`ip_address`),
  KEY `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sledování návštěv affiliate partnerů';

-- =====================================================
-- TABULKA PRO AFFILIATE KONVERZE
-- =====================================================
CREATE TABLE IF NOT EXISTS `tblaffiliateconversions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `affiliate_id` int(11) NOT NULL,
  `order_id` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `commission_rate` decimal(5,2) NOT NULL DEFAULT '10.00',
  `commission_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(3) NOT NULL DEFAULT 'CZK',
  `products` text,
  `conversion_date` datetime NOT NULL,
  `status` enum('pending','approved','rejected','paid') DEFAULT 'pending',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `notes` text,
  `approved_date` datetime DEFAULT NULL,
  `paid_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_id` (`order_id`),
  KEY `idx_affiliate_id` (`affiliate_id`),
  KEY `idx_status` (`status`),
  KEY `idx_conversion_date` (`conversion_date`),
  KEY `idx_commission_amount` (`commission_amount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Affiliate konverze a provize';

-- =====================================================
-- TABULKA PRO PAGE VIEWS
-- =====================================================
CREATE TABLE IF NOT EXISTS `tblaffiliatepageviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `affiliate_id` int(11) NOT NULL,
  `page` varchar(255) NOT NULL DEFAULT '',
  `referrer` varchar(500) DEFAULT NULL,
  `ip_address` varchar(45) NOT NULL DEFAULT '',
  `user_agent` text,
  `timestamp` int(11) NOT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `bounce` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_affiliate_id` (`affiliate_id`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_page` (`page`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detailní sledování page views';

-- =====================================================
-- TABULKA PRO DENNÍ STATISTIKY
-- =====================================================
CREATE TABLE IF NOT EXISTS `tblaffiliatestats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `affiliate_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `visits` int(11) NOT NULL DEFAULT '0',
  `conversions` int(11) NOT NULL DEFAULT '0',
  `earnings` decimal(10,2) NOT NULL DEFAULT '0.00',
  `clicks` int(11) NOT NULL DEFAULT '0',
  `unique_visitors` int(11) NOT NULL DEFAULT '0',
  `bounce_rate` decimal(5,2) DEFAULT '0.00',
  `avg_session_duration` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_affiliate_date` (`affiliate_id`, `date`),
  KEY `idx_date` (`date`),
  KEY `idx_earnings` (`earnings`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Denní statistiky affiliate partnerů';

-- =====================================================
-- ROZŠÍŘENÍ TABULKY AFFILIATES
-- =====================================================
-- Přidání sloupců do existující tabulky tblaffiliates
ALTER TABLE `tblaffiliates` 
ADD COLUMN IF NOT EXISTS `commission_rate` decimal(5,2) NOT NULL DEFAULT '10.00' COMMENT 'Provizní sazba v %',
ADD COLUMN IF NOT EXISTS `total_visits` int(11) NOT NULL DEFAULT '0' COMMENT 'Celkový počet návštěv',
ADD COLUMN IF NOT EXISTS `total_conversions` int(11) NOT NULL DEFAULT '0' COMMENT 'Celkový počet konverzí',
ADD COLUMN IF NOT EXISTS `total_earnings` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Celkové výdělky',
ADD COLUMN IF NOT EXISTS `last_activity` datetime DEFAULT NULL COMMENT 'Poslední aktivita',
ADD COLUMN IF NOT EXISTS `signup_bonus` decimal(10,2) DEFAULT '0.00' COMMENT 'Bonus za registraci',
ADD COLUMN IF NOT EXISTS `tier_level` int(11) DEFAULT '1' COMMENT 'Úroveň partnera',
ADD COLUMN IF NOT EXISTS `payment_method` enum('bank_transfer','paypal','stripe') DEFAULT 'bank_transfer' COMMENT 'Způsob výplaty',
ADD COLUMN IF NOT EXISTS `payment_details` text COMMENT 'Detaily pro výplatu',
ADD COLUMN IF NOT EXISTS `notes` text COMMENT 'Poznámky';

-- =====================================================
-- TABULKA PRO AFFILIATE SKUPINY
-- =====================================================
CREATE TABLE IF NOT EXISTS `tblaffiliategroups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `commission_rate` decimal(5,2) NOT NULL DEFAULT '10.00',
  `description` text,
  `min_earnings` decimal(10,2) DEFAULT '0.00',
  `max_earnings` decimal(10,2) DEFAULT NULL,
  `bonus_rate` decimal(5,2) DEFAULT '0.00',
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Skupiny affiliate partnerů';

-- =====================================================
-- TABULKA PRO PROVIZE PODLE PRODUKTŮ
-- =====================================================
CREATE TABLE IF NOT EXISTS `tblaffiliateproductcommissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `affiliate_id` int(11) DEFAULT NULL,
  `affiliate_group_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(100) DEFAULT NULL,
  `commission_rate` decimal(5,2) NOT NULL DEFAULT '10.00',
  `commission_type` enum('percentage','fixed') DEFAULT 'percentage',
  `commission_amount` decimal(10,2) DEFAULT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `idx_affiliate_id` (`affiliate_id`),
  KEY `idx_affiliate_group_id` (`affiliate_group_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Provize podle produktů';

-- =====================================================
-- TABULKA PRO VÝPLATY
-- =====================================================
CREATE TABLE IF NOT EXISTS `tblaffiliatepayouts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `affiliate_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'CZK',
  `payment_method` varchar(50) NOT NULL,
  `payment_details` text,
  `status` enum('pending','processing','completed','failed','cancelled') DEFAULT 'pending',
  `request_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_date` datetime DEFAULT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `notes` text,
  `admin_notes` text,
  PRIMARY KEY (`id`),
  KEY `idx_affiliate_id` (`affiliate_id`),
  KEY `idx_status` (`status`),
  KEY `idx_request_date` (`request_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Výplaty affiliate partnerům';

-- =====================================================
-- TABULKA PRO AFFILIATE ODKAZY
-- =====================================================
CREATE TABLE IF NOT EXISTS `tblaffiliatelinks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `affiliate_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `url` varchar(500) NOT NULL,
  `description` text,
  `clicks` int(11) NOT NULL DEFAULT '0',
  `conversions` int(11) NOT NULL DEFAULT '0',
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_click` datetime DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `idx_affiliate_id` (`affiliate_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Affiliate odkazy a jejich statistiky';

-- =====================================================
-- INDEXY PRO OPTIMALIZACI
-- =====================================================

-- Composite indexy pro rychlejší dotazy
ALTER TABLE `tblaffiliatevisits` 
ADD INDEX `idx_affiliate_date` (`affiliate_id`, `visit_date`),
ADD INDEX `idx_date_affiliate` (`visit_date`, `affiliate_id`);

ALTER TABLE `tblaffiliateconversions` 
ADD INDEX `idx_affiliate_status` (`affiliate_id`, `status`),
ADD INDEX `idx_date_status` (`conversion_date`, `status`);

-- =====================================================
-- VÝCHOZÍ DATA
-- =====================================================

-- Vytvoření výchozích affiliate skupin
INSERT IGNORE INTO `tblaffiliategroups` (`id`, `name`, `commission_rate`, `description`) VALUES
(1, 'Standard Partners', 10.00, 'Standardní affiliate program s 10% provizí'),
(2, 'VIP Partners', 15.00, 'Prémiový affiliate program s 15% provizí pro top partnery'),
(3, 'Bronze Partners', 8.00, 'Začínající partneři s 8% provizí'),
(4, 'Silver Partners', 12.00, 'Pokročilí partneři s 12% provizí'),
(5, 'Gold Partners', 18.00, 'Nejlepší partneři s 18% provizí');

-- Výchozí provize podle produktů
INSERT IGNORE INTO `tblaffiliateproductcommissions` (`affiliate_group_id`, `product_name`, `commission_rate`) VALUES
(1, 'VPS Start', 10.00),
(1, 'VPS Profi', 10.00),
(1, 'VPS Expert', 10.00),
(1, 'VPS Ultra', 10.00),
(2, 'VPS Start', 15.00),
(2, 'VPS Profi', 15.00),
(2, 'VPS Expert', 15.00),
(2, 'VPS Ultra', 15.00);

-- =====================================================
-- KONEC SKRIPTU
-- =====================================================
