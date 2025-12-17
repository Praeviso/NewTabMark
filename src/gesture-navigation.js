// 平台检测
const isWindows = navigator.platform.includes('Win');
const isMac = navigator.platform.includes('Mac');

// 导航控制变量
let isNavigating = false;
let lastNavigationTime = 0;
const NAVIGATION_COOLDOWN = 350;
const NAVIGATION_LOCK_TIME = 500; // 减少锁定时间
let isTwoFingerSwipe = false;
let touchStartX = 0;
let touchStartY = 0;
let isPointerDown = false;
let hasNavigated = false; // 添加标志，防止一次滑动触发多次导航

let gestureNavigationInitialized = false;
let updateDisplayRef = null;
let wheelHandlerRef = null;

// 导航函数
function navigateToParent(currentFolderId, updateDisplay) {
  const now = Date.now();
  
  // 只检查导航状态，移除时间锁定检查
  if (isNavigating) {
    console.log('[Navigation] Skipped - navigation in progress');
    return;
  }

  isNavigating = true;
  lastNavigationTime = now;

  chrome.bookmarks.get(currentFolderId, function(nodes) {
    if (chrome.runtime.lastError) {
      console.error('[Navigation] Error:', chrome.runtime.lastError);
      isNavigating = false;
      return;
    }

    if (nodes && nodes[0] && nodes[0].parentId) {
      const parentId = nodes[0].parentId;
      console.log('[Navigation] Navigating to parent folder:', parentId);
      
      if (parentId === "0") {
        updateDisplay("1").finally(() => {
          setTimeout(() => {
            isNavigating = false;
            // 重置所有导航标志
            resetNavigationFlags();
          }, NAVIGATION_COOLDOWN);
        });
      } else {
        updateDisplay(parentId).finally(() => {
          setTimeout(() => {
            isNavigating = false;
            // 重置所有导航标志
            resetNavigationFlags();
          }, NAVIGATION_COOLDOWN);
        });
      }
    } else {
      console.log('[Navigation] Failed to get parent folder info');
      isNavigating = false;
    }
  });
}

function getCurrentFolderId() {
  const bookmarksList = document.getElementById('bookmarks-list');
  return bookmarksList?.dataset?.parentId || null;
}

function navigateToParentFromCurrentFolder() {
  if (!updateDisplayRef) return;
  const currentFolderId = getCurrentFolderId();
  if (!currentFolderId || currentFolderId === '1') return;
  navigateToParent(currentFolderId, updateDisplayRef);
}

// 添加重置导航标志的函数
function resetNavigationFlags() {
  isNavigating = false;
  hasNavigated = false; // 如果你在外部需要访问这个变量，需要将其声明为全局变量
}

// Mac 触摸板双指滑动处理
function initTouchGestures() {
  const minSwipeDistance = 250; // 显著增加最小滑动距离
  let swipeStartTime = 0;

  document.addEventListener('touchstart', function(e) {
    if (e.touches.length === 2) {
      isTwoFingerSwipe = true;
      touchStartX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      touchStartY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      swipeStartTime = Date.now();
      hasNavigated = false; // 每次触摸开始时重置标志
      
      document.body.style.transition = 'transform 0.2s';
    }
  });

  document.addEventListener('touchmove', function(e) {
    if (!isTwoFingerSwipe) return;
    e.preventDefault();

    const currentX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const deltaX = currentX - touchStartX;
    
    // 进一步降低跟手程度
    if (deltaX > 0) {
      const transform = Math.min(deltaX / 6, 150); // 大幅降低位移比例，增加最大位移
      document.body.style.transform = `translateX(${transform}px)`;
    }
  }, { passive: false });

  document.addEventListener('touchend', function(e) {
    if (!isTwoFingerSwipe) return;

    const touchEndX = (e.changedTouches[0].clientX + (e.changedTouches[1]?.clientX || e.changedTouches[0].clientX)) / 2;
    const touchEndY = (e.changedTouches[0].clientY + (e.changedTouches[1]?.clientY || e.changedTouches[0].clientY)) / 2;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const swipeTime = Date.now() - swipeStartTime;

    document.body.style.transition = 'transform 0.3s';
    document.body.style.transform = '';

    if (Math.abs(deltaX) > Math.abs(deltaY) && 
        deltaX > minSwipeDistance && 
        Math.abs(deltaY) < minSwipeDistance / 4 && // 进一步降低垂直容差
        swipeTime > 150 && swipeTime < 1000) { // 扩大时间窗口
      
      const currentFolderId = getCurrentFolderId();
      if (currentFolderId && currentFolderId !== '1' && !hasNavigated && updateDisplayRef) {
        navigateToParent(currentFolderId, updateDisplayRef);
        hasNavigated = true;
      }
    }

    isTwoFingerSwipe = false;
  });
}

