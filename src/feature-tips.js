import { ICONS } from './icons.js';
import { getLocalizedMessageSafe, updateUILanguage } from './localization.js';

// 新功能提示管理类
class FeatureTips {
  constructor() {
    this.fadeOutDuration = 300; // 淡出动画时长(毫秒)
    void this.init();
  }

  getMessage(messageName, fallback = messageName, substitutions) {
    return getLocalizedMessageSafe(messageName, fallback, substitutions);
  }

  bindCloseOnce(tipContainer, onClose) {
    if (!tipContainer) return false;

    const closeButton = tipContainer.querySelector('.tip-close');
    if (!closeButton) return false;

    if (tipContainer.dataset.closeBound === 'true') return true;
    tipContainer.dataset.closeBound = 'true';

    closeButton.addEventListener('click', onClose);
    return true;
  }

  // 初始化
  async init() {
    this.currentVersion = await this.getExtensionVersion();
    await this.checkVersionUpdate();
  }

  // 获取扩展版本号
  async getExtensionVersion() {
    const manifest = chrome.runtime.getManifest();
    return manifest.version;
  }

  // 检查版本更新
  async checkVersionUpdate() {
    const lastVersion = localStorage.getItem('lastVersion');
    console.log('Current version:', this.currentVersion, 'Last version:', lastVersion); // 调试日志

    if (!lastVersion || this.isNewerVersion(this.currentVersion, lastVersion)) {
      const features = await this.getVersionFeatures(lastVersion, this.currentVersion);

      for (const feature of features) {
        this.checkShowTips(feature);
      }

      localStorage.setItem('lastVersion', this.currentVersion);
    }
  }

  // 比较版本号
  isNewerVersion(current, last) {
    if (!last) return true;

    const currentParts = current.split('.').map(Number);
    const lastParts = last.split('.').map(Number);

    for (let i = 0; i < currentParts.length; i++) {
      if (currentParts[i] > (lastParts[i] || 0)) return true;
      if (currentParts[i] < (lastParts[i] || 0)) return false;
    }
    return false;
  }

  // 获取版本之间的新功能
  getVersionFeatures(lastVersion, currentVersion) {
    const versionFeatures = {
      '1.238': ['bookmarkCleanup'],
      '1.239': ['sidebarFeatures']
    };

    const features = [];

    if (!lastVersion) {
      const currentFeatures = versionFeatures[currentVersion];
      return currentFeatures ? currentFeatures : [];
    }

    for (const [version, featureList] of Object.entries(versionFeatures)) {
      if (
        this.isNewerVersion(version, lastVersion) &&
        !this.isNewerVersion(version, currentVersion)
      ) {
        features.push(...featureList);
      }
    }

    return features;
  }

  // 检查是否需要显示特定功能的提示
  checkShowTips(featureKey) {
    const storageKey = `hasShown${featureKey}Tips`;
    const hasShownTips = localStorage.getItem(storageKey);

    console.log('Checking tips for:', featureKey, 'hasShownTips:', hasShownTips); // 调试日志

    if (!hasShownTips) {
      this.showTips(featureKey);
      localStorage.setItem(storageKey, 'true');
    }
  }

  // 显示新功能提示 - 通过自定义事件触发 React 组件
  showTips(featureKey) {
    console.log('Showing tips for:', featureKey);

    // Dispatch custom event for React FeatureTipsPortal to handle
    window.dispatchEvent(new CustomEvent('ntm:show-feature-tip', {
      detail: { featureKey }
    }));
  }

  // closeTips 已迁移到 React FeatureTips 组件

  // 显示搜索引擎更新提示
  showSearchEngineUpdateTip() {
    const searchTipShown = localStorage.getItem('searchEngineUpdateTipShown') === 'true';
    if (searchTipShown) {
      this.showSettingsUpdateTip();
      const searchTip = document.querySelector('.search-engine-update-tip');
      if (searchTip) {
        searchTip.style.display = 'none';
      }
      return;
    }

    const tipContainer = document.querySelector('.search-engine-update-tip');
    if (!tipContainer) {
      // New Tab does not include the search-engine tip; fall back to settings tip.
      this.showSettingsUpdateTip();
      return;
    }

    if (tipContainer) {
      tipContainer.style.display = 'block';

      // legacy DOM 可能被重复注入；避免重复绑定 close
      this.bindCloseOnce(tipContainer, () => {
        tipContainer.classList.add('tip-fade-out');
        setTimeout(() => {
          tipContainer.style.display = 'none';
          localStorage.setItem('searchEngineUpdateTipShown', 'true');
          this.showSettingsUpdateTip();
        }, 300);
      });

      // tip DOM 可能在 initLocalization 之后才注入；兜底刷新一次 i18n
      updateUILanguage(tipContainer);
    }
  }

  // 显示设置更新提示 - 通过事件触发 React 组件
  showSettingsUpdateTip() {
    const settingsTipShown = localStorage.getItem('settingsUpdateTipShown') === 'true';
    if (settingsTipShown) {
      return;
    }

    // Dispatch event for React SettingsIcon component to handle
    window.dispatchEvent(new CustomEvent('ntm:show-settings-update-tip'));
  }

  // 初始化所有提示
  initAllTips() {
    const settingsTip = document.querySelector('.settings-update-tip');
    if (settingsTip) {
      settingsTip.style.display = 'none';
    }

    this.showSearchEngineUpdateTip();
  }
}

let instance = null;

export function initFeatureTips() {
  if (instance) return instance;
  instance = new FeatureTips();
  return instance;
}

// 给共享 bootstrap 用：确保 UI tips 按需展示（不影响 bookmark-cleanup 等仅需创建实例的场景）
export function initFeatureTipsUI() {
  return initFeatureTips().initAllTips();
}

// 兼容旧引用：避免 import 时自启动，需先调用 initFeatureTips()
export const featureTips = new Proxy(
  {},
  {
    get(_target, prop) {
      if (!instance) return undefined;
      return instance[prop];
    }
  }
);
