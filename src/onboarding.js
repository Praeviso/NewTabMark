import { getLocalizedMessageSafe, updateUILanguage } from './localization.js';

class Onboarding {
  constructor({ overlay, prevButton, nextButton }, { signal } = {}) {
    this.currentStep = 1;
    this.totalSteps = 3;
    this.overlay = overlay;
    this.prevButton = prevButton;
    this.nextButton = nextButton;
    this.signal = signal;

    this.init();
  }

  init() {
    // 检查是否是首次访问
    if (!localStorage.getItem('onboardingCompleted')) {
      this.show();
      this.bindEvents();
    }
  }

  bindEvents() {
    const opts = this.signal ? { signal: this.signal } : undefined;

    this.prevButton.addEventListener('click', () => this.navigate('prev'), opts);
    this.nextButton.addEventListener('click', () => this.navigate('next'), opts);

    // 允许点击圆点直接跳转到对应步骤
    document.querySelectorAll('.dot').forEach((dot, index) => {
      dot.addEventListener('click', () => this.goToStep(index + 1), opts);
    });
  }

  show() {
    this.overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // 防止背景滚动
  }

  hide() {
    this.overlay.classList.add('hidden');
    document.body.style.overflow = '';
    localStorage.setItem('onboardingCompleted', 'true');
  }

  navigate(direction) {
    if (direction === 'next') {
      if (this.currentStep === this.totalSteps) {
        this.hide();
        return;
      }
      this.goToStep(this.currentStep + 1);
    } else {
      this.goToStep(this.currentStep - 1);
    }
  }

  goToStep(step) {
    // 更新步骤状态
    document.querySelectorAll('.onboarding-step').forEach(stepEl => {
      stepEl.classList.remove('active');
      if (parseInt(stepEl.dataset.step) === step) {
        stepEl.classList.add('active');
      }
    });

    // 更新圆点状态
    document.querySelectorAll('.dot').forEach((dot, index) => {
      dot.classList.toggle('active', index + 1 === step);
    });

    // 更新按钮状态
    this.prevButton.disabled = step === 1;
    if (step === this.totalSteps) {
      this.nextButton.textContent = getLocalizedMessageSafe('finishButton', 'Finish');
    } else {
      this.nextButton.textContent = getLocalizedMessageSafe('nextButton', 'Next');
    }

    this.currentStep = step;
  }
}

let instance = null;
let abortController = null;

function getOnboardingElements() {
  ensureOnboardingOverlay();

  const overlay = document.getElementById('onboarding-overlay');
  const prevButton = document.querySelector('.onboarding-prev');
  const nextButton = document.querySelector('.onboarding-next');

  if (!overlay || !prevButton || !nextButton) return null;
  return { overlay, prevButton, nextButton };
}

function ensureOnboardingOverlay() {
  if (document.getElementById('onboarding-overlay')) return;

  // 当前 HTML 模板里没有引导 DOM（重构迁移中被遗漏），这里按现有 CSS class 还原一份，避免改动布局。
  const overlay = document.createElement('div');
  overlay.id = 'onboarding-overlay';
  overlay.className = 'onboarding-overlay hidden';

  // i18n key 可能不存在：使用 safe fallback，避免显示空字符串。
  const titleText = getLocalizedMessageSafe('onboardingTitle', 'Welcome');
  const step1Title = getLocalizedMessageSafe('onboardingStep1Title', 'Search');
  const step1Desc = getLocalizedMessageSafe('onboardingStep1Desc', 'Type to search with your favorite engine.');
  const step2Title = getLocalizedMessageSafe('onboardingStep2Title', 'Quick Links');
  const step2Desc = getLocalizedMessageSafe('onboardingStep2Desc', 'Access frequently visited sites faster.');
  const step3Title = getLocalizedMessageSafe('onboardingStep3Title', 'Settings');
  const step3Desc = getLocalizedMessageSafe('onboardingStep3Desc', 'Customize theme, wallpaper, and more.');

  const prevText = getLocalizedMessageSafe('prevButton', 'Prev');
  const nextText = getLocalizedMessageSafe('nextButton', 'Next');

  overlay.innerHTML = `
    <div class="onboarding-modal" role="dialog" aria-modal="true">
      <h2 data-i18n="onboardingTitle">${titleText}</h2>
      <div class="onboarding-steps">
        <div class="onboarding-step active" data-step="1">
          <img src="../images/logo.svg" alt="" />
          <h3 data-i18n="onboardingStep1Title">${step1Title}</h3>
          <p data-i18n="onboardingStep1Desc">${step1Desc}</p>
        </div>
        <div class="onboarding-step" data-step="2">
          <img src="../images/logo.svg" alt="" />
          <h3 data-i18n="onboardingStep2Title">${step2Title}</h3>
          <p data-i18n="onboardingStep2Desc">${step2Desc}</p>
        </div>
        <div class="onboarding-step" data-step="3">
          <img src="../images/logo.svg" alt="" />
          <h3 data-i18n="onboardingStep3Title">${step3Title}</h3>
          <p data-i18n="onboardingStep3Desc">${step3Desc}</p>
        </div>
      </div>
      <div class="onboarding-navigation">
        <button class="onboarding-prev" type="button" disabled data-i18n="prevButton">${prevText}</button>
        <div class="onboarding-dots" aria-label="steps">
          <span class="dot active" role="button" tabindex="0" aria-label="step 1"></span>
          <span class="dot" role="button" tabindex="0" aria-label="step 2"></span>
          <span class="dot" role="button" tabindex="0" aria-label="step 3"></span>
        </div>
        <button class="onboarding-next" type="button" data-i18n="nextButton">${nextText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  updateUILanguage(overlay);
}

export function initOnboarding() {
  const els = getOnboardingElements();

  // DOM 还没注入（React 外壳延迟插入 legacy DOM 时会出现），此时不要“锁死”初始化。
  if (!els) return null;

  if (instance) return instance;

  abortController?.abort();
  abortController = new AbortController();

  instance = new Onboarding(els, { signal: abortController.signal });
  return instance;
}
