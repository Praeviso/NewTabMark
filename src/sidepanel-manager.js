class SidePanelManager {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
    this.isNavigating = false;
    this.didInit = false;
  }

  init() {
    if (!isSidePanelContext()) return;
    if (this.didInit) return;
    this.didInit = true;
    
    // 添加导航栏
    this.addNavigationBar();
    // 初始化事件监听
    this.initEventListeners();
  }

  addNavigationBar() {
    if (document.querySelector('.side-panel-nav')) return;

    const navBar = document.createElement('div');
    navBar.className = 'side-panel-nav';
    navBar.innerHTML = `
      <div class="nav-controls">
        <button id="back-btn" disabled>
          <span class="material-icons">arrow_back</span>
        </button>
        <button id="forward-btn" disabled>
          <span class="material-icons">arrow_forward</span>
        </button>
        <button id="refresh-btn">
          <span class="material-icons">refresh</span>
        </button>
        <button id="open-in-tab-btn">
          <span class="material-icons">open_in_new</span>
        </button>
      </div>
      <div class="url-container">
        <input type="text" id="url-input" class="url-input">
      </div>
    `;
    
    document.body.insertBefore(navBar, document.body.firstChild);
  }

  initEventListeners() {
    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const openInTabBtn = document.getElementById('open-in-tab-btn');
    if (!backBtn || !forwardBtn || !refreshBtn || !openInTabBtn) return;

    // 导航按钮事件
    backBtn.addEventListener('click', () => this.goBack());
    forwardBtn.addEventListener('click', () => this.goForward());
    refreshBtn.addEventListener('click', () => this.refresh());
    openInTabBtn.addEventListener('click', () => this.openInNewTab());
    
    // URL 输入框事件
    const urlInput = document.getElementById('url-input');
    if (!urlInput) return;
    urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.loadUrl(urlInput.value);
      }
    });

    // 监听消息
    installSidePanelMessageListener(this);
  }

  loadUrl(url) {
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    
    // 创建 iframe 来加载内容
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.className = 'sidepanel-content';
      
      // 清空现有内容
      mainContent.innerHTML = '';
      mainContent.appendChild(iframe);
      
      // 更新 URL 显示和历史记录
      this.updateUrlBar(url);
      this.addToHistory(url);
    }
  }

  goBack() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.loadUrl(this.history[this.currentIndex]);
      this.updateNavigationButtons();
    }
  }

  goForward() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      this.loadUrl(this.history[this.currentIndex]);
      this.updateNavigationButtons();
    }
  }

  refresh() {
    if (this.currentIndex >= 0) {
      this.loadUrl(this.history[this.currentIndex]);
    }
  }

  openInNewTab() {
    if (this.currentIndex >= 0) {
      chrome.tabs.create({ url: this.history[this.currentIndex] });
    }
  }

  addToHistory(url) {
    if (this.isNavigating) {
      this.isNavigating = false;
      return;
    }
    
    this.currentIndex++;
    this.history = this.history.slice(0, this.currentIndex);
    this.history.push(url);
    this.updateNavigationButtons();
  }

  updateNavigationButtons() {
    document.getElementById('back-btn').disabled = this.currentIndex <= 0;
    document.getElementById('forward-btn').disabled = this.currentIndex >= this.history.length - 1;
  }

  updateUrlBar(url) {
    document.getElementById('url-input').value = url;
  }
}

function isSidePanelContext() {
  return window.location.pathname.endsWith('sidepanel.html') ||
    window.location.search.includes('context=side_panel');
}

let didBindSidePanelMessageListener = false;
let sidePanelManagerRef = null;
function installSidePanelMessageListener(manager) {
  sidePanelManagerRef = manager;
  if (didBindSidePanelMessageListener) return;
  didBindSidePanelMessageListener = true;

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action !== 'updateUrl') return;
    if (!sidePanelManagerRef) return;
    sidePanelManagerRef.updateUrlBar(message.url);
    sidePanelManagerRef.addToHistory(message.url);
  });
}

let instance = null;

export function initSidePanelManager() {
  if (instance) return instance;
  instance = new SidePanelManager();
  instance.init();
  return instance;
}
