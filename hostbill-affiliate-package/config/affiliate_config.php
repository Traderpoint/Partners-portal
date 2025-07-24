<?php
/**
 * HostBill Affiliate System Configuration
 * Umístění: /config/affiliate_config.php
 * Verze: 1.0.0
 * 
 * Tento soubor obsahuje všechna nastavení pro affiliate systém.
 * Upravte hodnoty podle vašich potřeb.
 */

// Zabránění přímému přístupu
if (!defined('HOSTBILL_AFFILIATE_CONFIG')) {
    define('HOSTBILL_AFFILIATE_CONFIG', true);
}

/**
 * ZÁKLADNÍ NASTAVENÍ
 */
$affiliate_config = [
    
    // Obecné nastavení
    'enabled' => true,                          // Zapnout/vypnout affiliate systém
    'debug_mode' => false,                      // Debug režim (pouze pro vývoj)
    'version' => '1.0.0',                       // Verze systému
    
    // Tracking nastavení
    'cookie_name' => 'hb_affiliate',            // Název affiliate cookie
    'cookie_duration' => 30,                    // Doba platnosti cookie (dny)
    'tracking_parameter' => 'aff',              // URL parametr pro affiliate ID
    'session_tracking' => true,                 // Sledování session
    'ip_tracking' => true,                      // Sledování IP adres
    
    // Provizní systém
    'default_commission_rate' => 10.00,         // Výchozí provizní sazba (%)
    'minimum_payout' => 500.00,                 // Minimální částka pro výplatu (CZK)
    'currency' => 'CZK',                        // Výchozí měna
    'commission_type' => 'percentage',          // percentage nebo fixed
    
    // Registrace affiliates
    'registration_enabled' => true,             // Povolit registraci nových affiliates
    'admin_approval_required' => true,          // Vyžadovat schválení adminem
    'email_verification_required' => true,     // Vyžadovat ověření emailu
    'auto_approve_threshold' => 1000.00,       // Auto-schválení při překročení částky
    
    // Fraud protection
    'fraud_protection' => true,                 // Zapnout ochranu proti podvodům
    'max_clicks_per_ip' => 10,                 // Max. kliků z jedné IP za den
    'max_conversions_per_ip' => 3,             // Max. konverzí z jedné IP za den
    'suspicious_patterns' => [                 // Podezřelé vzory
        'same_ip_multiple_affiliates',
        'rapid_fire_clicks',
        'unusual_conversion_rate'
    ],
    
    // Email nastavení
    'email_notifications' => true,             // Zapnout email notifikace
    'notify_new_conversion' => true,           // Notifikace o nové konverzi
    'notify_payout_request' => true,           // Notifikace o žádosti o výplatu
    'notify_payout_completed' => true,         // Notifikace o dokončené výplatě
    'admin_email' => 'admin@systrix.cz',       // Email administrátora
    'from_email' => 'noreply@systrix.cz',      // Odesílací email
    
    // Výplaty
    'payout_methods' => [                      // Dostupné způsoby výplat
        'bank_transfer' => 'Bankovní převod',
        'paypal' => 'PayPal',
        'stripe' => 'Stripe'
    ],
    'payout_schedule' => 'monthly',            // weekly, monthly, quarterly
    'payout_day' => 15,                        // Den v měsíci pro výplaty
    'auto_payout_enabled' => false,           // Automatické výplaty
    'payout_fee' => 0.00,                     // Poplatek za výplatu
    
    // Tier systém
    'tier_system_enabled' => true,            // Zapnout tier systém
    'tiers' => [
        1 => [
            'name' => 'Bronze',
            'min_earnings' => 0,
            'max_earnings' => 5000,
            'commission_rate' => 8.00,
            'bonus_rate' => 0.00
        ],
        2 => [
            'name' => 'Silver',
            'min_earnings' => 5001,
            'max_earnings' => 15000,
            'commission_rate' => 10.00,
            'bonus_rate' => 2.00
        ],
        3 => [
            'name' => 'Gold',
            'min_earnings' => 15001,
            'max_earnings' => 50000,
            'commission_rate' => 12.00,
            'bonus_rate' => 5.00
        ],
        4 => [
            'name' => 'Platinum',
            'min_earnings' => 50001,
            'max_earnings' => null,
            'commission_rate' => 15.00,
            'bonus_rate' => 10.00
        ]
    ],
    
    // Produktové provize
    'product_commissions' => [
        'VPS Start' => 10.00,
        'VPS Profi' => 12.00,
        'VPS Expert' => 15.00,
        'VPS Ultra' => 18.00,
        'Webhosting Basic' => 8.00,
        'Webhosting Pro' => 10.00,
        'Webhosting Business' => 12.00,
        'Domain Registration' => 5.00,
        'SSL Certificate' => 20.00
    ],
    
    // Bonusy
    'signup_bonus' => 100.00,                  // Bonus za registraci
    'first_sale_bonus' => 200.00,             // Bonus za první prodej
    'monthly_bonus_threshold' => 5000.00,     // Práh pro měsíční bonus
    'monthly_bonus_amount' => 500.00,         // Výše měsíčního bonusu
    
    // Reporting
    'reports_enabled' => true,                 // Zapnout reporty
    'report_frequency' => 'weekly',           // daily, weekly, monthly
    'detailed_stats' => true,                 // Detailní statistiky
    'export_formats' => ['csv', 'pdf', 'excel'], // Formáty exportu
    
    // API nastavení
    'api_enabled' => true,                     // Zapnout API
    'api_rate_limit' => 1000,                 // Limit požadavků za hodinu
    'api_authentication' => 'token',          // token, basic, oauth
    'api_version' => 'v1',                    // Verze API
    
    // Cache nastavení
    'cache_enabled' => true,                   // Zapnout cache
    'cache_duration' => 3600,                 // Doba cache (sekundy)
    'cache_driver' => 'file',                 // file, redis, memcached
    
    // Bezpečnost
    'csrf_protection' => true,                // CSRF ochrana
    'rate_limiting' => true,                  // Rate limiting
    'ip_whitelist' => [],                     // Whitelist IP adres
    'ip_blacklist' => [],                     // Blacklist IP adres
    
    // Logging
    'logging_enabled' => true,                // Zapnout logování
    'log_level' => 'info',                   // debug, info, warning, error
    'log_file' => 'affiliate.log',           // Název log souboru
    'log_rotation' => true,                   // Rotace logů
    'max_log_size' => '10MB',                // Maximální velikost logu
    
    // Integrace
    'google_analytics' => [
        'enabled' => false,
        'tracking_id' => 'UA-XXXXXXXX-X',
        'enhanced_ecommerce' => true
    ],
    'facebook_pixel' => [
        'enabled' => false,
        'pixel_id' => 'XXXXXXXXXXXXXXXXX'
    ],
    'webhooks' => [
        'enabled' => false,
        'endpoints' => [
            'new_affiliate' => 'https://example.com/webhook/new-affiliate',
            'new_conversion' => 'https://example.com/webhook/new-conversion',
            'payout_completed' => 'https://example.com/webhook/payout-completed'
        ]
    ],
    
    // Customizace
    'custom_fields' => [                      // Vlastní pole pro affiliates
        'company_name' => [
            'type' => 'text',
            'required' => false,
            'label' => 'Název společnosti'
        ],
        'website' => [
            'type' => 'url',
            'required' => false,
            'label' => 'Webová stránka'
        ],
        'marketing_channels' => [
            'type' => 'select',
            'required' => true,
            'label' => 'Marketingové kanály',
            'options' => [
                'social_media' => 'Sociální sítě',
                'email_marketing' => 'Email marketing',
                'content_marketing' => 'Content marketing',
                'paid_advertising' => 'Placená reklama',
                'other' => 'Jiné'
            ]
        ]
    ],
    
    // Lokalizace
    'default_language' => 'cs',              // Výchozí jazyk
    'supported_languages' => ['cs', 'en'],   // Podporované jazyky
    'date_format' => 'd.m.Y',               // Formát data
    'time_format' => 'H:i',                 // Formát času
    'timezone' => 'Europe/Prague',          // Časová zóna
    
    // Performance
    'database_optimization' => true,         // Optimalizace databáze
    'query_caching' => true,                // Cache dotazů
    'lazy_loading' => true,                 // Lazy loading
    'compression' => true,                  // Komprese odpovědí
    
    // Maintenance
    'maintenance_mode' => false,            // Režim údržby
    'backup_enabled' => true,               // Automatické zálohy
    'backup_frequency' => 'daily',          // Frekvence záloh
    'cleanup_old_data' => true,            // Čištění starých dat
    'data_retention_days' => 365           // Doba uchovávání dat (dny)
];

