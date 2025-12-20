# React + Tailwind + Vite 重构进度

本文档用于记录从"原生 JS + 直连 HTML/CSS"迁移到"React + Tailwind CSS + Vite（MV3）"的重构进度、已完成项与未完成事项。

## 当前状态（摘要）

- 已完成：构建与入口切换（MV3 + Vite），New Tab / Side Panel / Background / Content Script 均从 `dist/` 运行。
- 当前架构：React 外壳负责挂载；遗留 DOM 作为 UI 模板；遗留逻辑显式 bootstrap（整体仍以 legacy 逻辑驱动为主）。
- 迁移主线：在"功能与 UI 对等"的前提下，持续"收敛副作用 + 模块拆分 + 初始化幂等化"，为逐模块 React 化铺路。
- Tailwind 化：已完成 ToggleSidebar / ThemeToggle / LinksIcons / SettingsIcon 四个组件的 Tailwind 迁移。

## 已完成（Done，总结）

> 总原则：以"功能与 UI 对等"为前提，先收敛副作用/初始化，再逐块 React 化。

### 构建与入口

- Vite 多入口构建，New Tab / Side Panel / background / content 统一输出到 `dist/`。
- `manifest.json` 入口统一指向 `dist/` 产物，运行时不再直连 `src/`。
- legacy 静态资源收敛到 `dist/legacy/` 与 `dist/assets/style.css`。

### React 外壳与迁移点（Portal/原位替换）

- 共享外壳 `LegacyAppShell`：注入 legacy DOM + 显式 bootstrap，New Tab/Side Panel 复用同一启动序列。
- 已迁移渲染点：年进度、More toast、快捷入口、设置齿轮、主题切换、Quick Links、搜索建议容器、搜索引擎下拉、侧边栏切换按钮。

### ToggleSidebar React 化 + Tailwind 化（保持对等）

- `src/ui/toggle-sidebar.jsx` 现在完全管理侧边栏切换逻辑：React 组件内部维护展开/收起状态、处理点击事件、同步 `#sidebar-container` 的 `collapsed` class。
- 新增 `data-ntm-react-toggle-sidebar` 标记：React 加载时在 `document.documentElement` 设置该属性，`script.js` 检测到后跳过事件绑定，避免重复监听。
- 行为不变：按钮点击后切换侧边栏展开/收起、按钮文字与位置更新、状态持久化到 localStorage。
- 向后兼容：若 React 未加载，legacy `script.js` 仍会绑定点击事件作为降级方案。
- Tailwind 化：按钮样式已迁移至 Tailwind CSS（定位 `fixed bottom-8 z-[1000]`、尺寸 `w-9 h-9`、暗色模式使用 `[[data-theme=dark]_&]` 选择器）。

### ThemeToggle React 化 + Tailwind 化（保持对等）

- `src/ui/theme-toggle.jsx` 现在完全管理主题切换逻辑：React 组件内部维护主题状态、处理点击事件、同步 `data-theme` 属性。
- 新增 `data-ntm-react-theme` 标记：React 加载时在 `document.documentElement` 设置该属性，`theme-controller.js` 检测到后跳过点击事件绑定，避免重复监听。
- 行为不变：主题切换按钮点击后切换明暗模式、图标更新、渐变背景重新应用、状态持久化到 localStorage。
- 向后兼容：若 React 未加载，legacy `initThemeController()` 仍会绑定点击事件作为降级方案。
- Tailwind 化：容器和按钮样式已迁移至 Tailwind CSS（`fixed right-8 top-[30%] z-[2]`、暗色模式使用 `[[data-theme=dark]_&]` 选择器）。

### LinksIcons Tailwind 化（保持对等）

- `src/ui/links-icons.jsx` 容器和链接样式已迁移至 Tailwind CSS。
- 暗色模式：使用 `[[data-theme=dark]_&]` 任意选择器实现。
- 行为不变：点击跳转对应 Chrome 链接（history/downloads/passwords/extensions），悬停变绿色背景灰色。

### SettingsIcon Tailwind 化（保持对等）

- `src/ui/settings-icon.jsx` 容器和链接样式已迁移至 Tailwind CSS。
- 暗色模式：使用 `[[data-theme=dark]_&]` 任意选择器实现。
- 行为不变：点击打开设置弹窗，悬停变绿色背景灰色。
- `.settings-update-tip` 子组件结构保留使用 legacy CSS。

### Quick Links Portal 容器 Tailwind 化（保持对等）

