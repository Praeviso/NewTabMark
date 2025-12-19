# React + Tailwind + Vite 重构进度

本文档用于记录从“原生 JS + 直连 HTML/CSS”迁移到“React + Tailwind CSS + Vite（MV3）”的重构进度、已完成项与未完成事项。

## 当前状态（摘要）

- 已完成：构建与入口切换（MV3 + Vite），New Tab / Side Panel / Background / Content Script 均从 `dist/` 运行。
- 当前架构：React 外壳负责挂载；遗留 DOM 作为 UI 模板；遗留逻辑显式 bootstrap（整体仍以 legacy 逻辑驱动为主）。
- 迁移主线：在“功能与 UI 对等”的前提下，持续“收敛副作用 + 模块拆分 + 初始化幂等化”，为逐模块 React 化铺路。

## 已完成（Done，总结）

> 总原则：以“功能与 UI 对等”为前提，先收敛副作用/初始化，再逐块 React 化。

### 构建与入口

- Vite 多入口构建，New Tab / Side Panel / background / content 统一输出到 `dist/`。
- `manifest.json` 入口统一指向 `dist/` 产物，运行时不再直连 `src/`。
- legacy 静态资源收敛到 `dist/legacy/` 与 `dist/assets/style.css`。

### React 外壳与迁移点（Portal/原位替换）

- 共享外壳 `LegacyAppShell`：注入 legacy DOM + 显式 bootstrap，New Tab/Side Panel 复用同一启动序列。
- 已迁移渲染点：年进度、More toast、快捷入口、设置齿轮、主题切换、Quick Links、搜索建议容器、搜索引擎下拉。

### 稳定性与初始化收敛

- `createLegacyBootstrap()` + `initXxx()` 幂等化：减少 `DOMContentLoaded`/import 副作用，避免重复绑定，适配延迟注入。
- i18n 收敛：`getLocalizedMessageSafe()` / `updateUILanguage(root?)` + substitutions 统一入口，降低首屏文案闪现与分歧。
- 背景/主题/设置链路收敛：背景状态由 `src/background-state.js` 统一；theme/settings/wallpaper/onboarding/welcome/feature-tips 等模块使用可 abort 监听器避免泄漏。
- 右键菜单副作用收敛：移除模块级全局监听，区分 `.bookmark-context-menu`，避免书签/文件夹菜单互相误删。
- Onboarding：缺失 overlay DOM 由 `src/onboarding.js` 动态注入，文案 i18n 与暗色样式已补齐。

### 搜索重构（保持对等）

- 数据与 UI 拆分：`src/search-engines.js`（引擎数据/存储/URL）、`src/search/*`（建议 service + UI），`src/script.js` 仅做 wiring。
- 下拉 React 化：`src/ui/search-engine-dropdown-portal.jsx` 挂载 DOM；legacy 创建降级为 no-op，并通过事件与 legacy 同步状态。
- 修复与兼容：`selectedSearchEngine` 归一化修复 tabs active 丢失；管理弹窗暗色样式与 i18n fallback。

### 搜索建议初始化收敛（保持对等）

- 幂等化：`src/search/suggestions-ui.js` 现在会在同一 `searchInput` 上自动 dispose 旧实例，避免重复绑定监听器（适配 React 延迟注入/重复 bootstrap 的场景）。
- 可清理：新增 `dispose()`（AbortController + 取消 debounce + 清理 scroll listener + hide UI），并在 `src/script.js` 的 `pagehide` 时机调用。
- 行为不变：保留原有 DOM 结构、样式 class、交互（输入/聚焦/失焦、键盘上下选择、Enter/ Ctrl|Cmd+Enter、滚动加载）。

### 其他关键修复

- 壁纸：`selectedWallpaper` 持久化 + URL 归一化匹配；active 同步与暗色 active 边框修复。

### 文档

- README 补充“必须 build 生成 dist 才能加载”的说明。

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

近期改动重点回归（按需抽检）：
- 右键菜单：书签/文件夹互不干扰；点击空白关闭；点击菜单内部不误关。
- Quick Links：显隐开关生效且持久化；右键菜单正常；无重复渲染/重复响应。
- 搜索：下拉开关/引擎切换/管理弹窗正常；建议列表滚动加载与键盘导航正常。
- 设置：主题切换、背景色/壁纸切换与持久化正常；暗色模式样式无明显异常。
- Onboarding/Welcome/Feature Tips：首次进入/文案 i18n/关闭逻辑正常；无重复绑定。
