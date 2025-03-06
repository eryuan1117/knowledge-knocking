# 应用图标说明

本目录包含"知识来敲门"应用的图标文件。

## 文件说明

- `app-icon.svg` - 矢量格式的应用图标
- `app-icon.png` - PNG格式的应用图标 (512x512像素)
- `app-icon.ico` - Windows平台图标 (需要转换生成)
- `app-icon.icns` - macOS平台图标 (需要转换生成)

## 如何生成平台特定图标

### Windows (ICO)

1. 使用在线转换工具，如 [convertio.co](https://convertio.co/svg-ico/) 或 [svgtopng.com](https://svgtopng.com/)
2. 上传 `app-icon.svg` 文件
3. 转换为 ICO 格式
4. 下载并保存为 `app-icon.ico` 到此目录

### macOS (ICNS)

1. 首先将 SVG 转换为高分辨率 PNG (至少 1024x1024 像素)
2. 使用 macOS 的 Icon Composer 或在线工具如 [iConvert](https://iconverticons.com/online/)
3. 生成 ICNS 文件
4. 保存为 `app-icon.icns` 到此目录

## 注意事项

- 在打包应用前，请确保已生成相应平台的图标文件
- 图标文件名必须与 package.json 中指定的一致 