@echo off
title EduTrack AI - Servidor Local
cd /d "%~dp0"
echo ====================================================
echo      EduTrack AI - Gestao Academica Inteligente
echo ====================================================
echo.
echo [1/2] Abrindo aplicacao no navegador: http://localhost:8000
start http://localhost:8000
echo.
echo [2/2] Iniciando servidor Python na porta 8000...
echo.
echo ====================================================
echo  Servidor ativo! Deixe esta janela aberta.
echo  Para encerrar, basta fechar esta janela.
echo ====================================================
echo.
py server.py
pause
