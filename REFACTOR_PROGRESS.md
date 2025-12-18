# React + Tailwind + Vite 重构进度

本文档用于记录从“原生 JS + 直连 HTML/CSS”迁移到“React + Tailwind CSS + Vite（MV3）”的重构进度、已完成项与未完成事项。

## 当前结论（摘要）

- 第一阶段（“可构建 + 可发布 + 入口切换”）已完成：新标签页/侧边栏/后台/内容脚本均通过 Vite 构建并从 `dist/` 运行。
- 视觉与交互对等采用“React 外壳 + 复用遗留 DOM + 显式启动遗留逻辑”的过渡方案（尚未把业务真正 React 组件化）。
- 迁移期的主线是“稳定 + 可拆分”：持续减少 import 副作用、全局事件覆盖与重复绑定，降低后续逐模块 React 化风险。

## 已完成（Done，精简总结）

### A) 构建与入口（MV3 + Vite）

- Vite 多入口：UI（`newtab.html`、`sidepanel.html`）+ `background.js` + `content.js`，统一 `npm run build` → `dist/`。
- `manifest.json` 全量指向 `dist/` 产物：New Tab / Side Panel / Service Worker / Content Script。
- 遗留资源处理：静态脚本拷贝到 `dist/legacy/`；遗留 CSS 通过 `src/legacy.css` 合并到 `dist/assets/style.css`（减少运行时散落引用）。

### B) 视觉对等（React 外壳复用遗留 DOM）

- 采用“React 外壳 + 复用遗留 DOM + 显式启动遗留逻辑”的过渡架构，确保 UI/布局对等。
- 抽出共享外壳 `LegacyAppShell`：统一“注入遗留 DOM + bootstrap + 初始化设置弹窗”，减少 New Tab/Side Panel 重复代码。

### B1) 首个模块 React 化（保持 UI/交互对等）

- 年度进度条（footer 的 `#year-progress`）改为 React 渲染（Portal 挂载到遗留容器），并从 legacy bootstrap 中移除 `initProgress()` 调用以避免重复渲染。
- Toast（`#more-button-toast`）改为 React 渲染其内部文案（Portal 挂载到遗留容器），不改动显示/隐藏逻辑（仍由遗留 `Utilities.showToast()` 控制 class）。
- “特殊链接”入口区（`.links-icons`）与“设置入口+更新提示”（`.settings-icon`）改为 React 渲染：为避免与遗留 HTML 重复，注入遗留 DOM 时会剔除这两块（`LegacyAppShell.stripSelectors`），然后由 React 直接渲染同结构节点；点击行为仍由遗留 `special-links-controller` 与 `feature-tips` 处理。
  - 修正迁移后的提示行为：`.settings-update-tip` 默认隐藏以避免刷新时闪现；在 New Tab 缺少 `.search-engine-update-tip` 时，`feature-tips` 会回退展示 `.settings-update-tip`，并保证关闭按钮只绑定一次、可写入 `settingsUpdateTipShown`。

### C) 初始化显式化与幂等化（为后续拆分做铺垫）

