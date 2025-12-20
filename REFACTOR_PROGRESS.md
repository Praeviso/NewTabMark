# React + Tailwind + Vite 重构进度

## 当前状态

- **构建**：MV3 + Vite 多入口，New Tab / Side Panel / Background / Content Script 均从 `dist/` 运行
- **架构**：React 外壳挂载 + 遗留 DOM 模板 + 显式 bootstrap（legacy 逻辑驱动为主）
- **Tailwind 化**：已完成 16 个组件/容器迁移

## 已完成 Tailwind 化组件

| 组件 | 文件 | 说明 |
|------|------|------|
| Sidebar Container | `index.html` / `sidepanel.html` | `relative h-screen transition-[margin-left]`，保留 `collapsed` class |
| ToggleSidebar | `toggle-sidebar.jsx` | React 化 + Tailwind，`fixed bottom-8 z-[1000]` |
| ThemeToggle | `theme-toggle.jsx` | React 化 + Tailwind，`fixed right-8 top-[30%]` |
| LinksIcons | `links-icons.jsx` | history/downloads/passwords/extensions 链接 |
| SettingsIcon | `settings-icon.jsx` | 设置齿轮 + 更新提示气泡 |
| Quick Links Portal | `quick-links-portal.jsx` | 容器 `flex justify-center w-full` + 响应式 |
| Quick Links Item | `quick-links.js` | 圆形图标 + 文字标签 |
| YearProgress | `year-progress.jsx` | 年进度条，保留 legacy class 供动态调色 |
| Search Engine Dropdown | `search-engine-dropdown-portal.jsx` | 6 列网格 + 响应式 |
| Search Suggestions Portal | `search-suggestions-portal.jsx` | 建议列表 + tabs 切换 |
| More Button Toast | `more-button-toast.jsx` | `fixed top-[20%]` 居中 toast |
| Settings Modal Container | `index.html` / `sidepanel.html` | overlay `fixed inset-0 backdrop-blur`，content `rounded-xl shadow-md`，title/subtitle dark mode |
| Settings Modal Layout | `index.html` / `sidepanel.html` | `.settings-layout` flex mt-5，`.settings-sidebar` w-[210px] border-r，`.settings-content` flex-1 mx-5 |
| Settings Tab Buttons | `index.html` / `sidepanel.html` | 基础样式 Tailwind 化，保留 `.active` legacy class |
| Setting Option | `index.html` / `sidepanel.html` | `flex justify-between items-center mt-4 text-sm`，开关/标签布局 |

## 已完成其他重构

- **构建与入口**：Vite 多入口输出到 `dist/`，`manifest.json` 指向产物
- **React 外壳**：`LegacyAppShell` 注入 legacy DOM + bootstrap
- **Legacy 控制器废弃**：`progress.js` / `theme-controller.js` / `special-links-controller.js` 标记 `@deprecated`
- **初始化收敛**：`createLegacyBootstrap()` 幂等化，i18n 统一入口，AbortController 避免泄漏
- **搜索重构**：数据/UI 拆分，下拉 React 化，建议 UI dispose 能力
- **Quick Links 收敛**：controller 模式 + dispose 能力

## 未完成

### P0
- 逐模块 React 化：设置弹窗、Sidebar、书签卡片
- Side Panel：替换 `sidepanel-manager.js`

### P1
- 构建自洽：运行时不依赖 `src/`
- i18n 策略统一
- 移除废弃 legacy 代码

## 验证步骤

```bash
npm install && npm run build
```

1. `chrome://extensions` → Load unpacked → 项目根目录
2. 打开新标签页验证：侧边栏切换、主题切换、搜索、Quick Links
3. 改动后 `npm run build` + Reload 扩展
