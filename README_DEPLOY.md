# Catan Island 部署指南

## 🚀 推荐方式：GitHub Actions 自动部署

### 优势

- ✅ **全自动化**：推送代码后自动构建和部署
- ✅ **版本管理**：支持语义化版本标签
- ✅ **CI/CD**：集成测试和构建验证
- ✅ **无需本地 Docker**：在 GitHub 云端构建

### 设置步骤

#### 1. 配置 GitHub Secrets

进入仓库设置页面：
```
https://github.com/Frank-Unlimited/CatanIsland-/settings/secrets/actions
```

添加以下 Secrets：

| Name | Value |
|------|-------|
| `ALIYUN_USERNAME` | `nick1329599640` |
| `ALIYUN_PASSWORD` | `Han9510Han9510` |

详细步骤请查看：[.github/SETUP.md](.github/SETUP.md)

#### 2. 推送代码触发部署

```bash
# 推送到主分支（自动部署 latest 标签）
git add .
git commit -m "Update features"
git push origin main

# 或创建版本标签（自动部署多个标签）
git tag v1.0.0
git push origin v1.0.0
```

#### 3. 查看部署状态

访问 Actions 页面查看部署进度：
```
https://github.com/Frank-Unlimited/CatanIsland-/actions
```

#### 4. 拉取部署的镜像

```bash
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest
```

---

## 备选方式：本地部署

### 方式一：使用自动化脚本

```bash
# 给脚本添加执行权限
chmod +x deploy.sh

# 运行部署脚本（可选指定版本号，默认为 latest）
./deploy.sh v1.0.0

# 或使用默认版本
./deploy.sh
```

脚本会自动完成以下操作：
1. 提交代码到 Git
2. 推送到 GitHub
3. 构建 Docker 镜像
4. 推送到阿里云镜像仓库

---

### 方式二：手动部署

#### 1. 推送代码到 GitHub

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加远程仓库
git remote add origin https://github.com/Frank-Unlimited/CatanIsland-.git

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 推送到 GitHub
git push -u origin main
```

#### 2. 构建 Docker 镜像

```bash
# 构建镜像
docker build -t catan_island:latest .

# 查看镜像
docker images | grep catan_island
```

#### 3. 推送到阿里云镜像仓库

```bash
# 登录阿里云镜像仓库
docker login --username=nick1329599640 --password=Han9510Han9510 \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com

# 标记镜像
docker tag catan_island:latest \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest

# 推送镜像
docker push \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest
```

---

## 本地测试

### 使用 Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 直接运行 Docker 容器

```bash
# 运行容器
docker run -d \
  -p 3000:3000 \
  --name catan-island \
  catan_island:latest

# 查看日志
docker logs -f catan-island

# 停止容器
docker stop catan-island
docker rm catan-island
```

访问 http://localhost:3000 查看应用

---

## 从阿里云拉取镜像

### 公网地址

```bash
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest
```

### VPC 内网地址（更快，不消耗公网流量）

```bash
docker pull crpi-925djdtsud86yqkr-vpc.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest
```

---

## 生产环境部署

### 在服务器上运行

```bash
# 1. 登录阿里云镜像仓库
docker login --username=nick1329599640 --password=Han9510Han9510 \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com

# 2. 拉取最新镜像
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest

# 3. 停止旧容器（如果存在）
docker stop catan-island || true
docker rm catan-island || true

# 4. 运行新容器
docker run -d \
  -p 3000:3000 \
  --name catan-island \
  --restart unless-stopped \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest

# 5. 查看日志
docker logs -f catan-island
```

### 使用 Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket 支持
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 镜像仓库信息

- **仓库名称**: catan_island
- **仓库地域**: 华东1（杭州）
- **仓库类型**: 公开
- **代码仓库**: https://github.com/Frank-Unlimited/CatanIsland-
- **公网地址**: crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island
- **专有网络**: crpi-925djdtsud86yqkr-vpc.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island

---

## 常见问题

### 1. Docker 构建失败

确保已安装 Node.js 18+ 和 Docker

### 2. 推送到 GitHub 失败

检查 Git 配置和 GitHub 访问权限：
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. 推送到阿里云失败

检查登录凭证是否正确，确保密码没有过期

### 4. 容器无法启动

查看日志：
```bash
docker logs catan-island
```

---

## 版本管理

推荐使用语义化版本号：

```bash
# 推送特定版本
./deploy.sh v1.0.0

# 推送开发版本
./deploy.sh dev

# 推送测试版本
./deploy.sh test
```

---

## 监控和维护

```bash
# 查看容器状态
docker ps | grep catan-island

# 查看资源使用
docker stats catan-island

# 进入容器
docker exec -it catan-island sh

# 重启容器
docker restart catan-island
```
