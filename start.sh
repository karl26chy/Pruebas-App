#!/bin/bash

echo "=== Plataforma Educativa - Inicio Rápido ==="
echo ""

echo ">> Deteniendo contenedores existentes (si hay)..."
docker compose down 2>/dev/null

echo ">> Construyendo e iniciando servicios (PostgreSQL + API + Cliente)..."
docker compose up -d --build

echo ""
echo "=== Servicios Iniciados ==="
echo "  Cliente: http://localhost:${CLIENT_PORT:-8080}"
echo "  API:     (interno, vía Nginx en /api)"
echo "  PostgreSQL: volumen persistente (pgdata)"
echo ""
echo "Para ver logs:  docker compose logs -f"
echo "Para detener:   docker compose down"
