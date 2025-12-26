# React + Tailwind + Vite 重构进度

## 当前状态

- **构建**：MV3 + Vite 多入口，New Tab / Side Panel / Background / Content Script 均从 `dist/` 运行
- **架构**：React `App` + `LegacyAppShell` 注入遗留 DOM 模板 + 显式 bootstrap（legacy 逻辑驱动为主，UI 逐步用 Portal 替换）
- **UI 迁移**：已完成 38 项组件/容器迁移（React + Tailwind，见下表）
- **通信**：React ↔ legacy 以 `CustomEvent` 事件桥接为主（`ntm:*`）

> [!CAUTION]
> **深色模式注意事项**：本项目使用 `[data-theme="dark"]` CSS 选择器控制深色模式，**不要**使用 Tailwind 的 `dark:` 修饰符处理颜色。`dark:` 基于系统偏好，会导致 Chrome 深色 + 扩展浅色时颜色错乱。布局类（flex, gap, margin 等）可以正常使用 Tailwind。

## 已完成 UI 迁移（React + Tailwind）

| 组件 | 文件 | 说明 |
|------|------|------|
| Sidebar Container | `src/index.html` / `src/sidepanel.html` | `relative h-screen transition-[margin-left]`，保留 `collapsed` class |
| ToggleSidebar | `src/ui/toggle-sidebar.jsx` | React 化 + Tailwind，`fixed bottom-8 z-[1000]` |
| ThemeToggle | `src/ui/theme-toggle.jsx` | React 化 + Tailwind，`fixed right-8 top-[30%]` |
| LinksIcons | `src/ui/links-icons.jsx` | history/downloads/passwords/extensions 链接 |
| SettingsIcon | `src/ui/settings-icon.jsx` | 设置齿轮 + 更新提示气泡 |
| Quick Links Portal | `src/ui/quick-links-portal.jsx` | 容器 `flex justify-center w-full` + 响应式 |
| Quick Links Item | `src/quick-links.js` | 圆形图标 + 文字标签 |
| YearProgress | `src/ui/year-progress.jsx` | 年进度条，保留 legacy class 供动态调色 |
| Search Engine Dropdown | `src/ui/search-engine-dropdown-portal.jsx` | 6 列网格 + 响应式 |
| Search Suggestions Portal | `src/ui/search-suggestions-portal.jsx` | 建议列表 + tabs 切换 |
| More Button Toast | `src/ui/more-button-toast.jsx` | `fixed top-[20%]` 居中 toast |
| Settings Modal Container | `src/index.html` / `src/sidepanel.html` | overlay `fixed inset-0 backdrop-blur`，content `rounded-xl shadow-md`，title/subtitle dark mode |
| Settings Modal Layout | `src/index.html` / `src/sidepanel.html` | `.settings-layout` flex mt-5，`.settings-sidebar` w-[210px] border-r，`.settings-content` flex-1 mx-5 |
| Settings Tab Buttons | `src/index.html` / `src/sidepanel.html` | 基础样式 Tailwind 化，保留 `.active` legacy class |
| Setting Option | `src/index.html` / `src/sidepanel.html` | `flex justify-between items-center mt-4 text-sm`，开关/标签布局 |
| Settings Section Title | `src/index.html` / `src/sidepanel.html` | `text-sm font-medium my-3`，h4 小标题，颜色由 CSS 控制 |
| Settings Background Options | `src/index.html` / `src/sidepanel.html` | `flex flex-wrap gap-2.5 mb-5`，背景色选项容器 |
| SettingsSwitch | `src/ui/SettingsSwitch.jsx` / `src/ui/SettingsSwitchPortal.jsx` | React 化开关组件，Portal 挂载到设置弹窗，管理悬浮球/快捷链接/新标签页打开 |
| BackgroundOptions | `src/ui/BackgroundOption.jsx` / `src/ui/BackgroundOptionsPortal.jsx` | React 化背景色选项，Portal 挂载到设置弹窗外观设置，管理 7 种渐变背景切换 |
| SettingsTabButtons | `src/ui/SettingsTabButton.jsx` / `src/ui/SettingsTabsPortal.jsx` | React 化设置弹窗标签页按钮，Portal 挂载管理 6 个标签页切换 |
| WallpaperActions | `src/ui/WallpaperAction.jsx` / `src/ui/WallpaperActionsPortal.jsx` | React 化壁纸操作按钮，Portal 挂载管理恢复默认背景和上传壁纸功能 |
| WallpaperOptions | `src/ui/WallpaperOption.jsx` / `src/ui/WallpaperOptionsPortal.jsx` | React 化壁纸预设选项，Portal 挂载管理 10 个预设壁纸和用户上传壁纸选项 |
| BookmarkCleanupButton | `src/ui/BookmarkCleanupButton.jsx` / `src/ui/BookmarkCleanupButtonPortal.jsx` | React 化书签清理按钮，Portal 挂载到设置弹窗书签管理标签页 |
| AboutSettingsContent | `src/ui/AboutSettingsContent.jsx` / `src/ui/AboutSettingsPortal.jsx` | React 化关于页面内容，Portal 挂载显示版本号和描述信息 |
| Onboarding | `src/ui/Onboarding.jsx` / `src/ui/OnboardingPortal.jsx` | React 化引导弹窗，3 步引导流程，圆点导航，localStorage 持久化完成状态 |
| FeatureTips | `src/ui/FeatureTips.jsx` | React 化新功能提示（Portal 导出在同文件），版本检查、新功能检测、提示显示全部迁移到 React，自初始化 |
| SettingsModalController | `src/ui/SettingsModalController.jsx` | React 化设置弹窗控制器，管理打开/关闭、Escape 键关闭、点击外部关闭等事件处理，Quick Links 初始化 |
| Legacy Settings Cleanup | `src/ui/settings-modal-controller.js` → deprecated shim | 移除 bootstrap 初始化调用，简化为仅保留向后兼容的重定向函数 |
| WelcomeMessage | `src/ui/WelcomeMessage.jsx` / `src/ui/WelcomeMessagePortal.jsx` | React 化欢迎消息，基于时间的问候语、用户名编辑、背景亮度自适应文字颜色 |
| Legacy Welcome Cleanup | `src/welcome.js` → deleted | 移除 bootstrap 初始化调用，通过自定义事件触发 React 组件。文件已完全删除，调用方直接派发 `ntm:background-changed` 事件 |
| Settings Update Tip | `src/ui/settings-icon.jsx` / `src/ui/FeatureTips.jsx` | React 化设置更新提示，通过 `ntm:show-settings-update-tip` 事件触发显示，淡出动画关闭 |
| GestureNavigation | `src/ui/GestureNavigation.jsx` | React 化手势导航组件，支持触摸板双指滑动、滚轮水平滚动、Windows 触摸板导航返回父文件夹 |
| EditBookmarkDialog | `src/ui/EditBookmarkDialog.jsx` / `src/ui/EditBookmarkDialogPortal.jsx` | React 化书签编辑弹窗，通过 `ntm:open-edit-bookmark-dialog` 事件触发，`ntm:bookmark-updated` 事件通知更新 |
| ConfirmDialog | `src/ui/ConfirmDialog.jsx` / `src/ui/ConfirmDialogPortal.jsx` | React 化确认对话框，通过 `ntm:show-confirm-dialog` 事件触发，`ntm:confirm-dialog-closed` 事件通知关闭，用于所有删除确认 |
| Bookmarks Container | `src/index.html` / `src/sidepanel.html` | 布局 Tailwind 化 `bg-white rounded-xl shadow-md mx-auto`，动画保留在 CSS |
| Folder Name Breadcrumb | `src/index.html` / `src/sidepanel.html` | `flex items-center flex-wrap text-[13px]`，面包屑容器基础布局 |
| Sidebar Logo/Title | `src/index.html` / `src/sidepanel.html` | `flex items-center gap-2`，Logo `w-10 h-10`，Title `text-[26px] font-bold`，深色模式颜色保留在 CSS |
| Sidebar Category Items | `src/script.js` | `displayBookmarkCategories()` li 元素 Tailwind 化并修复 hover/高度，颜色保留在 CSS |
| Bookmark Card | `src/script.js` | `createBookmarkCard()` 卡片布局 Tailwind 化 `flex flex-row items-center rounded-lg p-3 h-12`，保留颜色 CSS |
| Folder Card | `src/script.js` | `createFolderCard()` 文件夹卡片布局 Tailwind 化，与书签卡片保持一致 |

