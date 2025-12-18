// 导入所需的依赖
import { ICONS, getIconHtml } from './icons.js';
import { ALL_ENGINES, ENGINE_CATEGORIES, SearchEngineManager, getCustomEngines, getSearchUrl } from './search-engines.js';

let initialized = false;
let globalCloseHandlerBound = false;

function bindGlobalDropdownCloseHandler() {
  if (globalCloseHandlerBound) return;
  globalCloseHandlerBound = true;

  document.addEventListener('click', () => {
    const dropdownContainer = document.querySelector('.search-engine-dropdown');
    if (dropdownContainer) {
      dropdownContainer.style.display = 'none';
    }
  });
}

function bindIconToggleHandler(iconContainer) {
  if (!iconContainer) return;
  if (iconContainer.dataset.searchDropdownBound === 'true') return;
  iconContainer.dataset.searchDropdownBound = 'true';

  iconContainer.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdownContainer = document.querySelector('.search-engine-dropdown');
    if (!dropdownContainer) return;
    const isVisible = dropdownContainer.style.display === 'block';
    dropdownContainer.style.display = isVisible ? 'none' : 'block';
  });
}

// Search engine data + store is extracted into ./search-engines.js (keep UI logic here).

function getEngineDisplayName(engine) {
  if (!engine) return '';

  if (engine.isCustom) {
    return engine.label || engine.name || '';
  }

  if (engine.label && typeof window.getLocalizedMessage === 'function') {
    const localized = window.getLocalizedMessage(engine.label);
    if (localized && localized !== engine.label) return localized;
  }

  if (engine.displayName) return engine.displayName;
  return engine.name || '';
}

// 创建搜索引擎选项
function createSearchEngineOption(engine, isAddButton = false) {
  const option = document.createElement('div');
  option.className = 'search-engine-option';
  
  if (isAddButton) {
    option.innerHTML = `
      <div class="search-engine-option-content add-engine">
        ${getIconHtml('add_circle')}
        <span class="search-engine-option-label">${getLocalizedMessage('addSearchEngine')}</span>
      </div>
    `;
    option.addEventListener('click', () => {
      showSearchEnginesDialog(); // 使用新的显示对话框函数
    });
  } else {
    // 创建常规搜索引擎选项
    const engineDisplayName = getEngineDisplayName(engine);
    option.innerHTML = `
      <div class="search-engine-option-content">
        <img src="${engine.icon}" alt="${engineDisplayName}" class="search-engine-option-icon">
        <span class="search-engine-option-label">${engineDisplayName}</span>
      </div>
    `;
    option.onclick = () => handleSearchEngineSelection(engine);
  }

  return option;
}

// 处理搜索引擎选择
function handleSearchEngineSelection(engine) {
  console.log('[Search] Selecting engine:', engine);
  
  // 关闭下拉菜单
  const dropdownContainer = document.querySelector('.search-engine-dropdown');
  if (dropdownContainer) {
    dropdownContainer.style.display = 'none';
  }

  // 使用 SearchEngineManager 设置默认搜索引擎
  if (SearchEngineManager.setDefaultEngine(engine.name)) {
    console.log('[Search] Default engine set to:', engine);
    
    // 更新搜索引擎图标
    updateSearchEngineIcon(engine);

    // 更新标签栏状态
    updateTabsState(engine.name);

    // 立即更新搜索表单中的默认搜索引擎
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
      searchForm.setAttribute('data-current-engine', engine.name);
    }

    // 触发自定义事件
    const event = new CustomEvent('defaultSearchEngineChanged', {
      detail: { engine: engine }
    });
    document.dispatchEvent(event);
  } else {
    console.error('[Search] Failed to set default engine:', engine);
  }
}

// 更新标签栏状态
function updateTabsState(engineName) {
  const defaultEngine = engineName.toLowerCase();
  const tabs = document.querySelectorAll('.tab');
  
  // 先移除所有 active 类
  tabs.forEach(tab => tab.classList.remove('active'));
  
  // 尝试找到对应的标签并添加 active 类
  const matchingTab = Array.from(tabs).find(tab => {
    const tabEngine = tab.getAttribute('data-engine').toLowerCase();
    return tabEngine === defaultEngine;
  });

  if (matchingTab) {
    matchingTab.classList.add('active');
  }
  // 如果是自定义引擎，可能没有对应的标签，这是正常的
}

