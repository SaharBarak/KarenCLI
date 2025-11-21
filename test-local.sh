#!/bin/bash

# Karen CLI Local Testing Script

set -e

echo "🧪 Starting Karen CLI Local Tests..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $1${NC}"
  else
    echo -e "${RED}✗ $1${NC}"
    exit 1
  fi
}

# Test 1: Install dependencies
echo "📦 Installing dependencies..."
pnpm install
print_status "Dependencies installed"

# Test 2: Build karen-cli
echo ""
echo "🔨 Building karen-cli..."
cd packages/karen-cli
pnpm build
print_status "karen-cli built successfully"

# Test 3: Run CLI unit tests
echo ""
echo "🧪 Running karen-cli unit tests..."
pnpm test
print_status "karen-cli unit tests passed"

# Test 4: Test CLI command (without actual browser)
echo ""
echo "📝 Testing CLI command structure..."
node dist/cli.js --help > /dev/null 2>&1
print_status "CLI command works"

# Test 5: Build karen-backend
echo ""
echo "🔨 Building karen-backend..."
cd ../../packages/karen-backend
pnpm build
print_status "karen-backend built successfully"

# Test 6: Run backend unit tests
echo ""
echo "🧪 Running karen-backend unit tests..."
pnpm test
print_status "karen-backend unit tests passed"

# Test 7: Check TypeScript compilation
echo ""
echo "📘 Checking TypeScript compilation..."
cd ../..
pnpm build
print_status "All packages compile successfully"

# Test 8: Verify Docker builds (optional)
if command -v docker &> /dev/null; then
  echo ""
  echo "🐳 Testing Docker build..."
  cd packages/karen-cli
  docker build -t karen-cli-test . > /dev/null 2>&1
  print_status "Docker image builds successfully"
else
  echo -e "${YELLOW}⚠ Docker not found, skipping Docker tests${NC}"
fi

echo ""
echo -e "${GREEN}✨ All tests passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Set up .env file in packages/karen-backend"
echo "2. Run 'cd packages/karen-backend && pnpm dev' to start backend"
echo "3. Test with real website: 'cd packages/karen-cli && pnpm karen audit https://example.com'"
