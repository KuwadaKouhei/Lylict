@echo off
echo Starting w2v_associateAPI server on port 8080...

:: APIサーバーのパスに移動
cd /d "D:\training\w2v_associateAPI"

:: Pythonの仮想環境がある場合は有効化
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call .venv\Scripts\activate.bat
)

:: 環境変数を設定
set PORT=8080

:: Pythonサーバーを起動（一般的なAPIサーバーのファイル名を試行）
if exist "app.py" (
    echo Starting FastAPI app on port 8080...
    python app.py
) else if exist "main.py" (
    echo Starting Python server on port 8080...
    python main.py
) else if exist "server.py" (
    echo Starting Python server on port 8080...
    python server.py
) else if exist "api.py" (
    echo Starting API server on port 8080...
    python api.py
) else (
    echo Error: Could not find API server file (app.py, main.py, server.py, or api.py)
    echo Please check the D:\training\w2v_associateAPI directory
    pause
)
