# React + Tailwind + Vite 重构进度

本文档用于记录从“原生 JS + 直连 HTML/CSS”迁移到“React + Tailwind CSS + Vite（MV3）”的重构进度、已完成项与未完成事项。

## 当前状态（摘要）

- 已完成：构建与入口切换（MV3 + Vite），New Tab / Side Panel / Background / Content Script 均从 `dist/` 运行。
- 当前架构：React 外壳负责挂载；遗留 DOM 作为 UI 模板；遗留逻辑显式 bootstrap（整体仍以 legacy 逻辑驱动为主）。
- 迁移主线：在“功能与 UI 对等”的前提下，持续“收敛副作用 + 模块拆分 + 初始化幂等化”，为逐模块 React 化铺路。

## 已完成（Done，精简）

### 构建与入口（MV3 + Vite）

- Vite 多入口构建：UI（`newtab.html`、`sidepanel.html`）+ `background.js` + `content.js`，统一 `npm run build` 输出到 `dist/`。
- `manifest.json` 全量指向 `dist/` 产物：New Tab / Side Panel / Service Worker / Content Script。
- 遗留静态资源收敛：脚本进 `dist/legacy/`，遗留样式合并进 `dist/assets/style.css`，减少运行时散落引用。

### 视觉对等（React 外壳 + 遗留 DOM）

- 共享外壳 `LegacyAppShell`：注入遗留 DOM + 显式 bootstrap 遗留逻辑，New Tab/Side Panel 复用同一套流程。
- 首批 React 渲染点（保持结构/样式/交互对等）：`#year-progress`、`#more-button-toast`、`.links-icons`、`.settings-icon`（采用 Portal/替换策略避免重复 DOM）。

### 初始化与稳定性（显式化/幂等化）

- 遗留初始化显式化：`initXxx()` 入口幂等，减少 `DOMContentLoaded`/副作用 import 依赖。
- i18n（React 侧）对齐：`getLocalizedMessageSafe()` / `updateUILanguage(root?)`，降低首屏文案闪现。
- New Tab / Side Panel legacy bootstrap 去重：`createLegacyBootstrap()` 统一初始化序列与 run-once。

### 搜索模块拆分（保持对等）

- 搜索引擎数据层抽取：`src/search-engines.js` 统一引擎数据/存储/URL 计算，UI 逻辑保留在 `src/search-engine-dropdown.js`。
- 搜索建议逻辑层抽取：`src/search/relevance.js` + `src/search/suggestions.js`，`src/script.js` 复用 service。
- 搜索建议 UI 抽取：`src/search/suggestions-ui.js` 统一“渲染/滚动加载/键盘导航/默认建议”，`src/script.js` 仅做 wiring。

### 关键问题修复

- 搜索引擎管理弹窗：暗色模式关闭按钮样式修复；缺失 i18n key（如 `perplexityLabel`）时回退显示内置 `displayName`（如 `Perplexity`）。

### 文档

- README 补充“必须 build 生成 dist 才能加载”说明；本文件持续记录每步影响与验证点。

## 当前实现方式（重要说明）

当前并未把业务完全 React 组件化，而是 React 负责挂载与引导：注入遗留 DOM → 显式 bootstrap 遗留模块 → 初始化控制器。该方案用于快速保证“功能/视觉对等”，并为后续逐模块 React 化提供落脚点。

## 未完成（Todo / 下一阶段）

### 优先级 P0（下一步建议聚焦 1–5 个模块/功能）

- New Tab：逐模块 React 化（建议从低耦合开始）：搜索（含引擎/建议 UI）、Quick Links、Sidebar、设置弹窗某个 Tab。
- Side Panel：逐步替换 `sidepanel-manager.js` 的 DOM 注入与事件绑定，保持与 New Tab 同一套能力层。

### 优先级 P1（收尾与自洽）

- 资源与构建完全自洽：明确发布包边界（理想目标：运行时不依赖 `src/` 静态路径）。
- i18n 策略统一：React 侧与 `data-i18n` / `chrome.i18n` 的协作方式固化（key 对齐与局部更新策略）。

## 如何验证（当前版本）

1. `npm install`
2. `npm run build`
3. Chrome/Edge → `chrome://extensions` → 开发者模式 → Load unpacked → 选择仓库根目录
4. 打开新标签页与侧边栏进行手动回归；改动后重复 `npm run build` 并在扩展卡片点击 Reload

建议每轮至少回归：
- New Tab / Side Panel 能正常加载（无白屏/无明显闪烁/控制台无关键报错）
- 设置弹窗可打开/切换/关闭（按钮/遮罩/Esc）
- 搜索：引擎切换 + 回车搜索 + 搜索建议（滚动加载/键盘导航/Ctrl/Cmd+Enter）
- 书签：展示/打开/右键/拖拽（如本轮未触达，可抽检 1–2 条路径）
