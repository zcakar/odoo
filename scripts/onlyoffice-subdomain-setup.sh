#!/bin/bash
#
# OnlyOffice Subdomain SSL Setup Script
# Production Server: smb-hkt.com (91.99.22.41)
# Subdomain: sodooc.smb-hkt.com
#
# Usage: Run this script on the production server after DNS is configured
#

set -e  # Exit on any error

echo "================================"
echo "OnlyOffice HTTPS Subdomain Setup"
echo "================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Step 1: Verify OnlyOffice container is running
echo "Step 1: Checking OnlyOffice container..."
if docker ps | grep -q onlyoffice-documentserver; then
    print_success "OnlyOffice container is running"
else
    print_error "OnlyOffice container is not running!"
    echo "Starting container..."
    docker start onlyoffice-documentserver || {
        print_error "Failed to start OnlyOffice container"
        exit 1
    }
    sleep 10
    print_success "OnlyOffice container started"
fi
echo ""

# Step 2: Check DNS resolution
echo "Step 2: Checking DNS resolution..."
if nslookup onlyoffice.smb-hkt.com | grep -q "91.99.22.41"; then
    print_success "DNS is properly configured"
else
    print_error "DNS not configured yet!"
    echo ""
    echo "Please add this A record in your domain panel:"
    echo "  Type: A"
    echo "  Name: onlyoffice"
    echo "  Value: 91.99.22.41"
    echo "  TTL: 3600"
    echo ""
    echo "Wait 5-30 minutes for DNS propagation, then run this script again."
    exit 1
fi
echo ""

# Step 3: Create Nginx configuration (HTTP only; certbot will add HTTPS)
echo "Step 3: Creating Nginx configuration..."
cat > /etc/nginx/sites-available/sodooc << 'EOF'
# Sodooc (OnlyOffice) Document Server - Reverse Proxy Configuration
upstream sodooc {
    server 127.0.0.1:8080;
}

# HTTP server (certbot will add HTTPS + redirect)
server {
    listen 80;
    listen [::]:80;
    server_name sodooc.smb-hkt.com;

    # Let's Encrypt ACME challenge
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Proxy to OnlyOffice
    location / {
        proxy_pass http://sodooc;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        # Timeouts
        proxy_read_timeout 3600s;
        proxy_connect_timeout 3600s;
        proxy_send_timeout 3600s;

        # Buffering
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
EOF

print_success "Nginx configuration created"
echo ""

# Step 4: Enable site
echo "Step 4: Enabling site..."
ln -sf /etc/nginx/sites-available/sodooc /etc/nginx/sites-enabled/sodooc
print_success "Site enabled"
echo ""

# Step 5: Test Nginx configuration
echo "Step 5: Testing Nginx configuration..."
if nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors!"
    exit 1
fi
echo ""

# Step 6: Check if certbot is installed
echo "Step 6: Checking certbot installation..."
if ! command -v certbot &> /dev/null; then
    print_info "Certbot not found, installing..."
    apt update
    apt install -y certbot python3-certbot-nginx
    print_success "Certbot installed"
else
    print_success "Certbot is already installed"
fi
echo ""

# Step 7: Check firewall ports
echo "Step 7: Checking firewall configuration..."
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        print_info "UFW firewall is active"
        # Ensure ports 80 and 443 are open
        ufw allow 80/tcp
        ufw allow 443/tcp
        print_success "Ports 80 and 443 are allowed"
    fi
fi
echo ""

# Step 8: Obtain SSL certificate
echo "Step 8: Obtaining SSL certificate..."
echo ""
print_info "Certbot will ask you a few questions:"
print_info "  1. Email address (for urgent renewal notifications)"
print_info "  2. Agree to Terms of Service: A"
print_info "  3. Share email with EFF: N (optional)"
print_info "  4. Redirect HTTP to HTTPS: 2 (Yes)"
echo ""
read -p "Press Enter to continue with SSL certificate installation..."

certbot --nginx -d sodooc.smb-hkt.com || {
    print_error "SSL certificate installation failed!"
    echo "Please check the error messages above."
    exit 1
}

print_success "SSL certificate obtained and configured!"
echo ""

# Step 9: Restart Nginx
echo "Step 9: Restarting Nginx..."
systemctl restart nginx
if systemctl is-active --quiet nginx; then
    print_success "Nginx restarted successfully"
else
    print_error "Nginx failed to start!"
    systemctl status nginx
    exit 1
fi
echo ""

# Step 10: Test HTTPS connection
echo "Step 10: Testing HTTPS connection..."
sleep 3
if curl -sSf https://sodooc.smb-hkt.com/healthcheck > /dev/null 2>&1; then
    print_success "HTTPS connection successful!"
    print_success "Sodooc is accessible at: https://sodooc.smb-hkt.com"
else
    print_error "HTTPS connection failed!"
    echo "Testing HTTP connection to container..."
    curl -I http://localhost:8080/healthcheck
fi
echo ""

# Summary
echo "================================"
echo "           SUMMARY"
echo "================================"
echo ""
print_success "Sodooc (OnlyOffice) Subdomain Setup Complete!"
echo ""
echo "Next Steps:"
echo "1. Open Odoo: https://smb-hkt.com"
echo "2. Go to: Settings → General Settings → Sodooc"
echo "3. Update these fields:"
echo "   - Sodooc Docs address: https://sodooc.smb-hkt.com/"
echo "   - ONLYOFFICE Docs secret key: G36qo7JjKtYlBCZqOkXOL4NSCwhIIGjh"
echo "   - JWT Header: Authorization"
echo "   - ONLYOFFICE Docs address for internal requests: https://smb-hkt.com/"
echo "   - Disable certificate verification: UNCHECKED"
echo "4. Click Save"
echo "5. Test by editing a .docx file in Contacts module"
echo ""
echo "SSL Certificate:"
echo "  - Auto-renews every 90 days via certbot"
echo "  - Check renewal: certbot renew --dry-run"
echo ""
print_success "Setup completed successfully! 🎉"
