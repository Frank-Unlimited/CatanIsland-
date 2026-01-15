# 🚀 快速开始指南

## 第一次部署（5分钟搞定）

### 步骤 1: 配置 GitHub Secrets（1分钟）

1. 打开：https://github.com/Frank-Unlimited/CatanIsland-/settings/secrets/actions
2. 点击 **New repository secret**
3. 添加两个 Secrets：

```
Name: ALIYUN_USERNAME
Value: nick1329599640

Name: ALIYUN_PASSWORD
Value: Han9510Han9510
```

### 步骤 2: 推送代码（2分钟）

```bash
# 克隆或进入项目目录
cd CatanIsland-

# 添加所有文件
git add .

# 提交
git commit -m "Initial deployment"

# 推送到 GitHub（会自动触发部署）
git push origin main
```

### 步骤 3: 等待部署完成（2分钟）

1. 访问：https://github.com/Frank-Unlimited/CatanIsland-/actions
2. 查看最新的 workflow 运行状态
3. 等待绿色勾号 ✅ 出现

### 步骤 4: 拉取并运行（1分钟）

```bash
# 拉取镜像
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest

# 运行容器
docker run -d -p 3000:3000 --name catan-island \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest

# 访问游戏
# 打开浏览器：http://localhost:3000
```

完成！🎉

---

## 日常更新流程

### 更新代码并自动部署

```bash
# 1. 修改代码
# ... 编辑文件 ...

# 2. 提交并推送
git add .
git commit -m "Add new feature"
git push origin main

# 3. 等待自动部署（约2分钟）
# 访问 https://github.com/Frank-Unlimited/CatanIsland-/actions 查看进度

# 4. 更新服务器上的容器
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest
docker stop catan-island
docker rm catan-island
docker run -d -p 3000:3000 --name catan-island \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest
```

---

## 发布新版本

```bash
# 1. 创建版本标签
git tag v1.0.0

# 2. 推送标签（会自动部署多个版本标签）
git push origin v1.0.0

# 3. 拉取特定版本
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:v1.0.0
```

---

## 常见问题

### Q: 如何查看部署日志？

A: 访问 https://github.com/Frank-Unlimited/CatanIsland-/actions，点击最新的 workflow，查看详细日志。

### Q: 部署失败怎么办？

A: 
1. 检查 GitHub Secrets 是否正确配置
2. 查看 Actions 日志中的错误信息
3. 确保本地代码可以正常构建：`docker build -t test .`

### Q: 如何回滚到之前的版本？

A:
```bash
# 拉取之前的版本
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:v1.0.0

# 运行旧版本
docker run -d -p 3000:3000 --name catan-island \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:v1.0.0
```

### Q: 如何在本地测试？

A:
```bash
# 使用 Docker Compose
docker-compose up -d

# 访问 http://localhost:3000
```

---

## 生产环境部署

### 在服务器上运行

```bash
# 1. 安装 Docker（如果还没有）
curl -fsSL https://get.docker.com | sh

# 2. 拉取最新镜像
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest

# 3. 运行容器
docker run -d \
  -p 3000:3000 \
  --name catan-island \
  --restart unless-stopped \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest

# 4. 查看日志
docker logs -f catan-island
```

### 配置 Nginx 反向代理（可选）

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
    }
}
```

---

## 监控和维护

```bash
# 查看容器状态
docker ps | grep catan-island

# 查看日志
docker logs -f catan-island

# 查看资源使用
docker stats catan-island

# 重启容器
docker restart catan-island

# 停止容器
docker stop catan-island

# 删除容器
docker rm catan-island
```

---

## 需要帮助？

- 📖 详细文档：[README_DEPLOY.md](README_DEPLOY.md)
- 🔧 GitHub Actions 设置：[.github/SETUP.md](.github/SETUP.md)
- 🐛 问题反馈：https://github.com/Frank-Unlimited/CatanIsland-/issues
