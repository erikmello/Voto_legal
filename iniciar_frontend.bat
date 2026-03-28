@echo off
cd /d "%~dp0frontend"
npm.cmd run dev -- --port 5173 --host 0.0.0.0