- `src/ui/quick-links-portal.jsx` 外层容器样式已迁移至 Tailwind CSS。
- wrapper：`flex justify-center w-full`。
- container：`flex gap-0.5 justify-center min-h-[80px] overflow-x-hidden py-2.5 w-[800px]` + 响应式断点（840px/480px/368px 自动换行/缩小间距）。
- 保留 legacy class（`.quick-links-wrapper`、`.quick-links-container`）以确保 `initQuickLinks()` 仍可查找 DOM。
- 行为不变：Quick Links 正常渲染、右键菜单、编辑/删除等功能。

### Quick Links Item Tailwind 化（保持对等）

- `src/quick-links.js` 的 `renderQuickLinks()` 中动态创建元素已添加 Tailwind 类。
- item-container：`flex flex-col items-center w-20`（保留 legacy class）。
- item（图标容器）：`flex items-center justify-center w-[60px] h-[60px] bg-white rounded-full shadow-md` + hover 放大 + dark mode 背景。
- img：`w-6 h-6 object-contain`。
- span：`mt-2 text-xs text-gray-500 text-center` + 文字截断。
- 行为不变：Quick Links 正常渲染、悬停效果、右键菜单。

### YearProgress Tailwind 化（保持对等）

- `src/ui/year-progress.jsx` 样式已迁移至 Tailwind CSS。
- year-progress 容器：`flex items-center`。
- year-progress span（年份文字）：`mr-2 text-xs text-gray-500 [[data-theme=dark]_&]:text-white/75`。
- progress-bar 容器：`flex items-center`。
- progress-bar div（不活跃段）：`w-3 h-3 mr-1.5 rounded bg-gray-300 [[data-theme=dark]_&]:bg-white/[0.12]`。
- progress-bar div.active（活跃段）：`bg-gray-400 [[data-theme=dark]_&]:bg-white/[0.28]`。
- progress-percentage：`ml-2 text-xs text-gray-500 [[data-theme=dark]_&]:text-white/75`。
- 保留 legacy class（`.year-progress`、`.progress-bar`、`.progress-percentage`）以确保动态颜色调整 DOM 查询正常。
- 行为不变：进度条显示、暗色模式适配、壁纸颜色动态调整。

### Search Engine Dropdown Tailwind 化（保持对等）

- `src/ui/search-engine-dropdown-portal.jsx` 样式已迁移至 Tailwind CSS。
- 下拉容器：`absolute left-0 top-full bg-white rounded-xl shadow-lg p-4 z-[1000] w-[580px] mt-2` + 暗色模式背景/阴影。
- 选项容器：`grid grid-cols-6 gap-3` + 响应式断点（480px 切换为 3 列）。
- 单个选项：`cursor-pointer p-2 rounded-lg transition-colors hover:bg-gray-100` + 暗色模式悬停效果。
- 选项内容：`flex flex-col items-center gap-1.5`。
- 选项图标：`h-6 mb-1` + 暗色模式白底衬托。
- 选项标签：`text-xs text-gray-800` + 暗色模式文字颜色。
- 保留 legacy class（`.search-engine-dropdown`、`.search-engine-option` 等）以确保 legacy JS 查询正常。
- 行为不变：点击切换搜索引擎、下拉菜单显隐、暗色模式适配。

### Search Suggestions Portal Tailwind 化（保持对等）

- `src/ui/search-suggestions-portal.jsx` 样式已迁移至 Tailwind CSS。
- wrapper：`absolute top-full left-0 right-0 bg-white rounded-b-xl shadow-md z-[1000] overflow-hidden hidden` + 暗色模式背景。
- custom-hr：`border-t border-gray-200` + 暗色模式边框色。
- tabs-container：`relative p-2 flex justify-start items-center overflow-x-auto whitespace-nowrap z-[5] pl-[30px] bg-white scrollbar-none` + 暗色模式。
- search-tips：`text-xs mr-2`。
- tab：`flex-shrink-0 cursor-pointer px-1.5 py-0.5 rounded-2xl text-gray-500 text-xs inline-flex items-center mr-1.5 bg-gray-100 border border-transparent transition-colors hover:bg-gray-200` + 暗色模式。
- tab.active：`bg-blue-50 text-blue-600 border-gray-300`。
- 保留 legacy class（`.search-suggestions-wrapper`、`.search-suggestions`、`.tabs`、`.tab` 等）以确保 legacy JS 查询正常。
- 行为不变：搜索建议显隐、tabs 切换、暗色模式适配。


### Legacy 控制器标记废弃（保持对等）

