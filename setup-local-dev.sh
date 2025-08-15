#!/bin/bash

# Teachinspire Prompt Builder - Local Development Setup Script
# This script sets up the complete local development environment

set -e  # Exit on any error

echo "🚀 Setting up Teachinspire Prompt Builder for Local Development..."
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if Node.js is installed
print_step "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first:"
    echo "   https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) is installed"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm $(npm -v) is available"

# Install Wrangler CLI if not present
print_step "Checking Wrangler CLI..."
if ! command -v wrangler &> /dev/null; then
    print_step "Installing Wrangler CLI globally..."
    npm install -g wrangler
    print_success "Wrangler CLI installed"
else
    print_success "Wrangler CLI is already installed ($(wrangler --version))"
fi

# Install project dependencies
print_step "Installing project dependencies..."
npm install
print_success "Dependencies installed"

# Check if user is logged in to Cloudflare
print_step "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    print_warning "You are not logged in to Cloudflare."
    echo ""
    echo "Please run the following command and follow the authentication process:"
    echo "   wrangler login"
    echo ""
    read -p "Press Enter after you have completed the login process..."
fi

# Verify authentication
if wrangler whoami &> /dev/null; then
    CLOUDFLARE_USER=$(wrangler whoami 2>/dev/null | head -n 1 || echo "Unknown")
    print_success "Authenticated with Cloudflare as: $CLOUDFLARE_USER"
else
    print_error "Authentication failed. Please run 'wrangler login' and try again."
    exit 1
fi

# Update wrangler.toml for local development
print_step "Configuring wrangler.toml for local development..."
cp wrangler.toml wrangler.toml.backup

# Update environment to development
sed -i.tmp 's/ENVIRONMENT = "production"/ENVIRONMENT = "development"/' wrangler.toml
# Update allowed origins for local development
sed -i.tmp 's|ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"|ALLOWED_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8788,http://127.0.0.1:8788"|' wrangler.toml
# Clean up temp file
rm -f wrangler.toml.tmp

print_success "wrangler.toml configured for local development"

# Create or update local D1 database
print_step "Setting up local D1 database..."

# Check if we need to create a local database
DB_LIST=$(wrangler d1 list 2>/dev/null || echo "")
if echo "$DB_LIST" | grep -q "teachinspire-prompt-builder-db"; then
    print_success "Production database exists"
else
    print_step "Creating D1 database..."
    DB_OUTPUT=$(wrangler d1 create teachinspire-prompt-builder-db)
    print_success "Database created"
fi

# Setup local database with migrations
print_step "Running database migrations..."
if [ -f "database/migrations/001_initial_schema.sql" ]; then
    wrangler d1 execute teachinspire-prompt-builder-db --local --file=database/migrations/001_initial_schema.sql
    print_success "Initial schema migration completed"
fi

if [ -f "database/migrations/002_security_enhancements.sql" ]; then
    wrangler d1 execute teachinspire-prompt-builder-db --local --file=database/migrations/002_security_enhancements.sql
    print_success "Security enhancements migration completed"
fi

if [ -f "database/migrations/003_password_reset_tokens.sql" ]; then
    wrangler d1 execute teachinspire-prompt-builder-db --local --file=database/migrations/003_password_reset_tokens.sql
    print_success "Password reset tokens migration completed"
fi

# Set up environment secrets
print_step "Setting up environment secrets..."

echo ""
print_warning "You need to set up the following secrets for local development:"
echo ""

# JWT_SECRET
echo "1. JWT_SECRET (required for authentication)"
echo "   Generate a secure random string for JWT token signing"
read -p "   Enter JWT_SECRET (or press Enter to generate one): " jwt_secret

if [ -z "$jwt_secret" ]; then
    # Generate a random JWT secret
    if command -v openssl &> /dev/null; then
        jwt_secret=$(openssl rand -base64 32)
        print_success "Generated JWT_SECRET: $jwt_secret"
    else
        jwt_secret="your-super-secret-jwt-key-$(date +%s)"
        print_warning "OpenSSL not found. Using basic JWT_SECRET: $jwt_secret"
    fi
