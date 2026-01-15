# 游戏资源文件夹

这个文件夹用于存放游戏的图片资源。

## 文件夹结构

```
fronted/public/assets/
├── terrains/          # 地形板块背景图
│   ├── forest.png     # 森林（木材）- 建议尺寸: 200x200px 或更大
│   ├── hills.png      # 丘陵（砖块）- 建议尺寸: 200x200px 或更大
│   ├── pasture.png    # 草原（羊毛）- 建议尺寸: 200x200px 或更大
│   ├── fields.png     # 田野（粮食）- 建议尺寸: 200x200px 或更大
│   ├── mountains.png  # 山地（矿石）- 建议尺寸: 200x200px 或更大
│   └── desert.png     # 沙漠 - 建议尺寸: 200x200px 或更大
└── .gitkeep

```

## 如何使用自己的图片

### 步骤 1: 准备图片
准备 6 张地形图片，确保：
- **格式**: PNG 或 JPG
- **尺寸**: 建议 200x200px 或更大（会自动缩放）
- **命名**: 必须与下面的文件名完全一致

### 步骤 2: 放置图片
将图片文件放入 `fronted/public/assets/terrains/` 文件夹：
```
fronted/public/assets/terrains/
├── forest.png      # 森林
├── hills.png       # 丘陵
├── pasture.png     # 草原
├── fields.png      # 田野
├── mountains.png   # 山地
└── desert.png      # 沙漠
```

### 步骤 3: 刷新页面
保存文件后，刷新浏览器页面，图片会自动加载显示。

## 图片要求

### 地形板块图片内容建议
- **森林 (forest.png)**: 茂密的树木，深绿色调，俯视图
- **丘陵 (hills.png)**: 红褐色的山丘，可见砖块或粘土
- **草原 (pasture.png)**: 绿色草地，可以有羊群
- **田野 (fields.png)**: 金黄色的麦田，麦穗
- **山地 (mountains.png)**: 灰色岩石山脉，可见矿石
- **沙漠 (desert.png)**: 黄色沙丘，干燥的地面

### 风格建议
- 俯视图（从上往下看）
- 卡通风格或写实风格均可
- 颜色鲜明，对比度高
- 避免过于复杂的细节（会在小尺寸下显示）

## 后备方案

如果图片文件不存在或加载失败，游戏会自动使用：
1. 纯色渐变背景（基于地形类型）
2. SVG 纹理图案（半透明覆盖层）

这样即使没有图片，游戏也能正常显示。

## 图片来源建议

### AI 生成工具
- **Midjourney**: 高质量，需要订阅
- **DALL-E 3**: OpenAI 的图像生成工具
- **Stable Diffusion**: 免费开源
- **Leonardo.ai**: 免费额度，游戏素材友好

### 免费素材网站
- **OpenGameArt.org**: 专门的游戏素材网站
- **Freepik**: 大量免费素材
- **Flaticon**: 图标和简单图形
- **Unsplash**: 高质量照片（可能需要后期处理）

### 提示词参考（AI 生成）
```
森林: "top-down view of dense forest, game tile, cartoon style, vibrant green"
丘陵: "top-down view of clay hills, brick texture, game tile, reddish brown"
草原: "top-down view of green pasture with sheep, game tile, bright green"
田野: "top-down view of wheat field, golden yellow, game tile"
山地: "top-down view of rocky mountains with ore, game tile, gray stone"
沙漠: "top-down view of sand dunes, game tile, yellow desert"
```

## 注意事项

⚠️ **版权问题**: 确保你有使用图片的权限
- 使用自己创作的图片
- 使用明确标注为免费商用的素材
- 使用 AI 生成的图片（注意各平台的使用条款）

✅ **文件命名**: 文件名必须完全一致（包括大小写）
✅ **文件位置**: 必须放在 `fronted/public/assets/terrains/` 文件夹
✅ **文件格式**: PNG 或 JPG 格式