// 修改初始化函数
function initializeSearchEngine() {
  console.log('[Search] Initializing search engine');
  
  initializeSearchEngineUI();
}

// 新增 UI 初始化函数
function initializeSearchEngineUI() {
  const defaultEngine = SearchEngineManager.getDefaultEngine();
  console.log('[Search] Default engine:', defaultEngine);
  
  if (defaultEngine) {
    console.log('[Search] Updating UI for engine:', defaultEngine.name);
    
    // 确保搜索表单和图标元素存在
    const searchForm = document.querySelector('.search-form');
    const searchEngineIcon = document.getElementById('search-engine-icon');
    
    if (searchForm && searchEngineIcon) {
      // 更新搜索引擎图标
      updateSearchEngineIcon(defaultEngine);
      
      // 更新标签栏状态
      updateTabsState(defaultEngine.name);
      
      // 更新搜索表单中的默认搜索引擎
      searchForm.setAttribute('data-current-engine', defaultEngine.name);
      
      // 确保图标正确加载
      if (searchEngineIcon.src !== defaultEngine.icon) {
        searchEngineIcon.src = defaultEngine.icon;
        searchEngineIcon.alt = `${getEngineDisplayName(defaultEngine)} Search`;
      }
      
      console.log('[Search] UI successfully updated for engine:', defaultEngine.name);
    } else {
      console.error('[Search] Required DOM elements not found');
    }
  } else {
    console.warn('[Search] No default engine found, using fallback');
  }
}

// 修改 createTemporarySearchTabs 函数中的点击事件处理
function createTemporarySearchTabs() {
  const tabsContainer = document.getElementById('tabs-container');
  if (!tabsContainer) return;

  // 保留搜索提示文本
  const searchTips = tabsContainer.querySelector('.search-tips');
  tabsContainer.innerHTML = '';
  if (searchTips) {
    tabsContainer.appendChild(searchTips);
  }

  // 获取启用的搜索引擎
  const enabledEngines = SearchEngineManager.getEnabledEngines();
  const defaultEngine = SearchEngineManager.getDefaultEngine();

  // 为每个启用的搜索引擎创建标签
  enabledEngines.forEach(engine => {
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.setAttribute('data-engine', engine.name);
    
    if (engine.name === defaultEngine.name) {
      tab.classList.add('active');
    }

    if (engine.label) {
      const label = getEngineDisplayName(engine) || engine.name;
      tab.textContent = label;
    } else {
      tab.textContent = engine.name;
    }

    tab.addEventListener('click', function() {
      const searchInput = document.querySelector('.search-input');
      const searchQuery = searchInput.value.trim();
      
      if (searchQuery) {
        // 移除所有标签的激活状态
        tabsContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        // 为当前点击的标签添加激活状态
        this.classList.add('active');

        // 执行搜索
        const searchUrl = getSearchUrl(engine.name, searchQuery);
        window.open(searchUrl, '_blank');
        
        // 隐藏搜索建议
        const searchSuggestions = document.querySelector('.search-suggestions-wrapper');
        if (searchSuggestions) {
          searchSuggestions.style.display = 'none';
        }
        
        // 延迟恢复默认搜索引擎状态
        setTimeout(() => {
          const defaultEngine = SearchEngineManager.getDefaultEngine();
          tabsContainer.querySelectorAll('.tab').forEach(t => {
            if (t.getAttribute('data-engine') === defaultEngine.name) {
              t.classList.add('active');
            } else {
              t.classList.remove('active');
            }
          });
        }, 300);
      }
    });

    tabsContainer.appendChild(tab);
  });
}

// 修改 createSearchEngineDropdown 函数，添加对临时搜索标签的更新
function createSearchEngineDropdown() {
  console.log('[Search] Creating dropdown menu');
  
  initializeSearchEngine();
  createDropdownUI();
  createTemporarySearchTabs();
}

