# 多阶段构建 Dockerfile for Catan Island

# 阶段1: 构建前端
FROM node:18-alpine AS frontend-builder
WORKDIR /app/fronted
COPY fronted/package*.json ./
RUN npm ci
COPY fronted/ ./
RUN npm run build

# 阶段2: 构建后端
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# 阶段3: 生产环境
FROM node:18-alpine
WORKDIR /app

# 安装生产依赖
COPY backend/package*.json ./
RUN npm ci --only=production

# 复制构建产物
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/fronted/dist ./public/dist
COPY backend/public ./public

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/server.js"]
