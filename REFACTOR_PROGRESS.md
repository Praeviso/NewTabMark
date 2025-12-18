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
- Quick Links 显隐逻辑收敛：由 `src/quick-links.js` 统一根据 `chrome.storage.sync.enableQuickLinks` 同步显隐并监听变更，移除 `src/script.js` 重复监听；设置弹窗改为复用同一显隐 helper。
- script.js i18n helper 收敛：`src/script.js` 内部 `getLocalizedMessage()` 改为复用 `src/localization.js#getLocalizedMessageSafe()`（并保留对 `window.getLocalizedMessage` 的兼容），减少重复实现与 fallback 分歧。
- i18n substitutions 收敛：`src/localization.js` 的 `window.getLocalizedMessage(name, substitutions?)` 支持 substitutions；`src/script.js` 内确认/版本号/Toast 等场景不再直连 `chrome.i18n.getMessage`，统一走 helper。
- 背景/壁纸初始化收敛：移除 `src/script.js` 对 `.settings-bg-option` 的重复初始化与 click 绑定；背景色仅在 `useDefaultBackground === 'true'` 时才会从设置弹窗恢复（避免壁纸模式被误覆盖）；默认无配置时回退到 `gradient-background-7` 由 `src/wallpaper.js` 负责。
- 主题初始化收敛：将 `initThemeController()` 统一移入 `src/bootstrap-legacy-shared.js` 的启动序列，移除 `src/script.js` 内重复初始化，并让 `src/ui/settings-modal-controller.js` 不再重复读取/应用 `theme`（避免二次 setTheme 与入口分散）。
- 设置弹窗控制器收敛：`src/ui/settings-modal-controller.js` 改为“找不到 modal 时不锁死 initialized”、监听器可 abort（避免重复绑定）；并在 `src/bootstrap-legacy-shared.js` 的共享启动序列中统一初始化（移除 `LegacyAppShell` 中的重复初始化）。同时 `openSettingsModal()` 会在打开时刷新一次设置状态，减少状态不同步。
- 壁纸模块幂等化（适配延迟注入）：`src/wallpaper.js` 不再在 DOM 未就绪时“锁死初始化”，事件监听使用 `AbortController` 可重绑；`openSettingsModal()` 打开时触发 `initWallpaper()` 兜底初始化，避免壁纸/上传/重置在 React 外壳延迟注入场景失效。
- 背景色/壁纸状态收敛（去重）：新增 `src/background-state.js` 统一读取/计算/应用“背景色”存储状态（`selectedBackground`/`useDefaultBackground`/`originalWallpaper`）与 `.settings-bg-option` active 同步；`src/wallpaper.js` 与 `src/ui/settings-modal-controller.js` 复用该 helper，减少重复逻辑与状态分歧风险（保持 UI/功能对等）。
- 引导与欢迎模块幂等化（适配延迟注入）：`src/onboarding.js` / `src/welcome.js` 在找不到关键 DOM 时不再“锁死初始化”；事件监听使用 `AbortController` 绑定，避免 React 外壳重复注入/重启 bootstrap 时出现重复绑定与泄漏（保持 UI/交互对等）。
- 新功能提示（Feature Tips）初始化收敛 + 去重绑定：`src/feature-tips.js` 统一使用 `getLocalizedMessageSafe()` 获取文案，并对 `.search-engine-update-tip` / `.settings-update-tip` 的关闭按钮做“只绑定一次”（`data-close-bound`）防止 React 外壳重复 bootstrap 时重复绑定；同时在展示 tip 时对 tip 容器调用 `updateUILanguage()` 兜底 i18n（适配延迟注入）。并将“展示 tips”的入口从 `src/script.js` 收敛到 `src/bootstrap-legacy-shared.js`（避免入口分散）。
- 书签/文件夹右键菜单副作用收敛：移除 `src/script.js` 的模块级 `document.addEventListener(...)`（避免 import 即绑定监听、以及引用未定义函数导致的潜在报错）；并为“书签菜单”增加独立 class（`.bookmark-context-menu`），避免创建书签菜单时误删文件夹菜单（两者都带 `.custom-context-menu`）。同时点击空白处可统一关闭两种菜单，点击菜单内部不会误关闭（保持 UI/交互对等）。
- 快捷入口/设置齿轮点击逻辑迁移到 React Portal：`src/ui/links-icons.jsx` / `src/ui/settings-icon.jsx` 直接处理 `chrome://history|downloads|settings/passwords|extensions` 与 `openSettingsModal()`；`src/ui/special-links-controller.js` 在 React 场景下（`documentElement.dataset.ntmReactSpecialLinks === 'true'`）不再绑定全局 click 监听，减少重复响应与全局副作用（保持 UI/交互对等）。

### 搜索模块拆分（保持对等）