## 已完成其他重构

- **构建与入口**：Vite 多入口输出到 `dist/`，`manifest.json` 指向产物
- **React 外壳**：`src/legacy/LegacyAppShell.jsx` 注入 legacy DOM + bootstrap
- **Legacy 控制器迁移/兼容**：
  - 已从 `createLegacyBootstrap()` 移除初始化：onboarding / progress / theme-controller / special-links / welcome / feature-tips / settings modal / bookmark cleanup / gesture navigation（由 React Portal/组件负责）
  - 已删除：`src/onboarding.js`、`src/progress.js`、`src/ui/theme-controller.js`、`src/ui/special-links-controller.js`、`src/welcome.js`、`src/feature-tips.js`、`src/bookmark-cleanup.js`、`src/ui/settings-modal-controller.js`、`src/gesture-navigation.js`、`src/settings.js`
  - 所有 deprecated shim 已完全清理，HTML script 标签已移除
- **Bootstrap 清理**：`bootstrap-legacy-shared.js` 移除了未使用的初始化调用
- **初始化收敛**：`createLegacyBootstrap()` 幂等化，i18n 统一入口，AbortController 避免泄漏
- **搜索重构**：数据/UI 拆分，下拉 React 化，建议 UI dispose 能力
- **Quick Links 收敛**：controller 模式 + dispose 能力
- **CSS 修复**：`.favicon img` 添加 `object-fit: contain` 修复图标形变

## 未完成

### P0 - 核心模块 React 化
- **Sidebar 完整 React 化**
  - `aside` 容器 + `#categories-list` 动态渲染迁移到 React 组件
  - Sortable.js 拖拽功能保留
  - 展开/折叠状态管理
- **书签卡片 Tailwind 化**
  - `createBookmarkCard()` / `createFolderCard()` 卡片样式 Tailwind 化
  - 保留颜色相关 CSS（深色模式）

### P1 - 构建与清理
- 构建自洽：运行时不依赖 `src/`
- i18n 策略统一
- 移除废弃 legacy 代码（清理 `output.css` 中已被 Tailwind 替代的样式）

## 验证步骤

```bash
# 首次安装依赖（会触发 postinstall 自动构建 dist/）
npm ci

# 修改代码后手动构建
npm run build
```

1. `chrome://extensions` → Load unpacked → 项目根目录
2. 打开新标签页验证：侧边栏切换、主题切换、搜索、Quick Links
3. 改动后 `npm run build` + Reload 扩展
