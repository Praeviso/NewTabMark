// Search engine data + storage utilities (no DOM code).

export const ALL_ENGINES = [
  { name: 'google', icon: '../images/google-logo.svg', label: 'googleLabel', displayName: 'Google', url: 'https://www.google.com/search?q=', aliases: ['谷歌'] },
  { name: 'bing', icon: '../images/bing-logo.png', label: 'bingLabel', displayName: 'Bing', url: 'https://www.bing.com/search?q=' },
  { name: 'baidu', icon: '../images/baidu-logo.svg', label: 'baiduLabel', displayName: 'Baidu', url: 'https://www.baidu.com/s?wd=', aliases: ['百度'] },
  { name: 'kimi', icon: '../images/kimi-logo.svg', label: 'kimiLabel', displayName: 'Kimi', url: 'https://kimi.moonshot.cn/?q=', aliases: ['Kimi'] },
  { name: 'doubao', icon: '../images/doubao-logo.png', label: 'doubaoLabel', displayName: '豆包', url: 'https://www.doubao.com/search?q=', aliases: ['豆包'] },
  { name: 'chatgpt', icon: '../images/chatgpt-logo.svg', label: 'chatgptLabel', displayName: 'ChatGPT', url: 'https://chat.openai.com/?q=', aliases: ['ChatGPT'] },
  { name: 'felo', icon: '../images/felo-logo.svg', label: 'feloLabel', displayName: 'Felo', url: 'https://felo.me/search?q=', aliases: ['Felo'] },
  { name: 'metaso', icon: '../images/metaso-logo.png', label: 'metasoLabel', displayName: 'Metaso', url: 'https://metaso.cn/#/search?q=', aliases: ['Metaso'] },
  { name: 'perplexity', icon: '../images/perplexity-logo.svg', label: 'perplexityLabel', displayName: 'Perplexity', url: 'https://www.perplexity.ai/?q=', aliases: ['Perplexity'] },
  { name: 'semanticscholar', icon: '../images/semanticscholar-logo.png', label: 'semanticscholarLabel', displayName: 'Semantic Scholar', url: 'https://www.semanticscholar.org/search?q=', aliases: ['Semantic Scholar'] },
  { name: 'deepseek', icon: '../images/deepseek-logo.svg', label: 'deepseekLabel', displayName: 'DeepSeek', url: 'https://chat.deepseek.com/?q=', aliases: ['DeepSeek'] },
  { name: 'yahoo', icon: '../images/yahoo-logo.svg', label: 'yahooLabel', displayName: 'Yahoo', url: 'https://search.yahoo.com/search?p=', aliases: ['雅虎'] },
  { name: 'duckduckgo', icon: '../images/duckduckgo-logo.svg', label: 'duckduckgoLabel', displayName: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', aliases: ['DuckDuckGo'] },
  { name: 'yandex', icon: '../images/yandex-logo.svg', label: 'yandexLabel', displayName: 'Yandex', url: 'https://yandex.com/search/?text=', aliases: ['Yandex'] },
  { name: 'xiaohongshu', icon: '../images/xiaohongshu-logo.svg', label: 'xiaohongshuLabel', displayName: '小红书', url: 'https://www.xiaohongshu.com/search_result?keyword=', aliases: ['小红书'] },
  { name: 'jike', icon: '../images/jike-logo.svg', label: 'jikeLabel', displayName: '即刻', url: 'https://web.okjike.com/search?keyword=', aliases: ['即刻'] },
  { name: 'zhihu', icon: '../images/zhihu-logo.svg', label: 'zhihuLabel', displayName: '知乎', url: 'https://www.zhihu.com/search?q=', aliases: ['知乎'] },
  { name: 'douban', icon: '../images/douban-logo.svg', label: 'doubanLabel', displayName: '豆瓣', url: 'https://www.douban.com/search?q=', aliases: ['豆瓣'] },
  { name: 'bilibili', icon: '../images/bilibili-logo.svg', label: 'bilibiliLabel', displayName: 'Bilibili', url: 'https://search.bilibili.com/all?keyword=', aliases: ['Bilibili'] },
  { name: 'github', icon: '../images/github-logo.svg', label: 'githubLabel', displayName: 'GitHub', url: 'https://github.com/search?q=', aliases: ['GitHub'] }
];

export const ENGINE_CATEGORIES = {
  AI: ['kimi', 'doubao', 'chatgpt', 'perplexity', 'claude', 'felo', 'metaso', 'semanticscholar', 'deepseek'],
  SEARCH: ['google', 'bing', 'baidu', 'duckduckgo', 'yahoo', 'yandex'],
  SOCIAL: ['xiaohongshu', 'jike', 'zhihu', 'douban', 'bilibili', 'github']
};

export function getCustomEngines() {
  const stored = localStorage.getItem('customSearchEngines');
  return stored ? JSON.parse(stored) : [];
}

function setEnabledEngines(engines) {
  localStorage.setItem('enabledSearchEngines', JSON.stringify(engines));
}

function getAllEngines() {
  return [...ALL_ENGINES, ...getCustomEngines()];
}

export const SearchEngineManager = {
  getEnabledEngines() {
    const stored = localStorage.getItem('enabledSearchEngines');
    if (stored) return JSON.parse(stored);

    // 默认启用前 8 个搜索引擎（保留现有行为）
    const defaultEngines = ALL_ENGINES.slice(0, 8);
    setEnabledEngines(defaultEngines);
    return defaultEngines;
  },

  saveEnabledEngines(engines) {
    setEnabledEngines(engines);
  },

  getAllEngines() {
    return getAllEngines();
  },

  addEngine(engineName) {
    const enabled = this.getEnabledEngines();
    const engine = getAllEngines().find(e => e.name === engineName);
    if (engine && !enabled.find(e => e.name === engineName)) {
      enabled.push(engine);
      setEnabledEngines(enabled);
      return true;
    }
    return false;
  },

  removeEngine(engineName) {
    const enabled = this.getEnabledEngines();
    const filtered = enabled.filter(e => e.name !== engineName);
    if (filtered.length < enabled.length) {
      setEnabledEngines(filtered);
      return true;
    }
    return false;
  },

  getDefaultEngine() {
    const defaultEngineName = localStorage.getItem('selectedSearchEngine');
    console.log('[Search] Getting default engine, stored name:', defaultEngineName);

    if (defaultEngineName) {
      const allEngines = getAllEngines();
      const engine = allEngines.find(e => e.name === defaultEngineName);
      if (engine) {
        console.log('[Search] Found engine config:', engine);
        return engine;
      }
    }

    console.log('[Search] Using fallback engine (Google)');
    return ALL_ENGINES[0];
  },

  setDefaultEngine(engineName) {
    const allEngines = getAllEngines();
    const engine = allEngines.find(e => e.name === engineName);

    if (engine) {
      console.log('[Search] Setting default engine to:', engine);
      localStorage.setItem('selectedSearchEngine', engineName);
      return true;
    }

    console.error('[Search] Engine not found:', engineName);
    return false;
  }
};

export function getSearchUrl(engine, query) {
  const allEngines = getAllEngines();
  const engineConfig = allEngines.find(e => {
    return e.name.toLowerCase() === engine.toLowerCase() ||
      (e.aliases && e.aliases.some(alias => alias.toLowerCase() === engine.toLowerCase()));
  });

  if (!engineConfig) {
    const defaultEngine = SearchEngineManager.getDefaultEngine();
    return defaultEngine.url + encodeURIComponent(query);
  }

  const url = engineConfig.url.includes('%s')
    ? engineConfig.url.replace('%s', encodeURIComponent(query))
    : engineConfig.url + encodeURIComponent(query);

  return url;
}