fi

echo "$jwt_secret" | wrangler secret put JWT_SECRET --local
print_success "JWT_SECRET configured locally"

# OPENROUTER_API_KEY (OpenRouter)
echo ""
echo "2. OPENROUTER_API_KEY (OpenRouter API Key)"
echo "   Get your API key from: https://openrouter.ai/"
read -p "   Enter your OpenRouter API_KEY: " api_key

if [ -n "$api_key" ]; then
    echo "$api_key" | wrangler secret put OPENROUTER_API_KEY --local
    print_success "OPENROUTER_API_KEY configured locally"
else
    print_warning "OPENROUTER_API_KEY not set. You'll need to set it later for prompt generation to work."
fi

# RESEND_API_KEY (Optional for password reset emails)
echo ""
echo "3. RESEND_API_KEY (optional, for password reset emails)"
echo "   Get your API key from: https://resend.com/"
read -p "   Enter RESEND_API_KEY (optional, press Enter to skip): " resend_key

if [ -n "$resend_key" ]; then
    echo "$resend_key" | wrangler secret put RESEND_API_KEY --local
    print_success "RESEND_API_KEY configured locally"
else
    print_warning "RESEND_API_KEY not set. Password reset emails will not work."
fi

# Create development start script
print_step "Creating development start script..."
cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Teachinspire Prompt Builder in Development Mode..."
echo ""
echo "Frontend will be available at: http://localhost:8788"
echo "API endpoints will be available at: http://localhost:8788/api/*"
echo ""
echo "Press Ctrl+C to stop the development server"
echo ""

# Start the development server with local D1 database
wrangler pages dev --local --d1=DB=teachinspire-prompt-builder-db
EOF

chmod +x start-dev.sh
print_success "Development start script created"

# Create a .env.example file for reference
print_step "Creating .env.example file..."
cat > .env.example << 'EOF'
# Teachinspire Prompt Builder - Environment Variables Reference
# 
# These variables are managed via Wrangler secrets for Cloudflare Workers
# Use the following commands to set them:

# JWT_SECRET - Required for authentication
# wrangler secret put JWT_SECRET

# API_KEY - Required for Google Gemini API
# wrangler secret put API_KEY

# RESEND_API_KEY - Optional for password reset emails  
# wrangler secret put RESEND_API_KEY

# For local development, use:
# wrangler secret put JWT_SECRET --local
# wrangler secret put API_KEY --local
# wrangler secret put RESEND_API_KEY --local
EOF

print_success ".env.example created"

# Final setup summary
echo ""
echo "🎉 Setup Complete!"
echo ""
print_success "Local development environment is ready!"
echo ""
echo "📋 What was set up:"
echo "   • Node.js dependencies installed"
echo "   • Wrangler CLI configured"
echo "   • Local D1 database created and migrated"
echo "   • Environment secrets configured"
echo "   • Development configuration applied"
echo ""
echo "🚀 To start development:"
echo "   ./start-dev.sh"
echo ""
echo "📖 Useful commands:"
echo "   • Start dev server: ./start-dev.sh"
echo "   • View logs: wrangler tail"
echo "   • Database queries: wrangler d1 execute teachinspire-prompt-builder-db --local --command='SELECT * FROM users LIMIT 5;'"
echo "   • Reset database: wrangler d1 execute teachinspire-prompt-builder-db --local --file=database/migrations/001_initial_schema.sql"
echo ""
echo "🔧 Configuration files:"
echo "   • wrangler.toml - Cloudflare configuration"
echo "   • wrangler.toml.backup - Original configuration backup"
echo "   • .env.example - Environment variables reference"
echo ""
print_warning "Make sure to get your OpenRouter API key from https://openrouter.ai/ for prompt generation to work."
echo ""