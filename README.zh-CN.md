# NewTabMark

[English](README.md) | [简体中文](README.zh-CN.md)

NewTabMark 是一个将浏览器“新建标签页”替换为书签面板的扩展，同时提供侧边栏与可选悬浮按钮，便于在浏览时快速访问书签与搜索能力。

## 已实现功能

- 新标签页书签面板（设置“主页”文件夹、侧边栏树形导航、路径导航）
- 文件夹/书签拖拽排序
- 书签操作：复制链接、生成二维码、文件夹内一键打开全部书签
- 搜索：可切换/自定义搜索引擎；`Ctrl/Cmd+Enter` 一键在全部引擎中搜索
- 建议与检索：支持书签与历史记录搜索
- 侧边栏：`Alt+B` / `Command+B` 快捷键开关，支持基础前进/后退等导航
- 悬浮按钮（内容脚本注入），可在设置中开关
- 个性化：明/暗主题、背景/壁纸选项
- 国际化：`_locales/<lang>/messages.json`

## 本地加载（开发者模式）

1. 打开 `chrome://extensions`，开启右上角“开发者模式”
2. 先执行 `npm install`（会自动执行构建并生成 `dist/`，`manifest.json` 会引用其中的页面；如未生成可手动执行 `npm run build`）
3. 点击“加载已解压的扩展程序（Load unpacked）”，选择仓库根目录（包含 `manifest.json`）
4. 修改代码后：重新执行 `npm run build`，在扩展卡片点“刷新/Reload”，再打开新标签页验证

## 目录结构

- `manifest.json`: 扩展入口、权限与快捷键
- `newtab.html` / `sidepanel.html`: Vite 入口 HTML
- `src/`: 页面与逻辑（遗留模板 `src/index.html` + `src/sidepanel.html`，以及 React/Vite 入口代码）
- `dist/`: Vite 构建产物（由 `manifest.json` 引用）
- `_locales/`: 多语言文案
- `images/`: 图标与静态资源

## 权限说明

本扩展会使用 `bookmarks`、`history`、`storage`、`sidePanel` 等权限，并声明 `http://*/*` 与 `https://*/*` 的 host 权限以支持页面内功能（例如悬浮按钮的内容脚本）。

## 上游 / 致谢

致谢：本项目最初参考/派生自上游仓库：
`https://github.com/Alanrk/TabMark-Bookmark-New-Tab`

当前仓库已独立开发，与上游作者无隶属关系；如需查看历史实现与许可/条款信息，请以该上游仓库为准。
