#!/bin/bash

# 启动开发环境的脚本

echo "🚀 启动 Notion-like Workspace 开发环境..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend
    npm install
    cd ..
fi

# 检查环境变量文件
if [ ! -f "backend/.env" ]; then
    echo "⚠️  请先配置后端环境变量文件 backend/.env"
    echo "参考 backend/env.example 文件"
    exit 1
fi

# 启动后端服务器
echo "🔧 启动后端服务器..."
cd backend
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端开发服务器
echo "🎨 启动前端开发服务器..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo "✅ 开发环境已启动！"
echo "前端: http://localhost:3000"
echo "后端: http://localhost:5000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '🛑 停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
