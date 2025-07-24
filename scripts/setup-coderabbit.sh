#!/bin/bash

# CodeRabbit Setup Script for Urgent Studio
# This script helps setup CodeRabbit for the project

set -e

echo "🤖 Setting up CodeRabbit for Urgent Studio..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "go.mod" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking project structure..."

# Check if required files exist
if [ -f ".coderabbit.yaml" ]; then
    print_success "CodeRabbit configuration file found"
else
    print_error "CodeRabbit configuration file not found"
    exit 1
fi

if [ -f ".github/workflows/coderabbit.yml" ]; then
    print_success "CodeRabbit workflow file found"
else
    print_error "CodeRabbit workflow file not found"
    exit 1
fi

print_status "Validating configuration..."

# Check if GitHub repository is configured
if git remote -v | grep -q "github.com"; then
    REPO_URL=$(git remote get-url origin)
    print_success "GitHub repository detected: $REPO_URL"
else
    print_warning "No GitHub repository detected. CodeRabbit requires GitHub integration."
fi

# Check if there are any existing PRs
PR_COUNT=$(git branch -r | grep -v HEAD | wc -l)
if [ $PR_COUNT -gt 1 ]; then
    print_status "Found $PR_COUNT remote branches"
else
    print_warning "No remote branches found. Create a PR to test CodeRabbit."
fi

echo ""
echo "📋 Next Steps:"
echo "1. Go to https://coderabbit.ai/"
echo "2. Sign in with your GitHub account"
echo "3. Select this repository: $(basename $(git remote get-url origin) .git)"
echo "4. Enable CodeRabbit for the repository"
echo "5. Create a Pull Request to test the integration"

echo ""
echo "🔧 Configuration Details:"
echo "- Config file: .coderabbit.yaml"
echo "- Workflow file: .github/workflows/coderabbit.yml"
echo "- Supported languages: TypeScript, JavaScript, Go, SQL"
echo "- Review focus: Security, Performance, Best Practices"

echo ""
echo "💡 Tips:"
echo "- CodeRabbit will automatically review all new PRs"
echo "- Reviews include security checks and performance suggestions"
echo "- Configuration is optimized for Urgent Studio's tech stack"
echo "- Free tier includes basic reviews, pro tier has advanced features"

echo ""
print_success "CodeRabbit setup completed! 🎉"
print_status "Create a PR to see CodeRabbit in action."