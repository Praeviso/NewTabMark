// 获取用户首选语言
function getUserLanguage() {
  return chrome.i18n.getUILanguage();
}

function getLocalizedMessage(messageName) {
  // 访问一次确保 chrome.i18n 可用（保留原有结构，避免未来需要 userLang）
  getUserLanguage();

  const message = chrome.i18n.getMessage(messageName);

  if (!message) return messageName;
  return message;
}

function updateUILanguage() {
  getUserLanguage();

  // 处理常规的 data-i18n 属性
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const messageName = element.getAttribute('data-i18n');
    const localizedMessage = getLocalizedMessage(messageName);
    element.textContent = localizedMessage;
  });

  // 处理 placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const messageName = element.getAttribute('data-i18n-placeholder');
    element.placeholder = getLocalizedMessage(messageName);
  });

  // 处理 title
  document.querySelectorAll('[data-i18n-title]').forEach((element) => {
    const messageName = element.getAttribute('data-i18n-title');
    element.title = getLocalizedMessage(messageName);
  });
}

let initialized = false;

export function initLocalization() {
  if (initialized) return;
  initialized = true;

  if (typeof window.getLocalizedMessage !== 'function') {
    window.getLocalizedMessage = getLocalizedMessage;
  }
  if (typeof window.updateUILanguage !== 'function') {
    window.updateUILanguage = updateUILanguage;
  }

  updateUILanguage();
}