- 遗留逻辑统一显式启动并幂等（`initXxx()`），入口不再依赖 `DOMContentLoaded`。
- “设置/特殊链接/主题/壁纸”等关键交互控制器化并收敛：避免全局事件覆盖、重复绑定与时序不确定。
- `WelcomeManager` 逐步去全局化：新增 `getWelcomeManager()`，并保留兼容 `window.WelcomeManager`（仅缺省注入）。
- i18n（React 侧）先行对齐：新增 `getLocalizedMessageSafe()` 并让 React 组件复用同一套取文案逻辑；`updateUILanguage(root?)` 支持传入 root 以便后续做局部刷新/增量渲染。
- New Tab / Side Panel 的 legacy bootstrap 去重：抽出 `createLegacyBootstrap()` 统一初始化序列与 “run-once” 逻辑，减少入口重复与后续差异化迁移成本。
- 搜索模块拆分一小步：抽出 `src/search-engines.js` 承载“搜索引擎数据 + 本地存储 + URL 计算”，`search-engine-dropdown.js` 仅保留 UI/事件处理，方便后续把搜索 UI 逐步 React 化。
- 搜索工具函数去重：`src/script.js` 移除重复的 `getSearchUrl()` / `debounce()` 定义，统一改为复用 `src/search-engines.js#getSearchUrl()` 与 `src/utils/debounce.js`，减少后续拆分时的阴影覆盖与行为漂移风险。
- 搜索建议“相关性计算”抽取：新增 `src/search/relevance.js` 承载 `calculateRelevance()`（含 fuzzy/levenshtein），`src/script.js` 改为复用该实现，方便后续把搜索建议逻辑从 `script.js` 拆出。
- 搜索建议服务抽取：新增 `src/search/suggestions.js` 承载“历史/书签建议 + 用户行为加权排序 + 最近历史默认建议”，`src/script.js` 改为复用该模块并修正 focus 时的异步建议加载（避免把 Promise 误传给渲染函数）。
- 搜索建议遗留清理：移除 `src/script.js` 内一套重复/未使用的建议生成与用户行为逻辑；保留 `getRecentHistory()`/`getSuggestions()` 兼容壳函数，内部统一委托到 `src/search/suggestions.js`，减少后续继续拆分时的行为漂移风险。
- 搜索建议 UI 拆分：新增 `src/search/suggestions-ui.js` 承载“建议列表渲染/滚动加载/键盘导航/默认建议”等纯 UI 行为，`src/script.js` 只负责 wiring（传入 service + 回调），进一步收敛 `script.js` 复杂度，保持 UI/交互对等。

### D) 关键问题修复与稳定性增强

- 设置弹窗稳定化：点击可用、Tab 可切换、可关闭（按钮/遮罩/Esc），并规避重复绑定/全局 click 覆盖问题；兼容点击文字（TextNode）触发。
- Windows 交互兜底：支持 `Shift + 滚轮` 触发“返回上一级”（无触控板场景）。
- 悬浮球更稳：处理 bfcache（后退/前进）与状态同步，减少“返回后悬浮球消失”偶发。
- 年度进度条恢复“浮在背景上”观感：footer 透明（有/无壁纸都不出现浅色条带包裹），并保持主题切换下的文字/进度块可读性。
- 搜索引擎管理弹窗样式修复：关闭按钮在暗色模式不再被白色块包裹，并调整为顶部右侧更合理的点击区域（滚动时仍可见）。
- 搜索引擎文案回退修复：当 `_locales` 缺少某个 `xxxLabel` 时，不再直接展示 key（如 `perplexityLabel`），而是回退到内置 `displayName`（如 `Perplexity`）。

### E) 文档与仓库卫生

- README 补充“需 build 生成 dist 才能加载”说明；忽略 `dist/`。

## 当前实现方式（重要说明）

当前并未把业务完全 React 组件化，而是 React 负责挂载与引导：注入遗留 DOM → 显式 bootstrap 遗留模块 → 初始化控制器。该方案用于快速保证“功能/视觉对等”，并为后续逐模块 React 化提供落脚点。

## 未完成（Todo / 下一阶段）

### A) 真正的 React 迁移（逐模块替换遗留 DOM 操作）

- 新标签页逐模块组件化（建议从低耦合开始）：Sidebar、搜索（含引擎/建议）、Quick Links、书签列表/右键/拖拽、设置弹窗各 Tab。
- Side Panel React 化：逐步替换 `sidepanel-manager.js` 的 DOM 注入与事件绑定。
- 交付标准：React 负责渲染与交互；遗留模块降级为数据/能力层 helper 或被移除。

### B) 资源与构建“完全自洽”（减少对 src/ 的运行时依赖）

已将以下遗留资源纳入构建产物并从 `dist` 侧稳定引用（`dist/legacy/`）：

- 脚本：`theme-init.js`、`lodash.min.js`、`Sortable.min.js`、`qrcode.min.js`
- 样式：`critical.css`、`output.css`、`styles.css`、`sidepanel.css`

