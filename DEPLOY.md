# MeowStock 部署文档

本文档说明如何部署 MeowStock (Next.js) 应用，并配置 Casdoor 认证与 Meow Portal 积分系统。

## 1. 环境准备

- **Node.js**: v18.17.0 或更高版本
- **包管理器**: npm 或 yarn

## 2. 环境变量配置

在项目根目录下创建 `.env.local` (开发) 或 `.env.production` (生产) 文件。

```env
# --- Casdoor 配置 ---
# Casdoor 服务地址
CASDOOR_ENDPOINT=https://casdoor.ruawd.de

# 应用 Client ID (从 Casdoor后台应用详情获取)
CASDOOR_CLIENT_ID=<YOUR_CLIENT_ID>

# 应用 Client Secret (从 Casdoor后台应用详情获取)
CASDOOR_CLIENT_SECRET=<YOUR_CLIENT_SECRET>

# Casdoor 公钥文件路径 (相对于项目根目录，或使用绝对路径)
# 也可以直接填内容，但通常建议放文件路径
CASDOOR_CERTIFICATE=./cert.pem

# 组织名称
CASDOOR_ORG_NAME=meow

# 应用名称 (Casdoor中注册的 App Name)
CASDOOR_APP_NAME=chinastock

# 回调 URL (必须与 Casdoor 后台配置的一致)
# 开发环境: http://localhost:3000/api/auth/callback
# 生产环境: https://Your-Domain.com/api/auth/callback
CASDOOR_REDIRECT_URI=https://stock.ruawd.de/api/auth/callback

# --- Meow Portal 配置 ---
# Meow Portal API 地址
PORTAL_URL=https://meow-portal.ruawd.de

# Portal API Key (用于后端通信，可选，如果 API 需要鉴权则必填)
PORTAL_API_KEY=<YOUR_API_KEY>

# --- Session 安全配置 ---
# Cookie 加密密钥 (至少 32 个字符)
# 可以使用 `openssl rand -base64 32` 生成
SECRET_COOKIE_PASSWORD=complex_password_at_least_32_characters_long_and_secure
```

## 3. 安装依赖

```bash
npm install
```

## 4. 构建项目

```bash
npm run build
```

构建成功后，控制台应显示 `Build Completed`。

## 5. 启动服务

### 使用 npm 启动
```bash
npm start
```
默认运行在 `3000` 端口。

### 使用 PM2 启动 (推荐)

如果使用 PM2 进行进程管理：

```bash
# 启动
pm2 start npm --name "meowstock" -- start

# 或者使用 ecosystem.config.js (如果在此时创建)
# pm2 start ecosystem.config.js
```

## 6. 常见问题

- **Redirect URI Mismatch**: 确保 `.env` 中的 `CASDOOR_REDIRECT_URI` 与 Casdoor 后台应用配置的 `Redirect URLs` 完全一致。
- **Login Failed**: 检查 `CASDOOR_CLIENT_ID` 和 `CASDOOR_CLIENT_SECRET` 是否正确。
- **Meow Coin 不显示**: 检查 `PORTAL_URL` 是否可达，以及该用户在 Portal 中是否存在积分数据。
