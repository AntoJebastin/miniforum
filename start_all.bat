@echo off
echo ========================================================
echo   Launching MiniForum Full-Stack App
echo   - Backend: http://127.0.0.1:5000
echo   - Frontend: http://localhost:5173
echo ========================================================
start "MiniForum Backend (Flask)" cmd /k "cd backend && python app.py"
start "MiniForum Frontend (Vite)" cmd /k "cd frontend && npm run dev"
echo Both servers started in separate terminal windows!