后续可继续收敛“发布包只包含 dist + images + locales”等（可选）：

- 明确/固化“发布时不带 src/”的策略（并确保运行时不再需要 `src/` 中任何静态文件）
- 若要进一步减少构建时警告与重复拷贝，可考虑将遗留静态资源迁移到 `public/` 或改为由 Vite 统一打包（需确保样式与原版对等）

交付标准：发布运行时不依赖 `src/` 下的静态脚本路径（或明确规定并固化该策略）。

### C) i18n（React 侧）与 data-i18n 机制整合

遗留方案基于 `data-i18n` 与 `chrome.i18n`：

- 需要定义 React 侧的 i18n 策略（继续复用 data-i18n，或引入 React i18n hook 并做映射）
- 已完成一小步：React 组件侧统一通过 `getLocalizedMessageSafe()` 提供首屏文案/tooltip，减少“先中文/空 title 后再被 data-i18n 覆盖”的闪现
- 迁移组件时要保持文案 key 与 `_locales/` 对齐

### D) 开发体验（可选增强）

- HMR/开发服务器与扩展 Reload 的联动（例如输出到 `dist/` 并自动刷新扩展）
- 拆分构建：`build:ui` / `build:scripts` / `build:all`，缩短迭代时间

### E) 发布与安全校验

- 手动回归清单（新标签页、书签操作、搜索、侧边栏、悬浮球、设置、主题/壁纸、i18n）
- `npm audit` 的依赖安全问题评估与处理（按需）

## 如何验证（当前版本）

1. `npm install`
2. `npm run build`
3. Chrome/Edge → `chrome://extensions` → 开发者模式 → Load unpacked → 选择仓库根目录
4. 打开新标签页与侧边栏进行手动回归；改动后重复 `npm run build` 并在扩展卡片点击 Reload

本轮新增验证点：
- Footer 年度进度条仍显示在底部（`#year-progress`），百分比与月份分段正常渲染；切换壁纸/主题后观感不变。
- 触发 toast 的场景（如复制链接提示）仍可弹出，且文案正常显示/隐藏。
- 右侧（或固定位置）的 History/Downloads/Passwords/Extensions 入口点击仍能打开对应的 `chrome://` 页面；点击设置齿轮仍能打开设置弹窗；设置更新提示仍按原逻辑显示与关闭。
- 非中文 UI 语言下：Links Icons 的 tooltip（title）与设置更新提示文案首屏即为对应语言，不需要等 `updateUILanguage()` 跑完再变化。
- 新标签页与侧边栏均可正常加载：书签/搜索/设置/壁纸/悬浮球等交互不受影响（仅初始化入口去重）。
- 搜索引擎功能不变：下拉切换默认引擎、生效的引擎 Tab、添加/删除自定义引擎与启用开关、输入关键词回车搜索均正常。
- 搜索建议/快捷键不变：输入触发建议列表（历史/书签/搜索建议），键盘上下选择与回车打开/搜索、以及输入防抖行为均正常。
- 搜索建议排序不变：同样输入下，建议列表的排序与打开行为保持一致（历史/书签结果仍按相关性优先）。
- 搜索建议交互不变：focus 时（输入框已有内容）能立即正确展示建议列表，不出现“空列表/闪一下就消失”的异常。
- 搜索建议相关控制台无异常：不会出现 `getBingSuggestions` / `balanceResults` 等遗留函数缺失导致的报错。
- 搜索建议 UI 行为不变：滚动到底自动加载更多建议、上下键选择/Enter 打开、Ctrl/Cmd + Enter 仍可“一次打开其它搜索引擎”。
- 暗色模式下打开“搜索引擎管理”弹窗：右上角关闭按钮无白色矩形底，位置与点击区域合理；滚动弹窗内容时关闭按钮仍在顶部可操作。
- 打开“搜索引擎管理”弹窗：`Perplexity` 选项显示为 `Perplexity`（而非 `perplexityLabel`）；下拉菜单与“本次使用”临时 Tabs 的引擎名称也一致。