- 搜索引擎数据层抽取：`src/search-engines.js` 统一引擎数据/存储/URL 计算，UI 逻辑保留在 `src/search-engine-dropdown.js`。
- 搜索建议逻辑层抽取：`src/search/relevance.js` + `src/search/suggestions.js`，`src/script.js` 复用 service。
- 搜索建议 UI 抽取：`src/search/suggestions-ui.js` 统一“渲染/滚动加载/键盘导航/默认建议”，`src/script.js` 仅做 wiring。

### 搜索下拉（React 渲染点，保持对等）

- 搜索引擎下拉菜单 React 化（Portal）：新增 `src/ui/search-engine-dropdown-portal.jsx`，在 New Tab / Side Panel 中挂载下拉菜单 DOM（保留原有 class/结构/样式）。
- Legacy 下拉创建降级为 no-op：`src/search-engine-dropdown.js` 增加 `window.__USE_REACT_SEARCH_ENGINE_DROPDOWN__` 开关，避免 legacy 重复创建/重复绑定；并新增 `openSearchEnginesDialog()`/`getEngineDisplayName()` 供 React 复用。
- 状态同步：legacy 在 `createSearchEngineDropdown()` 末尾派发 `searchEnginesStateChanged`，React 监听该事件与 `defaultSearchEngineChanged` 刷新引擎列表。
- 修复 tabs active 不显示：`src/script.js` 对 `selectedSearchEngine` 做 lower-case 归一，避免历史值（如 `Google`）导致“找不到默认 tab → active 被清空”；并让 `updateSearchEngineIcon()` 兼容传入字符串。

### 关键问题修复

- 搜索引擎管理弹窗：暗色模式关闭按钮样式修复；缺失 i18n key（如 `perplexityLabel`）时回退显示内置 `displayName`（如 `Perplexity`）。
- 设置弹窗壁纸选中态修复：壁纸生效后新增持久化 `selectedWallpaper`（保存“选中的壁纸 URL”而非压缩后的 dataURL），并在初始化时做 URL 归一化匹配（忽略 query/hash），确保“当前正在使用”的壁纸选项边框（绿色 active）在刷新/重开设置弹窗后仍正确显示。
- 设置弹窗壁纸绿色边框不显示：在 `src/wallpaper.js` 增加 `syncActiveWallpaperOption()`，并在壁纸列表重建（`loadPresetWallpapers()`）及 `setWallpaper()` 成功后强制同步 active，避免上传后/刷新后/状态切换导致 active 丢失。
- 暗色模式下壁纸 active 不显示：`src/styles.css` 增加 `[data-theme="dark"] .wallpaper-option.active` 覆盖规则，修复暗色模式下被 `[data-theme="dark"] .wallpaper-option { border: ... }` 后写入覆盖导致的绿色边框丢失。

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

本轮额外验证点（上下文菜单副作用收敛）：
- New Tab：右键任意书签卡片 → 菜单正常出现；点击菜单内部不会立刻消失；点击页面空白处菜单关闭。
- New Tab：右键任意文件夹卡片 → 文件夹菜单正常出现；随后右键书签卡片 → 两种菜单切换/显示正常（不会因为创建书签菜单而把文件夹菜单 DOM 删掉）。
- Side Panel：重复以上两条路径至少一次，控制台无新增报错。

本轮额外验证点（Quick Links 显隐）：
- 打开设置弹窗 → 勾选/取消“快捷链接”开关：`.quick-links-wrapper` 应立即 show/hide，且刷新/重载后状态保持。
- New Tab 与 Side Panel 分别验证一次，确保控制台无新增报错。

本轮额外验证点（i18n fallback）：
- New Tab：右键书签/快捷链接打开上下文菜单，菜单项文案正常显示；设置弹窗/Toast 文案无异常。

本轮额外验证点（i18n substitutions）：
- New Tab：删除书签/快捷链接时确认弹窗文案中的标题插值正常（粗体标题/占位符不丢失）；“关于版本号”文案正常。

本轮额外验证点（搜索引擎下拉 React 化）：
- New Tab：点击搜索框左侧图标 → 下拉菜单出现/再次点击隐藏；点击页面空白处可关闭下拉。
- New Tab：在下拉中切换默认引擎 → 图标更新、Tab active 状态更新、搜索正常。
- New Tab：点击“添加搜索引擎” → 原有管理弹窗正常打开；在弹窗启用/禁用/新增自定义引擎后关闭弹窗 → 下拉列表与“本次使用”Tabs 同步更新。
- Side Panel：重复以上 3 条路径验证一次（确保无重复下拉/无重复事件导致的闪烁或无法关闭）。

本轮额外验证点（tabs active 修复）：
- New Tab：任意输入触发建议后显示 tabs，默认 tab 高亮始终存在；切换默认引擎后 tabs 高亮同步更新。
- Side Panel：同上。

