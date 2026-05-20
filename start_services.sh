#!/bin/bash

# ==============================================================================
# AI Financial Risk & Compliance Intelligence Assistant
# Launcher script for FastAPI Backend & Vite Frontend
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "======================================================================"
echo "🚀 Starting AI Financial Risk & Compliance Intelligence Assistant..."
echo "======================================================================"

# Check if port 8000 is occupied
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null; then
    echo "⚠️  Port 8000 is occupied. Attempting to stop previous backend server..."
    lsof -Pi :8000 -sTCP:LISTEN -t | xargs kill -9
fi

# Check if port 5173 is occupied
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null; then
    echo "⚠️  Port 5173 is occupied. Attempting to stop previous frontend server..."
    lsof -Pi :5173 -sTCP:LISTEN -t | xargs kill -9
fi

# Start Backend Server
echo "👉 Starting FastAPI Backend Server on http://127.0.0.1:8000..."
cd "$BACKEND_DIR"
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started with PID: $BACKEND_PID"

# Start Frontend Server
echo "👉 Starting Vite React Frontend Server on http://127.0.0.1:5173..."
cd "$FRONTEND_DIR"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started with PID: $FRONTEND_PID"

echo "======================================================================"
echo "📊 Services are initializing!"
echo "   - Frontend Dashboard: http://127.0.0.1:5173"
echo "   - FastAPI Swagger docs: http://127.0.0.1:8000/docs"
echo ""
echo "📝 logs are written to backend.log and frontend.log"
echo "Press Ctrl+C to terminate both servers."
echo "======================================================================"

# Keep running and handle graceful shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down servers gracefully..."
    kill -9 $BACKEND_PID 2>/dev/null
    kill -9 $FRONTEND_PID 2>/dev/null
    echo "👋 Shutdown complete."
    exit 0
}

trap cleanup INT TERM

# Wait for background services
wait
