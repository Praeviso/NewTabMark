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
- 已迁移渲染点：年进度、More toast、快捷入口、设置齿轮、主题切换、Quick Links、搜索建议容器、搜索引擎下拉、侧边栏切换按钮。

### ToggleSidebar React 化（保持对等）

- `src/ui/toggle-sidebar.jsx` 现在完全管理侧边栏切换逻辑：React 组件内部维护展开/收起状态、处理点击事件、同步 `#sidebar-container` 的 `collapsed` class。
- 新增 `data-ntm-react-toggle-sidebar` 标记：React 加载时在 `document.documentElement` 设置该属性，`script.js` 检测到后跳过事件绑定，避免重复监听。
- 行为不变：按钮点击后切换侧边栏展开/收起、按钮文字与位置更新、状态持久化到 localStorage。
- 向后兼容：若 React 未加载，legacy `script.js` 仍会绑定点击事件作为降级方案。

### ThemeToggle React 化（保持对等）

- `src/ui/theme-toggle.jsx` 现在完全管理主题切换逻辑：React 组件内部维护主题状态、处理点击事件、同步 `data-theme` 属性。
- 新增 `data-ntm-react-theme` 标记：React 加载时在 `document.documentElement` 设置该属性，`theme-controller.js` 检测到后跳过点击事件绑定，避免重复监听。
- 行为不变：主题切换按钮点击后切换明暗模式、图标更新、渐变背景重新应用、状态持久化到 localStorage。
- 向后兼容：若 React 未加载，legacy `initThemeController()` 仍会绑定点击事件作为降级方案。

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

补充修复（保持对等）：
- Esc：搜索建议列表支持按 `Esc` 立即隐藏。
- 页面失焦隐藏：当页面失去焦点（例如点击 Chrome 顶部地址栏/搜索框）或切到后台时，会隐藏搜索建议，避免建议面板“悬挂”。
- 回到页面不闪：从地址栏切回 New Tab/Side Panel 时，不会短暂闪出建议列表；只有用户再次主动聚焦/输入才会显示。

补充重构（保持对等）：
- 统一 debounce：`src/search/suggestions-ui.js` 改用 `src/utils/debounce.js`（新增 `cancel()`），避免重复实现并确保 dispose 能可靠取消定时任务。
- 渲染安全性收敛：建议项标题/文本改为 HTML 转义后再写入 DOM（结构与 class 不变），避免 history/bookmark 标题包含特殊字符时造成注入风险。

### 搜索 wiring 收敛（保持对等）

- 新增 `src/search/search-controller.js`：把“搜索建议 UI 的 wiring（DOM 作用域查询 + init）+ pagehide dispose 生命周期”收敛为可复用入口。
- `src/script.js` 改为调用 `initSearchController(...)`，并移除重复声明的 `updateSubmitButtonState/queueSearch/processSearchQueue` 以及手写 pagehide dispose 片段，避免同一作用域内后声明覆盖前声明的隐患。
- 行为不变：仍使用原有 DOM 结构、class、布局；tabs 显隐逻辑与建议 UI 交互保持一致。

### 搜索建议容器 Portal 稳定化（保持对等）

- 建议容器由 React Portal 渲染保持稳定：在 `src/ui/search-suggestions-portal.jsx` 的根节点新增 `data-ntm-search-suggestions-root` 标记（不影响样式/布局）。
- legacy 侧 DOM 查询收敛到 `.search-form` 作用域：`src/script.js` 不再依赖全局 `getElementById` 的“先用后声明”隐患，改为优先在表单子树内查找 `#tabs-container/#search-suggestions/#line-container`，避免未来出现重复节点时取错目标。
- 行为不变：搜索建议显示/隐藏、滚动加载、tabs 展示逻辑保持不变。

### 其他关键修复

- 壁纸：`selectedWallpaper` 持久化 + URL 归一化匹配；active 同步与暗色 active 边框修复。

### 体验一致性修复（保持对等）

### Quick Links 初始化收敛（保持对等）

- 新增 `src/quick-links/quick-links-controller.js`：把 Quick Links 的 wiring（初始化 + `pagehide` 清理）收敛为可复用入口，避免未来 React 重挂载/重复 bootstrap 时出现重复监听与状态锁死。
- `src/ui/quick-links-portal.jsx` 改为使用 controller，并在 React unmount 时调用 `dispose()`；Portal 渲染的 DOM 结构、class 与布局保持不变（`.quick-links-wrapper` + `#quick-links`）。
- `src/quick-links.js` 补齐最小清理能力：新增 `disposeQuickLinksVisibility()` / `disposeQuickLinks()`；同时 `initQuickLinks({ root? })` 支持在给定 root 下查找 `#quick-links`（默认行为不变）。

