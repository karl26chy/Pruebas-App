#!/bin/bash

echo "=== Plataforma Educativa - Inicio Rápido ==="
echo ""

# Start API
echo ">> Iniciando API (json-server) en puerto 5000..."
cd api
npm install -s 2>/dev/null
npm run server &
API_PID=$!
cd ..

sleep 2

# Start Client
echo ">> Iniciando Cliente (Vite) en puerto 5173..."
cd client
npm install -s 2>/dev/null
npm run dev &
CLIENT_PID=$!
cd ..

echo ""
echo "=== Servicios Iniciados ==="
echo "  API:     http://localhost:5000"
echo "  Cliente: http://localhost:5173"
echo ""
echo "Presiona Ctrl+C para detener ambos servicios."

trap "kill $API_PID $CLIENT_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