// 新增下拉菜单 UI 创建函数
function createDropdownUI() {
  // 将原来 createSearchEngineDropdown 中的 UI 创建代码移到这里
  const existingDropdown = document.querySelector('.search-engine-dropdown');
  if (existingDropdown) {
    existingDropdown.remove();
  }
  
  const searchForm = document.querySelector('.search-form');
  const iconContainer = document.querySelector('.search-icon-container');
  if (!searchForm || !iconContainer) return;
  const dropdownContainer = document.createElement('div');
  dropdownContainer.className = 'search-engine-dropdown';
  dropdownContainer.style.display = 'none';

  // 创建选项容器
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'search-engine-options-container';

  // 获取启用的搜索引擎列表
  const enabledEngines = SearchEngineManager.getEnabledEngines();

  // 添加启用的搜索引擎选项
  enabledEngines.forEach(engine => {
    const option = createSearchEngineOption(engine);
    optionsContainer.appendChild(option);
  });

  // 添加"添加搜索引擎"选项
  const addOption = createSearchEngineOption(null, true);
  optionsContainer.appendChild(addOption);

  bindIconToggleHandler(iconContainer);
  bindGlobalDropdownCloseHandler();

  dropdownContainer.appendChild(optionsContainer);
  searchForm.appendChild(dropdownContainer);
}

