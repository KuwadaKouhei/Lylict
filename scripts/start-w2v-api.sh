#!/bin/bash

# w2v_associateAPIを起動するスクリプト
echo "Starting w2v_associateAPI server on port 8080..."

# APIサーバーのパスに移動
cd "D:/training/w2v_associateAPI"

# Pythonの仮想環境がある場合は有効化（存在する場合）
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
elif [ -d ".venv" ]; then
    echo "Activating virtual environment..."
    source .venv/bin/activate
fi

# 環境変数を設定
export PORT=8080

# Pythonサーバーを起動（一般的なAPIサーバーのファイル名を試行）
if [ -f "app.py" ]; then
    echo "Starting FastAPI app on port 8080..."
    python app.py
elif [ -f "main.py" ]; then
    echo "Starting Python server on port 8080..."
    python main.py
elif [ -f "server.py" ]; then
    echo "Starting Python server on port 8080..."
    python server.py
elif [ -f "api.py" ]; then
    echo "Starting API server on port 8080..."
    python api.py
else
    echo "Error: Could not find API server file (app.py, main.py, server.py, or api.py)"
    echo "Please check the D:/training/w2v_associateAPI directory"
fi
