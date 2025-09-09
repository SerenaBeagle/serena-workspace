# 部署指南 - Notion-like Workspace

## 🆓 免费托管服务推荐

### 数据库托管
1. **MongoDB Atlas** (推荐)
   - 免费层：512MB 存储
   - 注册：https://www.mongodb.com/atlas
   - 创建集群后获取连接字符串

2. **Supabase** (PostgreSQL)
   - 免费层：500MB 存储
   - 注册：https://supabase.com

### 后端托管
1. **Railway** (推荐)
   - 免费层：$5/月额度
   - 支持 MongoDB 和 Node.js
   - 注册：https://railway.app

2. **Vercel** (Serverless)
   - 免费层：100GB 带宽
   - 适合 API 函数
   - 注册：https://vercel.com

3. **Render**
   - 免费层：750 小时/月
   - 支持 WebSocket
   - 注册：https://render.com

## 🚀 快速部署步骤

### 1. 设置数据库 (MongoDB Atlas)

1. 访问 https://www.mongodb.com/atlas
2. 创建免费账户
3. 创建新集群 (选择免费层)
4. 创建数据库用户
5. 获取连接字符串，格式：
   ```
   mongodb+srv://username:password@cluster.mongodb.net/notion-workspace?retryWrites=true&w=majority
   ```

### 2. 部署后端 (Railway)

1. 访问 https://railway.app
2. 连接 GitHub 仓库
3. 选择 `backend` 文件夹
4. 添加环境变量：
   ```
   MONGODB_URI=你的MongoDB连接字符串
   JWT_SECRET=你的JWT密钥
   FRONTEND_URL=https://你的前端域名
   NODE_ENV=production
   ```
5. 部署完成后获取后端URL

### 3. 部署前端 (Vercel)

1. 访问 https://vercel.com
2. 连接 GitHub 仓库
3. 选择 `src` 文件夹作为根目录
4. 添加环境变量：
   ```
   REACT_APP_API_URL=https://你的后端URL/api
   REACT_APP_SOCKET_URL=https://你的后端URL
   ```
5. 部署

### 4. 配置 CORS

在后端环境变量中添加：
```
FRONTEND_URL=https://你的前端域名
```

## 🔧 本地开发设置

### 1. 安装后端依赖
```bash
cd backend
npm install
```

### 2. 设置环境变量
创建 `backend/.env` 文件：
```env
MONGODB_URI=mongodb://localhost:27017/notion-workspace
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. 启动后端
```bash
cd backend
npm run dev
```

### 4. 启动前端
```bash
npm run dev
```

## 📊 监控和维护

### 健康检查
- 后端：`GET /api/health`
- 检查数据库连接状态
- 监控内存和CPU使用

### 日志监控
- Railway: 内置日志查看
- Vercel: 函数日志
- MongoDB Atlas: 查询性能

### 备份策略
- MongoDB Atlas 自动备份
- 定期导出数据
- 版本控制代码

## 🔒 安全配置

### 环境变量
- 使用强密码作为 JWT_SECRET
- 定期轮换密钥
- 不要提交 .env 文件到版本控制

### CORS 设置
- 只允许可信域名
- 生产环境禁用通配符

### 速率限制
- 已配置 express-rate-limit
- 可根据需要调整限制

## 🚨 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 MongoDB Atlas 白名单
   - 验证连接字符串
   - 检查网络连接

2. **CORS 错误**
   - 检查 FRONTEND_URL 环境变量
   - 确保域名匹配

3. **WebSocket 连接失败**
   - 检查防火墙设置
   - 验证 Socket.IO 配置

4. **认证失败**
   - 检查 JWT_SECRET
   - 验证 token 格式

### 调试技巧
- 使用浏览器开发者工具
- 检查网络请求
- 查看服务器日志
- 使用 Postman 测试 API

## 📈 性能优化

### 数据库优化
- 添加适当的索引
- 使用分页查询
- 定期清理旧数据

### 前端优化
- 代码分割
- 图片优化
- 缓存策略

### 后端优化
- 连接池配置
- 缓存常用数据
- 压缩响应

## 🔄 更新部署

### 后端更新
1. 推送代码到 GitHub
2. Railway 自动重新部署
3. 检查部署状态

### 前端更新
1. 推送代码到 GitHub
2. Vercel 自动重新部署
3. 清除浏览器缓存

## 📞 支持

如果遇到问题：
1. 检查日志文件
2. 查看错误信息
3. 参考本文档
4. 联系技术支持

---

**注意**: 免费层有使用限制，生产环境建议升级到付费计划以获得更好的性能和可靠性。