### 文档

- README 补充“必须 build 生成 dist 才能加载”的说明。

### Legacy progress.js 清理（保持对等）

- `src/progress.js` 已标记为 `@deprecated`：年进度渲染完全由 React 组件 `YearProgressPortal`（`src/ui/year-progress.jsx`）接管。
- 从 `src/index.html` 和 `src/sidepanel.html` 中移除 `<script src="progress.js">` 引用，避免加载冗余代码。
- legacy `initProgress()` 函数从未被 bootstrap 序列调用，因此此次清理无功能影响。
- `progress.js` 保留供参考，待后续完整清理时移除。

### Legacy 控制器标记废弃（保持对等）

- `src/ui/theme-controller.js` 已标记为 `@deprecated`：主题切换功能完全由 React 组件 `ThemeToggle`（`src/ui/theme-toggle.jsx`）接管。
  - React 管理：主题初始化、点击事件、localStorage 持久化、图标更新。
  - legacy `initThemeController()` 在 React 加载后（`ntmReactTheme=true`）跳过大部分逻辑，作为降级方案保留。
- `src/ui/special-links-controller.js` 已标记为 `@deprecated`：特殊链接点击由 React 组件接管。
  - `LinksIcons`（`src/ui/links-icons.jsx`）：处理 history/downloads/passwords/extensions 链接。
  - `SettingsIcon`（`src/ui/settings-icon.jsx`）：处理设置弹窗打开。
  - legacy `initSpecialLinksController()` 在 React 加载后（`ntmReactSpecialLinks=true`）为 no-op。

### SettingsIcon Tailwind 化（保持对等）

- `src/ui/settings-icon.jsx` 容器和链接样式已迁移至 Tailwind CSS：
  - 容器：`fixed right-8 top-[calc(25%+210px)] z-[2] w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-md transition-all duration-300`
  - 链接：`flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:text-emerald-500 hover:bg-gray-100 active:scale-95`
  - 暗色模式：使用 `[[data-theme=dark]_&]` 任意选择器实现（容器 `bg-neutral-700`，链接 `text-white`）
- 行为不变：点击打开设置弹窗，悬停变绿色背景灰色。
- `.settings-update-tip` 子组件结构保留使用 legacy CSS。

### LinksIcons Tailwind 化（保持对等）

- `src/ui/links-icons.jsx` 容器和链接样式已迁移至 Tailwind CSS：
  - 容器：`fixed right-8 top-[calc(30%_+_56px)] z-[2] w-10 flex flex-col items-center py-1.5 bg-white rounded-xl shadow-md transition-all duration-300`
  - 链接：`flex items-center justify-center w-7 h-7 mx-auto my-0.5 rounded-lg text-gray-500 hover:text-emerald-500 hover:bg-gray-100 active:scale-110`
  - 暗色模式：使用 `[[data-theme=dark]_&]` 任意选择器实现（容器 `bg-neutral-700`，链接 `text-white hover:text-neutral-900`）
- 行为不变：点击跳转对应 Chrome 链接（history/downloads/passwords/extensions），悬停变绿色背景灰色。


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

本轮建议重点回归（搜索建议容器相关）：
- New Tab：输入后能出现建议列表；滚动到底部会继续加载；Esc/点击空白/失焦能隐藏。
- Side Panel：同上；并确认 tabs 区域的展示/隐藏逻辑与之前一致（有建议时显示、无建议时隐藏）。
- New Tab：输入出建议后点击地址栏隐藏 → 再点回页面（不点输入）不应闪出建议；此后点击输入/继续输入仍可正常显示建议。
- 书签：展示/打开/右键/拖拽（如本轮未触达，可抽检 1–2 条路径）

近期改动重点回归（按需抽检）：
- 右键菜单：书签/文件夹互不干扰；点击空白关闭；点击菜单内部不误关。
- Quick Links：显隐开关生效且持久化；右键菜单正常；无重复渲染/重复响应。
- 搜索：下拉开关/引擎切换/管理弹窗正常；建议列表滚动加载与键盘导航正常。
- 设置：主题切换、背景色/壁纸切换与持久化正常；暗色模式样式无明显异常。
- Onboarding/Welcome/Feature Tips：首次进入/文案 i18n/关闭逻辑正常；无重复绑定。