// 添加显示搜索引擎对话框的函数
function showSearchEnginesDialog() {
  const dialog = document.getElementById('search-engines-dialog');
  if (!dialog) return;

  // 生成搜索引擎列表
  createSearchEnginesList();

  // 显示对话框
  dialog.style.display = 'block';

  // 添加关闭按钮事件
  const closeButton = dialog.querySelector('.close-button');
  if (closeButton) {
    closeButton.onclick = () => {
      dialog.style.display = 'none';
      // 关闭对话框时也更新下拉菜单
      createSearchEngineDropdown();
    };
  }

  // 点击对话框外部关闭
  dialog.onclick = (e) => {
    if (e.target === dialog) {
      dialog.style.display = 'none';
      // 关闭对话框时也更新下拉菜单
      createSearchEngineDropdown();
    }
  };

  // 阻止对话框内容区域的点击事件冒泡
  const modalContent = dialog.querySelector('.modal-content');
  if (modalContent) {
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
}

// 修改创建搜索引擎列表函数
function createSearchEnginesList() {
  const aiContainer = document.getElementById('ai-search-engines');
  const searchContainer = document.getElementById('search-engines');
  const socialContainer = document.getElementById('social-media-engines');
  
  if (!aiContainer || !searchContainer || !socialContainer) return;

  // 清空所有容器的现有内容
  aiContainer.innerHTML = '';
  searchContainer.innerHTML = '';
  socialContainer.innerHTML = '';

  // 获取已启用的搜索引擎
  const enabledEngines = SearchEngineManager.getEnabledEngines();
  const enabledEngineNames = enabledEngines.map(e => e.name);

  // 修改创建搜索引擎项目的函数
  const createEngineItem = (engine) => {
    const engineItem = document.createElement('div');
    engineItem.className = 'search-engine-item';

    const checkboxContainer = document.createElement('label');
    checkboxContainer.className = 'custom-checkbox';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = enabledEngineNames.includes(engine.name);

    const checkmark = document.createElement('span');
    checkmark.className = 'checkmark';

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(checkmark);

    const engineInfo = document.createElement('div');
    engineInfo.className = 'search-engine-info';

    const engineIcon = document.createElement('img');
    engineIcon.src = engine.icon;
    engineIcon.alt = getEngineDisplayName(engine);
    engineIcon.className = 'search-engine-icon';

    const engineName = document.createElement('span');
    engineName.className = 'search-engine-name';
    engineName.textContent = getEngineDisplayName(engine);

    engineInfo.appendChild(engineIcon);
    engineInfo.appendChild(engineName);

    engineItem.appendChild(checkboxContainer);
    engineItem.appendChild(engineInfo);

    // 简化事件处理逻辑
    const toggleEngine = (e) => {
      // 获取实际的复选框元素
      const checkbox = e.currentTarget.querySelector('input[type="checkbox"]');
      
      // 排除删除按钮和复选框本身的点击
      if (e.target.closest('.delete-custom-engine') || e.target === checkbox) {
        return;
      }

      // 切换复选框状态
      checkbox.checked = !checkbox.checked;
      
      // 触发change事件以同步状态
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      
      // 更新样式和状态
      e.currentTarget.classList.toggle('selected', checkbox.checked);
      handleEngineToggle(engine, checkbox.checked);
    };

    // 为整个项目添加点击事件
    engineItem.addEventListener('click', toggleEngine);
    
    // 移除复选框的点击事件阻止
    checkbox.addEventListener('change', (e) => {
      // 直接更新状态
      engineItem.classList.toggle('selected', e.target.checked);
      handleEngineToggle(engine, e.target.checked);
    });

    return engineItem;
  };

  // 填充每个分类
  ENGINE_CATEGORIES.AI.forEach(engineName => {
    const engine = ALL_ENGINES.find(e => e.name === engineName);
    if (engine) {
      aiContainer.appendChild(createEngineItem(engine));
    }
  });

  ENGINE_CATEGORIES.SEARCH.forEach(engineName => {
    const engine = ALL_ENGINES.find(e => e.name === engineName);
    if (engine) {
      searchContainer.appendChild(createEngineItem(engine));
    }
  });

  ENGINE_CATEGORIES.SOCIAL.forEach(engineName => {
    const engine = ALL_ENGINES.find(e => e.name === engineName);
    if (engine) {
      socialContainer.appendChild(createEngineItem(engine));
    }
  });
}

// 处理搜索引擎启用/禁用
function handleEngineToggle(engine, enabled) {
  if (enabled) {
    SearchEngineManager.addEngine(engine.name);
  } else {
    SearchEngineManager.removeEngine(engine.name);
  }
  // 更新下拉菜单和临时搜索标签
  createSearchEngineDropdown();
  createTemporarySearchTabs();
}

// 修改 initCustomEngineForm 函数
function initCustomEngineForm() {
  const addButton = document.getElementById('add-custom-engine');
  if (!addButton) return;

  addButton.addEventListener('click', async () => {
    const nameInput = document.getElementById('custom-engine-name');
    const urlInput = document.getElementById('custom-engine-url');
    const iconInput = document.getElementById('custom-engine-icon');

    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    let icon = iconInput.value.trim();

    if (!name) {
      alert(chrome.i18n.getMessage('searchEngineNameRequired'));
      return;
    }
    if (!url) {
      alert(chrome.i18n.getMessage('searchEngineUrlRequired'));
      return;
    }
    if (!url.includes('%s')) {
      alert(chrome.i18n.getMessage('searchEngineUrlInvalid'));
      return;
    }

    // 将 %s 替换为实际的查询参数占位符
    const processedUrl = url.includes('%s') ? url : `${url}${url.includes('?') ? '&' : '?'}q=%s`;

    const customEngine = {
      name: `custom_${Date.now()}`,
      label: name,
      url: processedUrl,
      icon: icon,
      isCustom: true
    };

    // 保存自定义搜索引擎
    await saveCustomEngine(customEngine);

    // 清空输入框
    nameInput.value = '';
    urlInput.value = '';
    iconInput.value = '';

    // 刷新自定义搜索引擎列表
    refreshCustomEngines();

    // 添加成功提示
    alert(chrome.i18n.getMessage('searchEngineAddSuccess'));
  });

  // 添加 URL 输入框的实时图标预览
  const urlInput = document.getElementById('custom-engine-url');
  const iconInput = document.getElementById('custom-engine-icon');
  
  urlInput.addEventListener('blur', async () => {
    const url = urlInput.value.trim();
    const nameInput = document.getElementById('custom-engine-name');
    const name = nameInput.value.trim();
    
    if (url && !iconInput.value.trim()) {
      // 显示加载动画
      const loadingIcon = document.createElement('div');
      loadingIcon.className = 'icon-loading-spinner';
      iconInput.parentNode.insertBefore(loadingIcon, iconInput.nextSibling);
      iconInput.classList.add('loading');

      try {
        const favicon = await getFavicon(url);
        iconInput.value = favicon || generateTextIcon(name || new URL(url).hostname);
      } finally {
        // 移除加载动画
        iconInput.classList.remove('loading');
        if (loadingIcon) {
          loadingIcon.remove();
        }
      }
    }
  });
}

// 修改文本图标生成函数
function generateTextIcon(name) {
  // 获取首个有效字符
  let firstChar = name.trim().charAt(0);
  
  // 如果是中文，直接使用
  // 如果是英文，转换为大写
  // 如果有空格，获取第一个单词的首字母
  if (/^[\u4e00-\u9fa5]/.test(firstChar)) {
    // 是中文字符
    firstChar = firstChar;
  } else {
    // 非中文字符，获取第一个单词并转大写
    firstChar = name.trim().split(/\s+/)[0].charAt(0).toUpperCase();
  }

  // 创建 SVG 图标
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
      <rect width="40" height="40" rx="8" fill="#f0f0f0"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${/^[\u4e00-\u9fa5]/.test(firstChar) ? '18' : '20'}"
        font-weight="bold"
        fill="#666"
        text-anchor="middle"
        dominant-baseline="central"
      >
        ${firstChar}
      </text>
    </svg>
  `;

  // 转换 SVG 为 data URL
  const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
  return URL.createObjectURL(svgBlob);
}

// 修改 getFavicon 函数
async function getFavicon(url) {
  try {
    // 尝试从多个可能的来源获取图标
    const domain = new URL(url).hostname;
    const iconSources = [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      `https://icon.horse/icon/${domain}`,
      `https://${domain}/favicon.ico`
    ];

    // 测试图标是否可用
    for (const src of iconSources) {
      try {
        const response = await fetch(src);
        if (response.ok) {
          return src;
        }
      } catch (e) {
        continue;
      }
    }
    
    // 如果所有图标源都失败，返回文本图标
    return null;
  } catch (e) {
    return null;
  }
}