本轮额外验证点（背景/壁纸初始化收敛）：
- New Tab：有壁纸时打开设置弹窗 → “背景色”选项不应被错误高亮；刷新后壁纸仍生效。
- New Tab：点击任意背景色 → 壁纸应被清除、背景色生效、欢迎文案颜色可读；刷新后背景色保持。
- Side Panel：重复以上 2 条路径验证一次（确保无重复监听导致的闪烁/状态错乱）。

本轮额外验证点（主题初始化收敛）：
- New Tab：刷新后主题（明/暗）保持；右上角主题切换按钮点击可切换，图标同步变化；无明显闪烁。
- New Tab：打开设置弹窗（点击齿轮）→ 关闭（关闭按钮/点击遮罩/Esc）均可用；切换任意 Tab 正常。
- Side Panel：重复以上 2 条路径验证一次。

本轮额外验证点（壁纸模块幂等初始化）：
- New Tab：刷新后立刻打开设置弹窗 → 壁纸列表可见，点击任意壁纸可生效（背景切换 + 绿色边框 active）。
- New Tab：上传壁纸 → 壁纸立刻生效且 active 正确；关闭设置弹窗再打开 → active 仍正确。
- Side Panel：重复以上 2 条路径验证一次；并确认控制台无重复绑定导致的多次 alert/多次触发。

本轮额外验证点（Onboarding / Welcome 幂等初始化）：
- New Tab：首次进入（清空 `localStorage.onboardingCompleted`）应自动弹出引导；点击 Prev/Next/圆点可切换步骤；最后一步按钮文案为 `finishButton` 对应 i18n。
- New Tab：欢迎文案可点击改名；刷新后名称保持；切换主题（明/暗）欢迎文字颜色仍可读、不会报错。
- Side Panel：重复以上两条路径至少一次，确认不会出现“重复绑定导致一次点击触发多次”的现象。

补充说明（本轮定位结果）：
- 当前 `src/index.html` / `src/sidepanel.html` 模板中没有引导弹层的 DOM（`#onboarding-overlay` 等），导致 `initOnboarding()` 之前会直接 return，从而不会出现引导、也不会写入 `localStorage.onboardingCompleted`。
- 已在 `src/onboarding.js` 内按既有 CSS class 动态注入缺失的引导 DOM，保证功能对等并可独立验证。

本轮补齐（Onboarding i18n / 主题适配）：
- 动态注入的引导 DOM 现在带 `data-i18n`，并在注入后调用 `updateUILanguage(overlay)`，确保文案可本地化。
- 新增 onboarding 相关 i18n key：`onboardingTitle` / `onboardingStep{1..3}{Title,Desc}` / `prevButton` / `nextButton` / `finishButton`（已覆盖 `_locales/*/messages.json`）。
- `src/styles.css` 增加 `[data-theme="dark"]` 下的 `.onboarding-modal/.onboarding-step/.dot` 覆盖，暗色模式下不再出现“白底引导”违和。

本轮额外验证点（Feature Tips 初始化收敛 / 去重绑定）：
- New Tab：清空 `localStorage.settingsUpdateTipShown` 后刷新页面：设置齿轮旁的 `.settings-update-tip` 显示与关闭正常；重复刷新不应出现“一次点击触发多次关闭/多次 setItem”。（注：New Tab 的 legacy 模板不包含 `.search-engine-update-tip`，因此清空 `searchEngineUpdateTipShown` 不会触发“搜索引擎更新提示”，会按原逻辑直接走 settings tip。）
- Side Panel：清空 `localStorage.searchEngineUpdateTipShown` 后打开侧边栏：`.search-engine-update-tip` 显示与关闭正常；关闭后应自动继续走 settings tip（与原逻辑一致）；重复刷新不应重复绑定导致闪烁或多次触发。
- 版本新功能弹窗（`.feature-tips`）：由 `localStorage.lastVersion` + `src/feature-tips.js#getVersionFeatures()` 控制，且仅在 `versionFeatures` 映射中存在“当前版本号”或落在版本区间时才会出现；当前 `manifest.json#version` 为 `1.2.0`，而映射示例为 `1.238/1.239`，因此仅清空 `lastVersion` 可能不会出现该类提示（属原有逻辑）。

本轮额外验证点（快捷入口/设置齿轮点击迁移）：
- New Tab：点击左下角四个图标（History/Downloads/Passwords/Extensions）应分别打开对应 `chrome://` 页面；控制台无报错。
- New Tab：点击右下角齿轮应打开设置弹窗；点击遮罩/关闭按钮/Esc 均可关闭。
- Side Panel：重复以上两条路径至少一次；确保不会出现“点击一次打开两次/闪烁”（避免 React 与 legacy 双重响应）。