- `src/progress.js` 已标记为 `@deprecated`：年进度渲染完全由 React 组件 `YearProgressPortal`（`src/ui/year-progress.jsx`）接管。
- `src/ui/theme-controller.js` 已标记为 `@deprecated`：主题切换功能完全由 React 组件 `ThemeToggle`（`src/ui/theme-toggle.jsx`）接管。
- `src/ui/special-links-controller.js` 已标记为 `@deprecated`：特殊链接点击由 `LinksIcons` + `SettingsIcon` 接管。

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

- 幂等化：`src/search/suggestions-ui.js` 现在会在同一 `searchInput` 上自动 dispose 旧实例，避免重复绑定监听器。
- 可清理：新增 `dispose()`（AbortController + 取消 debounce + 清理 scroll listener + hide UI），并在 `src/script.js` 的 `pagehide` 时机调用。
- 行为不变：保留原有 DOM 结构、样式 class、交互（输入/聚焦/失焦、键盘上下选择、Enter/ Ctrl|Cmd+Enter、滚动加载）。
- 补充修复：Esc 立即隐藏、页面失焦隐藏、回到页面不闪。
- 统一 debounce：改用 `src/utils/debounce.js`，渲染安全性收敛（HTML 转义）。

### 搜索 wiring 收敛（保持对等）

- 新增 `src/search/search-controller.js`：把"搜索建议 UI 的 wiring + pagehide dispose 生命周期"收敛为可复用入口。
- `src/script.js` 改为调用 `initSearchController(...)`，移除重复声明。

### 搜索建议容器 Portal 稳定化（保持对等）

- 建议容器由 React Portal 渲染保持稳定：在 `src/ui/search-suggestions-portal.jsx` 的根节点新增 `data-ntm-search-suggestions-root` 标记。
- legacy 侧 DOM 查询收敛到 `.search-form` 作用域。

### Quick Links 初始化收敛（保持对等）

- 新增 `src/quick-links/quick-links-controller.js`：把 Quick Links 的 wiring（初始化 + `pagehide` 清理）收敛为可复用入口。
- `src/ui/quick-links-portal.jsx` 改为使用 controller，并在 React unmount 时调用 `dispose()`。
- `src/quick-links.js` 补齐最小清理能力：新增 `disposeQuickLinksVisibility()` / `disposeQuickLinks()`。

### 其他关键修复

- 壁纸：`selectedWallpaper` 持久化 + URL 归一化匹配；active 同步与暗色 active 边框修复。

### 文档

- README 补充"必须 build 生成 dist 才能加载"的说明。

## 当前实现方式（重要说明）

当前并未把业务完全 React 组件化，而是 React 负责挂载与引导：注入遗留 DOM → 显式 bootstrap 遗留模块 → 初始化控制器。该方案用于快速保证"功能/视觉对等"，并为后续逐模块 React 化提供落脚点。

## 未完成（Todo / 下一阶段）

### 优先级 P0（下一步建议聚焦 1–5 个模块/功能）

- New Tab：逐模块 React 化（建议从低耦合开始）：Quick Links（Portal 已就绪、Controller 已收敛）、搜索（含引擎/建议 UI）、Sidebar、设置弹窗某个 Tab。
- Side Panel：逐步替换 `sidepanel-manager.js` 的 DOM 注入与事件绑定，保持与 New Tab 同一套能力层。

### 优先级 P1（收尾与自洽）

- 资源与构建完全自洽：明确发布包边界（理想目标：运行时不依赖 `src/` 静态路径）。
- i18n 策略统一：React 侧与 `data-i18n` / `chrome.i18n` 的协作方式固化（key 对齐与局部更新策略）。
- Legacy 代码清理：移除已废弃的 `progress.js` / `theme-controller.js` / `special-links-controller.js`。

## 如何验证（当前版本）

1. `npm install`
2. `npm run build`
3. Chrome/Edge → `chrome://extensions` → 开发者模式 → Load unpacked → 选择仓库根目录
4. 打开新标签页与侧边栏进行手动回归；改动后重复 `npm run build` 并在扩展卡片点击 Reload

建议每轮至少回归：
- New Tab / Side Panel 能正常加载（无白屏/无明显闪烁/控制台无关键报错）
- 设置弹窗可打开/切换/关闭（按钮/遮罩/Esc）
- 搜索：引擎切换 + 回车搜索 + 搜索建议（滚动加载/键盘导航/Ctrl/Cmd+Enter）

近期改动重点回归（按需抽检）：
- 主题切换：明/暗模式切换正常，图标更新
- 侧边栏切换：按钮位置与图标随状态变化
- Quick Links：显隐开关生效且持久化；右键菜单正常；无重复渲染/重复响应
- 设置：背景色/壁纸切换与持久化正常；暗色模式样式无明显异常
- 书签：展示/打开/右键/拖拽
