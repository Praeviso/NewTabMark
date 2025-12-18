// 获取用户首选语言
function getUserLanguage() {
  try {
    return chrome?.i18n?.getUILanguage?.();
  } catch {
    return undefined;
  }
}

export function getLocalizedMessageSafe(messageName, fallback = messageName, substitutions) {
  if (!messageName) return fallback;
  try {
    const message = chrome?.i18n?.getMessage?.(messageName, substitutions);
    return message || fallback;
  } catch {
    return fallback;
  }
}

function getLocalizedMessage(messageName, substitutions) {
  // 访问一次确保 chrome.i18n 可用（保留原有结构，避免未来需要 userLang）
  getUserLanguage();
  return getLocalizedMessageSafe(messageName, messageName, substitutions);
}

function resolveQueryRoot(root) {
  if (!root) return document;
  if (root.querySelectorAll) return root;
  if (root.documentElement?.querySelectorAll) return root.documentElement;
  return document;
}

export function updateUILanguage(root) {
  getUserLanguage();
  const queryRoot = resolveQueryRoot(root);

  // 处理常规的 data-i18n 属性
  queryRoot.querySelectorAll('[data-i18n]').forEach((element) => {
    const messageName = element.getAttribute('data-i18n');
    const localizedMessage = getLocalizedMessage(messageName);
    element.textContent = localizedMessage;
  });

  // 处理 placeholder
  queryRoot.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const messageName = element.getAttribute('data-i18n-placeholder');
    element.placeholder = getLocalizedMessage(messageName);
  });

  // 处理 title
  queryRoot.querySelectorAll('[data-i18n-title]').forEach((element) => {
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
