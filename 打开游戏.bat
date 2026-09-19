@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在打开月球探险家（2D 主界面）…
start "" "http://127.0.0.1:18765/index.html"
python -m http.server 18765 --bind 127.0.0.1
if errorlevel 1 (
  echo 未找到 python，改为直接打开本地页面。
  start "" "%~dp0index.html"
  pause
)
