# MeowStock 部署文档

本文档说明如何部署 MeowStock (Next.js) 应用，并配置 Casdoor 认证与 Meow Portal 积分系统。

## 1. 环境准备

- **Node.js**: v18.17.0 或更高版本
- **包管理器**: npm 或 yarn

## 2. 环境变量配置

在项目根目录下创建 `.env` 文件（或者 `.env.local` / `.env.production`）。Next.js 会自动加载 `.env` 文件中的配置。

你可以直接复制示例文件：
```bash
cp .env.example .env
```

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

## 7. 宝塔面板 (Baota) 部署指南

### A. 安装 Node.js 环境
1. 进入宝塔面板 -> **软件商店**。
2. 搜索并安装 **Node.js 版本管理器**。
3. 打开 Node.js 版本管理器，安装 **v18.17.0** 或更高版本的 Stable 版 (推荐 v20)。
4. 确保在“命令行版本”中选择刚刚安装的版本。

### B. 上传代码
1. 将项目打包（排除 `node_modules` 和 `.next`）。
2. 在宝塔面板 -> **文件** 中，上传并解压到网站目录（例如 `/www/wwwroot/meowstock`）。
3. **重要**：上传你本地配置好的 `.env` 文件，或者在宝塔文件管理器中创建一个，并填入环境变量。

### C. 添加 Node 项目
1. 进入宝塔面板 -> **网站** -> **Node项目** -> **添加Node项目**。
2. **项目目录**: 选择 `/www/wwwroot/meowstock`。
3. **启动选项**: `npm run start`。
4. **项目名称**: `meowstock`。
5. **端口**: `3000` (如果被占用请更换，并在 `.env` 或 `package.json` 中适配)。
6. **运行用户**: `www` (推荐)。
7. **Node版本**: 选择之前安装的 v18+。
8. 点击 **提交**。

### D. 安装依赖与构建
_如果你的压缩包没有包含 `node_modules` 和构建产物（推荐方式）：_

1. 在 Node 项目列表中，点击刚刚创建的项目 -> **模块管理** -> **一键安装依赖** (或者点击“终端”手动运行 `npm install`)。
2. 依赖安装完成后，点击 **脚本管理** (或在终端中) 运行构建命令：
   - 脚本名称: `build`
   - 命令: `npm run build`
3. 构建完成后，如果项目没有自动启动，请点击 **重启** 或 **启动**。

### E. 绑定域名 (可选)
1. 在 Node 项目设置中 -> **域名管理**。
2. 添加你的域名 (例如 `stock.ruawd.de`)。
3. 宝塔会自动配置反向代理指向 3000 端口。
4. 建议在 **SSL** 选项卡中申请并开启 Let's Encrypt 免费证书。