/**
 * VALIDACE KONFIGURACE
 */
function validateAffiliateConfig($config) {
    $errors = [];
    
    // Kontrola povinných hodnot
    if ($config['default_commission_rate'] < 0 || $config['default_commission_rate'] > 100) {
        $errors[] = 'Commission rate must be between 0 and 100';
    }
    
    if ($config['minimum_payout'] < 0) {
        $errors[] = 'Minimum payout must be positive';
    }
    
    if ($config['cookie_duration'] < 1) {
        $errors[] = 'Cookie duration must be at least 1 day';
    }
    
    // Kontrola email formátu
    if (!filter_var($config['admin_email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid admin email format';
    }
    
    if (!filter_var($config['from_email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid from email format';
    }
    
    return $errors;
}

/**
 * NAČTENÍ KONFIGURACE
 */
function getAffiliateConfig() {
    global $affiliate_config;
    
    // Validace
    $errors = validateAffiliateConfig($affiliate_config);
    if (!empty($errors)) {
        error_log('Affiliate config validation errors: ' . implode(', ', $errors));
    }
    
    return $affiliate_config;
}

/**
 * ULOŽENÍ KONFIGURACE
 */
function saveAffiliateConfig($new_config) {
    global $affiliate_config;
    
    // Merge s existující konfigurací
    $affiliate_config = array_merge($affiliate_config, $new_config);
    
    // Validace
    $errors = validateAffiliateConfig($affiliate_config);
    if (!empty($errors)) {
        return ['success' => false, 'errors' => $errors];
    }
    
    // Zde byste implementovali uložení do databáze nebo souboru
    // Pro jednoduchost pouze logujeme
    error_log('Affiliate config updated: ' . json_encode($new_config));
    
    return ['success' => true];
}

// Export konfigurace
if (!function_exists('get_affiliate_config')) {
    function get_affiliate_config($key = null) {
        $config = getAffiliateConfig();
        return $key ? ($config[$key] ?? null) : $config;
    }
}
?>