// 修改 saveCustomEngine 函数
async function saveCustomEngine(engine) {
  try {
    // 如果没有提供图标，尝试获取网站图标
    if (!engine.icon) {
      const favicon = await getFavicon(engine.url);
      engine.icon = favicon || generateTextIcon(engine.label);
    }

    const customEngines = getCustomEngines();
    customEngines.push(engine);
    localStorage.setItem('customSearchEngines', JSON.stringify(customEngines));
    
    // 自动启用新添加的搜索引擎
    SearchEngineManager.addEngine(engine.name);
    // 立即更新下拉菜单
    createSearchEngineDropdown();
  } catch (error) {
    console.error('Error saving custom engine:', error);
    // 使用文本图标作为后备
    engine.icon = generateTextIcon(engine.label);
    const customEngines = getCustomEngines();
    customEngines.push(engine);
    localStorage.setItem('customSearchEngines', JSON.stringify(customEngines));
    // 立即更新下拉菜单
    createSearchEngineDropdown();
  }
}

// 修改 deleteCustomEngine 函数
function deleteCustomEngine(engineId) {
  if (confirm(chrome.i18n.getMessage('searchEngineDeleteConfirm'))) {
    const customEngines = getCustomEngines();
    const filtered = customEngines.filter(e => e.name !== engineId);
    localStorage.setItem('customSearchEngines', JSON.stringify(filtered));
    
    // 如果该引擎已启用，则从启用列表中移除
    SearchEngineManager.removeEngine(engineId);
    // 立即更新下拉菜单
    createSearchEngineDropdown();
    
    refreshCustomEngines();
  }
}

