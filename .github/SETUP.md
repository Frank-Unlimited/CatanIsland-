# GitHub Actions 设置指南

## 📋 前置要求

在使用 GitHub Actions 自动部署之前，需要在 GitHub 仓库中配置以下 Secrets。

## 🔐 配置 GitHub Secrets

### 步骤 1: 进入仓库设置

1. 打开你的 GitHub 仓库：https://github.com/Frank-Unlimited/CatanIsland-
2. 点击 **Settings**（设置）
3. 在左侧菜单中找到 **Secrets and variables** → **Actions**
4. 点击 **New repository secret**（新建仓库密钥）

### 步骤 2: 添加阿里云凭证

需要添加以下两个 Secrets：

#### Secret 1: ALIYUN_USERNAME

- **Name**: `ALIYUN_USERNAME`
- **Value**: `nick1329599640`

#### Secret 2: ALIYUN_PASSWORD

- **Name**: `ALIYUN_PASSWORD`
- **Value**: `Han9510Han9510`

### 步骤 3: 验证配置

添加完成后，你应该能在 Secrets 列表中看到：

- ✅ ALIYUN_USERNAME
- ✅ ALIYUN_PASSWORD

## 🚀 触发自动部署

配置完成后，以下操作会自动触发部署：

### 1. 推送到主分支

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### 2. 创建版本标签

```bash
# 创建版本标签
git tag v1.0.0
git push origin v1.0.0

# 这会生成以下镜像标签：
# - v1.0.0
# - 1.0
# - 1
# - latest
```

### 3. 创建 Pull Request

创建 PR 时会运行测试，但不会推送镜像。

## 📊 查看部署状态

### 方法 1: Actions 页面

1. 进入仓库的 **Actions** 标签页
2. 查看最新的 workflow 运行状态
3. 点击具体的 workflow 查看详细日志

### 方法 2: 提交页面

在每个 commit 旁边会显示状态图标：
- ✅ 绿色勾：部署成功
- ❌ 红色叉：部署失败
- 🟡 黄色圆：正在部署

## 🎯 Workflow 说明

### deploy.yml - 构建和部署

**触发条件：**
- 推送到 `main` 或 `master` 分支
- 推送版本标签（如 `v1.0.0`）
- 创建 Pull Request

**执行步骤：**
1. ✅ 检出代码
2. ✅ 设置 Docker Buildx
3. ✅ 登录阿里云镜像仓库
4. ✅ 提取镜像元数据（标签、标签）
5. ✅ 构建并推送 Docker 镜像
6. ✅ 显示部署摘要

**生成的镜像标签：**
- `latest` - 最新的主分支版本
- `main` 或 `master` - 分支名称
- `v1.0.0` - 版本号（如果推送了标签）
- `1.0` - 主版本号.次版本号
- `1` - 主版本号
- `main-abc1234` - 分支名-commit SHA

### test.yml - 测试和构建验证

**触发条件：**
- 推送到 `main`、`master` 或 `develop` 分支
- 创建 Pull Request

**执行步骤：**
1. ✅ 测试前端构建
2. ✅ 测试后端构建
3. ✅ 测试 Docker 镜像构建（不推送）

## 🔍 常见问题

### 1. 部署失败：认证错误

**错误信息：**
```
Error: Cannot perform an interactive login from a non TTY device
```

**解决方案：**
- 检查 `ALIYUN_USERNAME` 和 `ALIYUN_PASSWORD` 是否正确配置
- 确保密码没有过期

### 2. 构建失败：依赖安装错误

**解决方案：**
- 检查 `package.json` 和 `package-lock.json` 是否同步
- 在本地运行 `npm ci` 测试

### 3. 推送失败：镜像仓库权限

**解决方案：**
- 确认阿里云镜像仓库是公开的
- 检查账号是否有推送权限

## 📦 拉取部署的镜像

部署成功后，可以使用以下命令拉取镜像：

```bash
# 拉取最新版本
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest

# 拉取特定版本
docker pull crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:v1.0.0

# 运行容器
docker run -d -p 3000:3000 --name catan-island \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/catan_island:latest
```

## 🎨 自定义 Workflow

如果需要修改 workflow，编辑以下文件：

- `.github/workflows/deploy.yml` - 部署配置
- `.github/workflows/test.yml` - 测试配置

修改后推送到仓库即可生效。

## 📝 版本发布流程

推荐的版本发布流程：

```bash
# 1. 更新版本号（可选）
# 编辑 package.json 中的 version 字段

# 2. 提交更改
git add .
git commit -m "Release v1.0.0"

# 3. 创建标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 4. 推送代码和标签
git push origin main
git push origin v1.0.0

# 5. 等待 GitHub Actions 自动部署
# 访问 https://github.com/Frank-Unlimited/CatanIsland-/actions 查看进度
```

## 🎯 下一步

1. ✅ 配置 GitHub Secrets
2. ✅ 推送代码到 GitHub
3. ✅ 查看 Actions 页面确认部署成功
4. ✅ 拉取镜像并运行

完成！🎉
