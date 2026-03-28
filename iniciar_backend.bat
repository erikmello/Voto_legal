@echo off
cd /d "%~dp0backend"
set PORT=3001
node src/index.js