// 优化滚轮处理函数
function createWheelHandler() {
  let accumulatedDeltaX = 0;
  let lastWheelTime = 0;

  return _.throttle(function(e) {
    let deltaX = e.deltaX;
    let deltaY = e.deltaY;
    // Windows 常见鼠标：Shift+滚轮用于“水平滚动”，但事件可能只填充 deltaY
    if (e.shiftKey && Math.abs(deltaX) < 1 && Math.abs(deltaY) >= 1) {
      deltaX = -deltaY;
      deltaY = 0;
    }

    const currentTime = Date.now();
    
    if (currentTime - lastNavigationTime < NAVIGATION_COOLDOWN) {
      return;
    }

    const SCROLL_THRESHOLD = isWindows ? 30 : 60; // 进一步增加滚动阈值
    const MIN_DELTA_Y = isWindows ? 20 : 45;
    const HORIZONTAL_RATIO = isWindows ? 1.8 : 2.0; // 显著增加水平比率要求
    
    accumulatedDeltaX += deltaX;
    
    if (currentTime - lastWheelTime > 400) { // 增加重置时间窗口
      accumulatedDeltaX = deltaX;
    }
    lastWheelTime = currentTime;

    const isBackGesture = e.shiftKey ? true : deltaX < 0;
    if (Math.abs(accumulatedDeltaX) > SCROLL_THRESHOLD && 
        (e.shiftKey || Math.abs(deltaX) > Math.abs(deltaY) * HORIZONTAL_RATIO) && 
        Math.abs(deltaY) < MIN_DELTA_Y && 
        isBackGesture && 
        e.deltaMode === 0) { 
      
      if (isWindows && e.deltaMode !== 0) return;
      
      navigateToParentFromCurrentFolder();
      accumulatedDeltaX = 0;
    }
  }, 200, { // 进一步增加节流时间
    trailing: false,
    leading: true
  });
}

// Windows 触摸板支持
function initWindowsTouchpad() {
  document.addEventListener('pointerdown', function(e) {
    if (e.pointerType === 'touch') {
      isPointerDown = true;
      touchStartX = e.clientX;
      touchStartY = e.clientY;
    }
  });

  document.addEventListener('pointermove', function(e) {
    if (!isPointerDown || e.pointerType !== 'touch') return;

    const deltaX = e.clientX - touchStartX;
    const deltaY = e.clientY - touchStartY;
    const MIN_SWIPE_DISTANCE = 220; // 显著增加最小滑动距离

    if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE && 
        Math.abs(deltaX) > Math.abs(deltaY) * 2.0 && // 显著增加比率要求
        deltaX < 0) {
      navigateToParentFromCurrentFolder();
      isPointerDown = false;
    }
  });

  document.addEventListener('pointerup', () => isPointerDown = false);
  document.addEventListener('pointercancel', () => isPointerDown = false);
}

// 修改初始化函数，接收 updateDisplay 参数
function initGestureNavigation(updateDisplay) {
  updateDisplayRef = updateDisplay;
  if (gestureNavigationInitialized) return;
  gestureNavigationInitialized = true;

  // 初始化触摸板手势，传入导航函数
  initTouchGestures();
  
  // 初始化滚轮事件，使用新的处理函数
  wheelHandlerRef = createWheelHandler();
  document.addEventListener('wheel', wheelHandlerRef, { passive: true });
  
  // 如果是 Windows，初始化 Windows 触摸板支持
  if (isWindows) {
    initWindowsTouchpad();
  }
}

export {
  initGestureNavigation
}; 
