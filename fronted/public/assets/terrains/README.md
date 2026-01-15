# 地形图片说明

## 📋 文件列表和对应资源

### 1. forest.png - 森林 🌲
- **产出资源**: 木材 (WOOD)
- **颜色**: 深绿色 (#166534)
- **描述**: 茂密的树林，从上往下看的俯视图
- **建议内容**: 
  - 深绿色的树冠
  - 可以看到树木的阴影
  - 密集的森林纹理
  - 可以有一些浅绿色的草地点缀

### 2. hills.png - 丘陵 🧱
- **产出资源**: 砖块 (BRICK)
- **颜色**: 红褐色 (#dc2626)
- **描述**: 红色的粘土山丘
- **建议内容**:
  - 红褐色的土壤
  - 可见的粘土层
  - 起伏的丘陵地形
  - 可以有一些砖块或岩石

### 3. pasture.png - 草原 🐑
- **产出资源**: 羊毛 (SHEEP)
- **颜色**: 浅绿色 (#22c55e)
- **描述**: 绿色的草地牧场
- **建议内容**:
  - 明亮的绿色草地
  - 可以有几只白色的羊
  - 草地纹理
  - 可以有一些花朵点缀

### 4. fields.png - 田野 🌾
- **产出资源**: 粮食 (WHEAT)
- **颜色**: 金黄色 (#eab308)
- **描述**: 金黄色的麦田
- **建议内容**:
  - 金黄色的麦穗
  - 整齐的田垄
  - 成熟的小麦
  - 可以有收割的痕迹

### 5. mountains.png - 山地 ⛰️
- **产出资源**: 矿石 (ORE)
- **颜色**: 灰色 (#64748b)
- **描述**: 灰色的岩石山脉
- **建议内容**:
  - 灰色的岩石
  - 可见的矿脉（深色或金属色）
  - 山峰和岩石纹理
  - 可以有一些雪或冰

### 6. desert.png - 沙漠 🏜️
- **产出资源**: 无（沙漠不产出资源）
- **颜色**: 黄褐色 (#d97706)
- **描述**: 黄色的沙丘
- **建议内容**:
  - 黄色或浅褐色的沙子
  - 沙丘的起伏
  - 可以有一些仙人掌
  - 干燥的地面纹理

## 🎨 AI 生成提示词

### Midjourney / DALL-E / Stable Diffusion

```
森林 (forest.png):
"top-down aerial view of dense forest, game tile texture, vibrant dark green trees, cartoon style, flat design, seamless pattern, board game asset, 4k"

丘陵 (hills.png):
"top-down aerial view of clay hills, red-brown terrain, brick texture visible, game tile, cartoon style, flat design, board game asset, 4k"

草原 (pasture.png):
"top-down aerial view of green pasture with white sheep, bright green grass, game tile texture, cartoon style, flat design, board game asset, 4k"

田野 (fields.png):
"top-down aerial view of golden wheat field, yellow grain, farm rows visible, game tile texture, cartoon style, flat design, board game asset, 4k"

山地 (mountains.png):
"top-down aerial view of rocky mountains with ore veins, gray stone, metallic minerals, game tile texture, cartoon style, flat design, board game asset, 4k"

沙漠 (desert.png):
"top-down aerial view of sand dunes, yellow desert, dry terrain, game tile texture, cartoon style, flat design, board game asset, 4k"
```

### Leonardo.ai 提示词（游戏素材优化）

```
森林: "isometric game tile, forest terrain, top view, green trees, board game style"
丘陵: "isometric game tile, clay hills terrain, top view, red brick, board game style"
草原: "isometric game tile, pasture terrain, top view, green grass with sheep, board game style"
田野: "isometric game tile, wheat field terrain, top view, golden grain, board game style"
山地: "isometric game tile, mountain terrain, top view, gray rocks with ore, board game style"
沙漠: "isometric game tile, desert terrain, top view, yellow sand dunes, board game style"
```

## 📐 图片规格

- **尺寸**: 建议 512x512px 或 1024x1024px（会自动缩放）
- **格式**: PNG（推荐，支持透明背景）或 JPG
- **风格**: 俯视图（从上往下看）
- **色彩**: 鲜明、饱和度高
- **细节**: 适中（太复杂在小尺寸下看不清）

## 🔍 免费资源网站

1. **OpenGameArt.org** - 专门的游戏素材
   - 搜索: "terrain tile top view"
   
2. **Freepik.com** - 大量免费素材
   - 搜索: "game terrain texture"
   
3. **Flaticon.com** - 简单图标
   - 搜索: "terrain icon"

4. **Unsplash.com** - 高质量照片
   - 搜索: "forest aerial view" 等
   - 需要后期处理成俯视图

## 💡 快速开始

如果你暂时没有图片，游戏会使用：
1. 纯色渐变背景（基于地形颜色）
2. SVG 纹理图案（半透明覆盖）

这样游戏仍然可以正常运行和显示！

## ⚠️ 注意事项

- 文件名必须完全一致（包括小写）
- 所有 6 个文件都需要（缺少的会显示后备样式）
- 图片会自动平铺填充六边形区域
- 建议使用正方形图片（1:1 比例）