// 刷新自定义搜索引擎列表
function refreshCustomEngines() {
  const container = document.getElementById('custom-engines');
  if (!container) return;

  container.innerHTML = '';
  const customEngines = getCustomEngines();
  const enabledEngines = SearchEngineManager.getEnabledEngines();
  const enabledEngineNames = enabledEngines.map(e => e.name);

  customEngines.forEach(engine => {
    const engineItem = document.createElement('div');
    engineItem.className = 'search-engine-item';

    const checkboxContainer = document.createElement('label');
    checkboxContainer.className = 'custom-checkbox';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = enabledEngineNames.includes(engine.name);

    const checkmark = document.createElement('span');
    checkmark.className = 'checkmark';

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(checkmark);

    const engineInfo = document.createElement('div');
    engineInfo.className = 'search-engine-info';

    const engineIcon = document.createElement('img');
    engineIcon.src = engine.icon;
    engineIcon.alt = engine.label;
    engineIcon.className = 'search-engine-icon';

    const engineName = document.createElement('span');
    engineName.className = 'search-engine-name';
    engineName.textContent = engine.label;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-custom-engine';
    deleteButton.innerHTML = '×';
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      deleteCustomEngine(engine.name);
    };

    engineInfo.appendChild(engineIcon);
    engineInfo.appendChild(engineName);
    engineItem.appendChild(checkboxContainer);
    engineItem.appendChild(engineInfo);
    engineItem.appendChild(deleteButton);

    // 简化事件处理逻辑
    const toggleEngine = (e) => {
      // 获取实际的复选框元素
      const checkbox = e.currentTarget.querySelector('input[type="checkbox"]');
      
      // 排除删除按钮和复选框本身的点击
      if (e.target.closest('.delete-custom-engine') || e.target === checkbox) {
        return;
      }

      // 切换复选框状态
      checkbox.checked = !checkbox.checked;
      
      // 触发change事件以同步状态
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      
      // 更新样式和状态
      e.currentTarget.classList.toggle('selected', checkbox.checked);
      handleEngineToggle(engine, checkbox.checked);
    };

    // 为整个项目添加点击事件
    engineItem.addEventListener('click', toggleEngine);
    
    // 移除复选框的点击事件阻止
    checkbox.addEventListener('change', (e) => {
      // 直接更新状态
      engineItem.classList.toggle('selected', e.target.checked);
      handleEngineToggle(engine, e.target.checked);
    });

    container.appendChild(engineItem);
  });
}

// 创建新的初始化函数
function initializeSearchEngineDialog() {
  const dialog = document.getElementById('search-engines-dialog');
  if (dialog) {
    const closeButton = dialog.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        dialog.style.display = 'none';
      });
    }
    
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.style.display = 'none';
      }
    });

    const modalContent = dialog.querySelector('.modal-content');
    if (modalContent) {
      modalContent.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }

  // 初始化自定义搜索引擎表单
  initCustomEngineForm();
  // 刷新自定义搜索引擎列表
  refreshCustomEngines();
}

function initSearchEngineDropdown() {
  if (initialized) return;
  initialized = true;

  createSearchEngineDropdown();
  initializeSearchEngineDialog();
}

// 修改 updateSearchEngineIcon 函数
function updateSearchEngineIcon(engine) {
  console.log('[Icon] Updating icon for engine:', engine);
  const searchEngineIcon = document.getElementById('search-engine-icon');
  if (!searchEngineIcon) {
    console.error('[Icon] Search engine icon element not found');
    return;
  }
  
  if (!engine) {
    console.error('[Icon] No engine provided');
    return;
  }

  if (!engine.icon) {
    console.warn('[Icon] No icon path for engine:', engine.name);
    searchEngineIcon.src = '../images/placeholder-icon.svg';
    return;
  }

  searchEngineIcon.src = engine.icon;
  searchEngineIcon.alt = `${getEngineDisplayName(engine)} Search`;
  
  // 添加错误处理
  searchEngineIcon.onerror = () => {
    console.warn('[Icon] Failed to load icon:', engine.icon);
    searchEngineIcon.src = '../images/placeholder-icon.svg';
  };

  console.log('[Icon] Successfully updated icon to:', engine.icon);
}

// 在文件末尾统一导出所有需要的函数和变量
export { 
  SearchEngineManager, 
  updateSearchEngineIcon, 
  createSearchEngineDropdown, 
  initializeSearchEngineDialog,
  initSearchEngineDropdown,
  getSearchUrl
};
