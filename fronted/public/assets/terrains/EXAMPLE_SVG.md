# SVG 示例占位符

如果你想快速测试，可以使用以下 SVG 代码创建简单的占位符图片。

## 如何使用 SVG

1. 复制下面的 SVG 代码
2. 保存为对应的 `.svg` 文件（例如 `forest.svg`）
3. 使用在线工具转换为 PNG：
   - https://cloudconvert.com/svg-to-png
   - https://svgtopng.com/
4. 或者直接将 `.svg` 文件重命名为 `.png`（某些浏览器支持）

## 森林 (forest.svg)

```svg
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <rect width="200" height="200" fill="#166534"/>
  
  <!-- 树木 -->
  <circle cx="50" cy="50" r="20" fill="#14532d" opacity="0.8"/>
  <circle cx="150" cy="50" r="20" fill="#14532d" opacity="0.8"/>
  <circle cx="100" cy="100" r="25" fill="#14532d" opacity="0.8"/>
  <circle cx="50" cy="150" r="20" fill="#14532d" opacity="0.8"/>
  <circle cx="150" cy="150" r="20" fill="#14532d" opacity="0.8"/>
  
  <!-- 树冠高光 -->
  <circle cx="50" cy="50" r="15" fill="#22c55e" opacity="0.5"/>
  <circle cx="150" cy="50" r="15" fill="#22c55e" opacity="0.5"/>
  <circle cx="100" cy="100" r="18" fill="#22c55e" opacity="0.5"/>
</svg>
```

## 丘陵 (hills.svg)

```svg
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <rect width="200" height="200" fill="#dc2626"/>
  
  <!-- 砖块图案 -->
  <rect x="10" y="10" width="80" height="30" fill="#991b1b" opacity="0.6"/>
  <rect x="110" y="10" width="80" height="30" fill="#991b1b" opacity="0.6"/>
  <rect x="10" y="50" width="80" height="30" fill="#7f1d1d" opacity="0.6"/>
  <rect x="110" y="50" width="80" height="30" fill="#7f1d1d" opacity="0.6"/>
  <rect x="10" y="90" width="80" height="30" fill="#991b1b" opacity="0.6"/>
  <rect x="110" y="90" width="80" height="30" fill="#991b1b" opacity="0.6"/>
  <rect x="10" y="130" width="80" height="30" fill="#7f1d1d" opacity="0.6"/>
  <rect x="110" y="130" width="80" height="30" fill="#7f1d1d" opacity="0.6"/>
  <rect x="10" y="170" width="80" height="30" fill="#991b1b" opacity="0.6"/>
  <rect x="110" y="170" width="80" height="30" fill="#991b1b" opacity="0.6"/>
</svg>
```

## 草原 (pasture.svg)

```svg
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <rect width="200" height="200" fill="#22c55e"/>
  
  <!-- 羊群 -->
  <ellipse cx="50" cy="60" rx="15" ry="12" fill="#ffffff" opacity="0.9"/>
  <circle cx="45" cy="55" r="8" fill="#ffffff" opacity="0.9"/>
  
  <ellipse cx="150" cy="80" rx="15" ry="12" fill="#ffffff" opacity="0.9"/>
  <circle cx="145" cy="75" r="8" fill="#ffffff" opacity="0.9"/>
  
  <ellipse cx="100" cy="140" rx="15" ry="12" fill="#ffffff" opacity="0.9"/>
  <circle cx="95" cy="135" r="8" fill="#ffffff" opacity="0.9"/>
  
  <!-- 草地纹理 -->
  <line x1="20" y1="120" x2="20" y2="140" stroke="#15803d" stroke-width="2" opacity="0.5"/>
  <line x1="40" y1="110" x2="40" y2="130" stroke="#15803d" stroke-width="2" opacity="0.5"/>
  <line x1="170" y1="130" x2="170" y2="150" stroke="#15803d" stroke-width="2" opacity="0.5"/>
</svg>
```

## 田野 (fields.svg)

```svg
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <rect width="200" height="200" fill="#eab308"/>
  
  <!-- 田垄 -->
  <rect x="0" y="20" width="200" height="15" fill="#ca8a04" opacity="0.5"/>
  <rect x="0" y="50" width="200" height="15" fill="#a16207" opacity="0.5"/>
  <rect x="0" y="80" width="200" height="15" fill="#ca8a04" opacity="0.5"/>
  <rect x="0" y="110" width="200" height="15" fill="#a16207" opacity="0.5"/>
  <rect x="0" y="140" width="200" height="15" fill="#ca8a04" opacity="0.5"/>
  <rect x="0" y="170" width="200" height="15" fill="#a16207" opacity="0.5"/>
  
  <!-- 麦穗 -->
  <circle cx="30" cy="30" r="3" fill="#854d0e" opacity="0.7"/>
  <circle cx="70" cy="60" r="3" fill="#854d0e" opacity="0.7"/>
  <circle cx="130" cy="90" r="3" fill="#854d0e" opacity="0.7"/>
  <circle cx="170" cy="120" r="3" fill="#854d0e" opacity="0.7"/>
</svg>
```

## 山地 (mountains.svg)

```svg
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <rect width="200" height="200" fill="#64748b"/>
  
  <!-- 山峰 -->
  <polygon points="50,150 100,50 150,150" fill="#475569" opacity="0.8"/>
  <polygon points="0,180 60,80 120,180" fill="#334155" opacity="0.8"/>
  <polygon points="120,180 160,100 200,180" fill="#334155" opacity="0.8"/>
  
  <!-- 矿脉 -->
  <circle cx="80" cy="120" r="8" fill="#1e293b" opacity="0.6"/>
  <circle cx="130" cy="140" r="6" fill="#1e293b" opacity="0.6"/>
  <circle cx="100" cy="90" r="5" fill="#fbbf24" opacity="0.7"/>
</svg>
```

## 沙漠 (desert.svg)

```svg
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <rect width="200" height="200" fill="#d97706"/>
  
  <!-- 沙丘 -->
  <path d="M 0 100 Q 50 60 100 100 Q 150 140 200 100 L 200 200 L 0 200 Z" fill="#b45309" opacity="0.5"/>
  <path d="M 0 140 Q 50 100 100 140 Q 150 180 200 140 L 200 200 L 0 200 Z" fill="#92400e" opacity="0.5"/>
  
  <!-- 沙粒 -->
  <circle cx="40" cy="80" r="2" fill="#78350f" opacity="0.6"/>
  <circle cx="120" cy="120" r="2" fill="#78350f" opacity="0.6"/>
  <circle cx="160" cy="90" r="2" fill="#78350f" opacity="0.6"/>
  <circle cx="70" cy="160" r="2" fill="#78350f" opacity="0.6"/>
</svg>
```

## 快速转换工具

### 在线 SVG 转 PNG
1. https://cloudconvert.com/svg-to-png
2. https://svgtopng.com/
3. https://convertio.co/svg-png/

### 设置
- 输出尺寸: 512x512px 或 1024x1024px
- 背景: 不透明
- 质量: 最高

保存后将文件重命名为对应的名称（如 `forest.png`），放入 `fronted/public/assets/terrains/` 文件夹即可！
