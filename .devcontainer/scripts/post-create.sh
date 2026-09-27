#!/bin/bash
set -e

echo "Configurando entorno de desarrollo Condominio..."

export PATH="/usr/local/go/bin:$HOME/.bun/bin:$HOME/.moon/bin:$HOME/go/bin:$PATH"

# Fix git safe directory for containers
git config --global --add safe.directory /workspaces/condominio

# Create .env from example if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env creado desde .env.example"
fi

# Install dependencies
echo "Instalando dependencias..."
bun install

# Generate Prisma client
echo "Generando cliente Prisma..."
bun prisma generate

# Set up the PostgreSQL schema (idempotent, only seeds if the DB is empty)
echo "Preparando la base de datos..."
bash .devcontainer/scripts/bootstrap-db.sh

# Setup git hooks
echo "Configurando git hooks..."
bunx lefthook install

# Setup Go dependencies
echo "Configurando Go..."
cd apps/api
go mod download
cd ../..

# Install moon tools
echo "Instalando toolchains de moon..."
moon sync

echo "Entorno listo!"
echo ""
echo "Para iniciar desarrollo:"
echo "  bun dev              # Todos los servicios"
echo "  moon run panel:dev   # Solo frontend"
echo "  moon run api:serve   # Solo backend"
echo ""
echo "API en http://localhost:8081 · panel en http://localhost:4000 · PostgreSQL en localhost:5432"
