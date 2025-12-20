import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getLocalizedMessageSafe } from '../localization.js';

function getYearProgressSnapshot() {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
  const now = new Date();
  const yearProgress = ((now - startOfYear) / (endOfYear - startOfYear)) * 100;
  return { currentYear, yearProgress };
}

function getYearProgressText() {
  return getLocalizedMessageSafe('yearProgress', 'Year Progress');
}

function YearProgress() {
  const { currentYear, yearProgress } = useMemo(getYearProgressSnapshot, []);
  const yearProgressText = useMemo(getYearProgressText, []);

  const activeSegments = Math.floor(yearProgress / 8.33);
  const segments = useMemo(() => {
    const items = [];
    for (let i = 0; i < 12; i++) items.push(i < activeSegments);
    return items;
  }, [activeSegments]);

  useEffect(() => {
    if (typeof window.adjustTextColor !== 'function') return;

    let cancelled = false;

    const yearProgressElement = document.querySelector('#year-progress .year-progress');
    const progressBar = yearProgressElement?.querySelector('.progress-bar');
    const progressPercentage = document.querySelector('#year-progress .progress-percentage');
    const yearTextSpan = yearProgressElement?.querySelector('span');

    if (!yearProgressElement || !progressBar || !progressPercentage || !yearTextSpan) return;

    function updateColors() {
      const backgroundImage = document.body.style.backgroundImage;
      if (!backgroundImage) return;

      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = backgroundImage.slice(5, -2);

      img.onload = function () {
        if (cancelled) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const sampleSize = 50;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        try {
          const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
          const data = imageData.data;
          let r = 0;
          let g = 0;
          let b = 0;
          let count = 0;

          for (let x = 0, len = data.length; x < len; x += 4) {
            r += data[x];
            g += data[x + 1];
            b += data[x + 2];
            count++;
          }

          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          const brightness = r * 0.299 + g * 0.587 + b * 0.114;

          yearTextSpan.style.color =
            brightness > 128
              ? `rgba(${Math.max(0, r - 160)}, ${Math.max(0, g - 160)}, ${Math.max(0, b - 160)}, 0.75)`
              : `rgba(${Math.min(255, 255 - r + 80)}, ${Math.min(255, 255 - g + 80)}, ${Math.min(255, 255 - b + 80)}, 0.75)`;
          yearTextSpan.style.textShadow = 'none';
          yearTextSpan.style.transition = 'color 0.3s ease';

          progressPercentage.style.color = yearTextSpan.style.color;
          progressPercentage.style.textShadow = 'none';
          progressPercentage.style.transition = 'color 0.3s ease';

          const activeSegments = progressBar.querySelectorAll('.active');
          const inactiveSegments = progressBar.querySelectorAll('div:not(.active)');

          activeSegments.forEach((segment) => {
            if (brightness > 128) {
              const darkR = Math.max(0, r - 160);
              const darkG = Math.max(0, g - 160);
              const darkB = Math.max(0, b - 160);
              segment.style.backgroundColor = `rgba(${darkR}, ${darkG}, ${darkB}, 0.3)`;
            } else {
              const lightR = Math.min(255, 255 - r + 80);
              const lightG = Math.min(255, 255 - g + 80);
              const lightB = Math.min(255, 255 - b + 80);
              segment.style.backgroundColor = `rgba(${lightR}, ${lightG}, ${lightB}, 0.3)`;
            }
            segment.style.boxShadow = 'none';
            segment.style.transition = 'background-color 0.3s ease';
          });

          inactiveSegments.forEach((segment) => {
            if (brightness > 128) {
              segment.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.1)`;
            } else {
              segment.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }
            segment.style.boxShadow = 'none';
            segment.style.transition = 'background-color 0.3s ease';
          });
        } catch (error) {
          console.error('分析背景颜色失败:', error);
        }
      };
    }

    updateColors();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'style' &&
          mutation.target === document.body
        ) {
          updateColors();
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Preserve legacy class 'year-progress' for DOM query in useEffect */}
      <div className="year-progress flex items-center">
        <span className="mr-2 text-xs text-gray-500 [[data-theme=dark]_&]:text-white/75">
          {currentYear} {yearProgressText}
        </span>
        {/* Preserve legacy class 'progress-bar' for DOM query in useEffect */}
        <div className="progress-bar flex items-center">
          {segments.map((isActive, index) => (
            <div
              key={index}
              className={`w-3 h-3 mr-1.5 rounded ${isActive
                  ? 'active bg-gray-400 [[data-theme=dark]_&]:bg-white/[0.28]'
                  : 'bg-gray-300 [[data-theme=dark]_&]:bg-white/[0.12]'
                }`}
            />
          ))}
        </div>
      </div>
      {/* Preserve legacy class 'progress-percentage' for DOM query in useEffect */}
      <div className="progress-percentage ml-2 text-xs text-gray-500 [[data-theme=dark]_&]:text-white/75">
        {yearProgress.toFixed(2)}%
      </div>
    </>
  );
}

export function YearProgressPortal() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    setTarget(document.getElementById('year-progress'));
  }, []);

  if (!target) return null;
  return createPortal(<YearProgress />, target);
}
