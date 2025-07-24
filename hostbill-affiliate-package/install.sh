#!/bin/bash

# HostBill Affiliate System - Automatický instalační skript
# Verze: 1.0.0
# Použití: ./install.sh

set -e  # Ukončit při chybě

# Barvy pro výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkce pro výpis
print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  HostBill Affiliate System - Instalace${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Kontrola požadavků
check_requirements() {
    print_info "Kontrola systémových požadavků..."
    
    # Kontrola PHP
    if command -v php &> /dev/null; then
        PHP_VERSION=$(php -r "echo PHP_VERSION;")
        print_success "PHP verze: $PHP_VERSION"
        
        # Kontrola PHP rozšíření
        REQUIRED_EXTENSIONS=("pdo" "pdo_mysql" "json" "curl")
        for ext in "${REQUIRED_EXTENSIONS[@]}"; do
            if php -m | grep -q "$ext"; then
                print_success "PHP rozšíření $ext: OK"
            else
                print_error "Chybí PHP rozšíření: $ext"
                exit 1
            fi
        done
    else
        print_error "PHP není nainstalováno"
        exit 1
    fi
    
    # Kontrola MySQL
    if command -v mysql &> /dev/null; then
        MYSQL_VERSION=$(mysql --version | awk '{print $5}' | sed 's/,//')
        print_success "MySQL verze: $MYSQL_VERSION"
    else
        print_warning "MySQL klient není dostupný (může být v pořádku)"
    fi
    
    echo ""
}

# Získání konfigurace od uživatele
get_configuration() {
    print_info "Konfigurace instalace..."
    
    # HostBill cesta
    read -p "Zadejte cestu k HostBill instalaci [/var/www/hostbill]: " HOSTBILL_PATH
    HOSTBILL_PATH=${HOSTBILL_PATH:-/var/www/hostbill}
    
    if [ ! -d "$HOSTBILL_PATH" ]; then
        print_error "Adresář $HOSTBILL_PATH neexistuje"
        exit 1
    fi
    
    if [ ! -f "$HOSTBILL_PATH/configuration.php" ]; then
        print_error "HostBill configuration.php nenalezen v $HOSTBILL_PATH"
        exit 1
    fi
    
    print_success "HostBill cesta: $HOSTBILL_PATH"
    
    # Databázové údaje
    print_info "Načítání databázových údajů z HostBill konfigurace..."
    
    DB_HOST=$(grep '$db_host' "$HOSTBILL_PATH/configuration.php" | cut -d'"' -f2)
    DB_NAME=$(grep '$db_name' "$HOSTBILL_PATH/configuration.php" | cut -d'"' -f2)
    DB_USER=$(grep '$db_username' "$HOSTBILL_PATH/configuration.php" | cut -d'"' -f2)
    
    print_success "Databáze: $DB_NAME na $DB_HOST"
    
    # Potvrzení instalace
    echo ""
    print_warning "Instalace bude provedena s následujícími nastaveními:"
    echo "  - HostBill cesta: $HOSTBILL_PATH"
    echo "  - Databáze: $DB_NAME"
    echo "  - Host: $DB_HOST"
    echo ""
    
    read -p "Pokračovat v instalaci? (y/N): " CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        print_info "Instalace zrušena"
        exit 0
    fi
    
    echo ""
}

# Vytvoření zálohy
create_backup() {
    print_info "Vytváření zálohy..."
    
    BACKUP_DIR="$HOSTBILL_PATH/backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Záloha existujících souborů (pokud existují)
    if [ -d "$HOSTBILL_PATH/includes/affiliate" ]; then
        cp -r "$HOSTBILL_PATH/includes/affiliate" "$BACKUP_DIR/"
        print_success "Záloha affiliate složky vytvořena"
    fi
    
    # Záloha databáze
    if command -v mysqldump &> /dev/null; then
        read -s -p "Zadejte heslo pro databázi: " DB_PASS
        echo ""
        
        mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
            --tables tblaffiliatevisits tblaffiliateconversions tblaffiliatestats \
            > "$BACKUP_DIR/affiliate_tables_backup.sql" 2>/dev/null || true
        
        if [ -f "$BACKUP_DIR/affiliate_tables_backup.sql" ]; then
            print_success "Záloha databáze vytvořena"
        else
            print_warning "Záloha databáze se nezdařila (možná tabulky neexistují)"
        fi
    fi
    
    print_success "Záloha uložena do: $BACKUP_DIR"
    echo ""
}

# Instalace souborů
install_files() {
    print_info "Instalace PHP souborů..."
    
    # Vytvoření adresáře
    mkdir -p "$HOSTBILL_PATH/includes/affiliate"
    
    # Kopírování souborů
    cp includes/affiliate/* "$HOSTBILL_PATH/includes/affiliate/"
    
    # Nastavení oprávnění
    chmod 755 "$HOSTBILL_PATH/includes/affiliate"
    chmod 644 "$HOSTBILL_PATH/includes/affiliate"/*.php
    chmod 644 "$HOSTBILL_PATH/includes/affiliate"/*.js
    
    print_success "PHP skripty nainstalovány"
    
    # Kopírování konfigurace
    if [ ! -f "$HOSTBILL_PATH/includes/affiliate_config.php" ]; then
        cp config/affiliate_config.php "$HOSTBILL_PATH/includes/"
        chmod 644 "$HOSTBILL_PATH/includes/affiliate_config.php"
        print_success "Konfigurační soubor nainstalován"
    else
        print_warning "Konfigurační soubor již existuje, přeskakuji"
    fi
    
    echo ""
}

# Instalace databáze
install_database() {
    print_info "Instalace databázových tabulek..."
    
    if [ -z "$DB_PASS" ]; then
        read -s -p "Zadejte heslo pro databázi: " DB_PASS
        echo ""
    fi
    
    # Test připojení
    if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME;" 2>/dev/null; then
        print_success "Připojení k databázi úspěšné"
    else
        print_error "Nelze se připojit k databázi"
        exit 1
    fi
    
    # Spuštění SQL skriptu
    if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < sql/01_create_tables.sql; then
        print_success "Databázové tabulky vytvořeny"
    else
        print_error "Chyba při vytváření tabulek"
        exit 1
    fi
    
    echo ""
}

# Test instalace
test_installation() {
    print_info "Testování instalace..."
    
    # Test existence souborů
    FILES=("$HOSTBILL_PATH/includes/affiliate/api.php" 
           "$HOSTBILL_PATH/includes/affiliate/tracking.js"
           "$HOSTBILL_PATH/includes/affiliate/conversion.php")
    
    for file in "${FILES[@]}"; do
        if [ -f "$file" ]; then
            print_success "Soubor existuje: $(basename $file)"
        else
            print_error "Chybí soubor: $file"
        fi
    done
    
    # Test databázových tabulek
    TABLES=("tblaffiliatevisits" "tblaffiliateconversions" "tblaffiliatestats")
    
    for table in "${TABLES[@]}"; do
        if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "DESCRIBE $table;" &>/dev/null; then
            print_success "Tabulka existuje: $table"
        else
            print_error "Chybí tabulka: $table"
        fi
    done
    
    # Test API endpointu
    API_URL="http://localhost$(echo $HOSTBILL_PATH | sed 's|/var/www||')/includes/affiliate/api.php"
    
    if command -v curl &> /dev/null; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -d '{"action":"test"}' || echo "000")
        
        if [ "$HTTP_CODE" = "400" ]; then
            print_success "API endpoint odpovídá (400 = očekávaná chyba pro test)"
        elif [ "$HTTP_CODE" = "200" ]; then
            print_success "API endpoint odpovídá"
        else
            print_warning "API endpoint neodpovídá správně (HTTP $HTTP_CODE)"
        fi
    else
        print_warning "curl není dostupný, přeskakuji test API"
    fi
    
    echo ""
}

# Vytvoření testovacích dat
create_test_data() {
    print_info "Vytváření testovacích dat..."
    
    # Vytvoření testovacího affiliate
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << EOF
INSERT IGNORE INTO tblaffiliates 
(id, firstname, lastname, email, commission_rate, status, created_date) 
VALUES 
(999, 'Test', 'Affiliate', 'test@example.com', 10.00, 'active', NOW());
EOF
    
    if [ $? -eq 0 ]; then
        print_success "Testovací affiliate vytvořen (ID: 999)"
        print_info "Test URL: http://your-domain.com/vps?aff=999"
    else
        print_warning "Testovací affiliate se nepodařilo vytvořit (možná již existuje)"
    fi
    
    echo ""
}

# Zobrazení dalších kroků
show_next_steps() {
    print_header
    print_success "Instalace dokončena úspěšně!"
    echo ""
    
    print_info "Další kroky:"
    echo "1. Aktivujte Affiliate modul v HostBill Admin:"
    echo "   Admin Panel → Addons → Affiliate System"
    echo ""
    echo "2. Aktualizujte .env.local ve vaší Next.js aplikaci:"
    echo "   NEXT_PUBLIC_HOSTBILL_URL=https://your-hostbill-domain.com"
    echo ""
    echo "3. Otestujte tracking:"
    echo "   http://your-domain.com/vps?aff=999"
    echo ""
    echo "4. Zkontrolujte logy:"
    echo "   tail -f /var/log/apache2/error.log"
    echo ""
    
    print_info "Dokumentace:"
    echo "- Instalační návod: INSTALLATION_GUIDE.md"
    echo "- Řešení problémů: docs/TROUBLESHOOTING.md"
    echo "- API dokumentace: docs/API_DOCUMENTATION.md"
    echo ""
    
    print_info "Podpora:"
    echo "- Email: podpora@systrix.cz"
    echo "- Telefon: +420 123 456 789"
    echo ""
    
    print_success "Affiliate systém je připraven k použití! 🎉"
}

# Hlavní instalační funkce
main() {
    print_header
    
    # Kontrola, že jsme ve správném adresáři
    if [ ! -f "install.sh" ] || [ ! -d "includes" ]; then
        print_error "Spusťte skript z adresáře s affiliate balíčkem"
        exit 1
    fi
    
    check_requirements
    get_configuration
    create_backup
    install_files
    install_database
    test_installation
    create_test_data
    show_next_steps
}

# Spuštění instalace
main "$@"
