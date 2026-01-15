# GitHub Actions 配置说明

本目录包含 Catan Island 项目的 CI/CD 配置文件。

## 📁 文件结构

```
.github/
├── workflows/
│   ├── deploy.yml    # 构建和部署到阿里云
│   └── test.yml      # 测试和构建验证
├── SETUP.md          # GitHub Actions 设置指南
└── README.md         # 本文件
```

## 🔄 Workflows

### 1. deploy.yml - 构建和部署

**触发条件：**
- 推送到 `main` 或 `master` 分支
- 推送版本标签（如 `v1.0.0`）
- 创建 Pull Request（仅测试，不部署）

**功能：**
- 构建 Docker 镜像
- 推送到阿里云容器镜像服务
- 生成多个镜像标签（latest, 版本号, 分支名等）

**生成的镜像标签示例：**
```
crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest
crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:main
crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:v1.0.0
crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:1.0
crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:1
```

### 2. test.yml - 测试和构建验证

**触发条件：**
- 推送到 `main`、`master` 或 `develop` 分支
- 创建 Pull Request

**功能：**
- 测试前端构建
- 测试后端构建
- 验证 Docker 镜像构建（不推送）
- 上传构建产物

## 🔐 必需的 Secrets

在使用 GitHub Actions 之前，需要配置以下 Secrets：

| Secret Name | Description | Value |
|-------------|-------------|-------|
| `ALIYUN_USERNAME` | 阿里云镜像仓库用户名 | `nick1329599640` |
| `ALIYUN_PASSWORD` | 阿里云镜像仓库密码 | `Han9510Han9510` |

**配置方法：**
1. 进入仓库的 Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. 添加上述两个 Secrets

详细步骤请查看 [SETUP.md](SETUP.md)

## 🎯 使用示例

### 部署到生产环境

```bash
# 方式 1: 推送到主分支
git add .
git commit -m "Deploy to production"
git push origin main

# 方式 2: 创建版本标签
git tag v1.0.0
git push origin v1.0.0
```

### 测试构建

```bash
# 创建 Pull Request 会自动运行测试
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
# 然后在 GitHub 上创建 PR
```

## 📊 查看部署状态

### 在 GitHub 上查看

1. 访问 [Actions 页面](https://github.com/Frank-Unlimited/CatanIsland-/actions)
2. 查看最新的 workflow 运行状态
3. 点击具体的 workflow 查看详细日志

### 在提交历史中查看

每个 commit 旁边会显示状态图标：
- ✅ 绿色勾：成功
- ❌ 红色叉：失败
- 🟡 黄色圆：进行中

## 🔧 自定义配置

### 修改镜像仓库

编辑 `deploy.yml` 中的环境变量：

```yaml
env:
  ALIYUN_REGISTRY: your-registry.aliyuncs.com
  ALIYUN_NAMESPACE: your-namespace
  IMAGE_NAME: your-image-name
```

### 添加更多触发条件

在 `deploy.yml` 的 `on` 部分添加：

```yaml
on:
  push:
    branches:
      - main
      - develop  # 添加 develop 分支
  schedule:
    - cron: '0 0 * * 0'  # 每周日自动构建
```

### 添加测试步骤

在 `test.yml` 中添加测试命令：

```yaml
- name: Run tests
  working-directory: ./fronted
  run: npm test
```

## 🐛 故障排查

### 构建失败

1. 查看 Actions 日志中的错误信息
2. 在本地运行 `docker build -t test .` 测试
3. 检查 `package.json` 和依赖是否正确

### 推送失败

1. 验证 Secrets 是否正确配置
2. 检查阿里云镜像仓库权限
3. 确认镜像仓库地址是否正确

### 认证失败

1. 检查 `ALIYUN_USERNAME` 和 `ALIYUN_PASSWORD`
2. 确认密码没有过期
3. 尝试在本地手动登录测试

## 📚 相关文档

- [快速开始指南](../QUICKSTART.md)
- [完整部署文档](../README_DEPLOY.md)
- [GitHub Actions 设置](SETUP.md)
- [项目 README](../README.md)

## 🤝 贡献

如果你想改进 CI/CD 配置，欢迎提交 Pull Request！

## 📝 更新日志

- **2024-01**: 初始版本，支持自动构建和部署到阿里云
