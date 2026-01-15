@echo off
REM Catan Island 部署脚本 (Windows)
REM 用于推送代码到 GitHub 和阿里云镜像仓库

setlocal enabledelayedexpansion

echo ==========================================
echo Catan Island 部署脚本 (Windows)
echo ==========================================

REM 配置
set GITHUB_REPO=https://github.com/Frank-Unlimited/CatanIsland-.git
set ALIYUN_REGISTRY=crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com
set ALIYUN_NAMESPACE=hhc510105200301150090
set IMAGE_NAME=catan_island
set ALIYUN_USERNAME=nick1329599640
set ALIYUN_PASSWORD=Han9510Han9510

if "%1"=="" (
    set VERSION=latest
) else (
    set VERSION=%1
)

echo.
echo 步骤 1: 检查 Git 状态
echo ----------------------------------------
git status

echo.
echo 步骤 2: 添加所有更改到 Git
echo ----------------------------------------
git add .

echo.
set /p COMMIT_MESSAGE="请输入提交信息: "
if "!COMMIT_MESSAGE!"=="" (
    for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (set mydate=%%a-%%b-%%c)
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set mytime=%%a:%%b)
    set COMMIT_MESSAGE=Update: !mydate! !mytime!
)

git commit -m "!COMMIT_MESSAGE!" || echo 没有需要提交的更改

echo.
echo 步骤 3: 推送到 GitHub
echo ----------------------------------------
REM 检查是否已经添加了远程仓库
git remote | findstr "origin" >nul
if errorlevel 1 (
    echo 添加 GitHub 远程仓库...
    git remote add origin %GITHUB_REPO%
)

git push -u origin main || git push -u origin master

echo.
echo 步骤 4: 构建 Docker 镜像
echo ----------------------------------------
docker build -t %IMAGE_NAME%:%VERSION% .

echo.
echo 步骤 5: 登录阿里云镜像仓库
echo ----------------------------------------
echo 使用用户名: %ALIYUN_USERNAME%
docker login --username=%ALIYUN_USERNAME% --password=%ALIYUN_PASSWORD% %ALIYUN_REGISTRY%

echo.
echo 步骤 6: 标记镜像
echo ----------------------------------------
docker tag %IMAGE_NAME%:%VERSION% %ALIYUN_REGISTRY%/%ALIYUN_NAMESPACE%/%IMAGE_NAME%:%VERSION%
docker tag %IMAGE_NAME%:%VERSION% %ALIYUN_REGISTRY%/%ALIYUN_NAMESPACE%/%IMAGE_NAME%:latest

echo.
echo 步骤 7: 推送镜像到阿里云
echo ----------------------------------------
docker push %ALIYUN_REGISTRY%/%ALIYUN_NAMESPACE%/%IMAGE_NAME%:%VERSION%
docker push %ALIYUN_REGISTRY%/%ALIYUN_NAMESPACE%/%IMAGE_NAME%:latest

echo.
echo ==========================================
echo 部署完成！
echo ==========================================
echo GitHub 仓库: %GITHUB_REPO%
echo 镜像地址: %ALIYUN_REGISTRY%/%ALIYUN_NAMESPACE%/%IMAGE_NAME%:%VERSION%
echo.
echo 拉取镜像命令:
echo docker pull %ALIYUN_REGISTRY%/%ALIYUN_NAMESPACE%/%IMAGE_NAME%:%VERSION%
echo.
echo 运行容器命令:
echo docker run -d -p 3000:3000 --name catan-island %ALIYUN_REGISTRY%/%ALIYUN_NAMESPACE%/%IMAGE_NAME%:%VERSION%
echo ==========================================

pause
