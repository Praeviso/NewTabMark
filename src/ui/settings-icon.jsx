export function SettingsIcon() {
  return (
    <div className="settings-icon">
      <a href="#settings" id="settings-link" data-i18n-title="settingsLinkTitle">
        <span className="material-icons">settings</span>
      </a>
      <div className="settings-update-tip" style={{ display: 'none' }}>
        <div className="tip-content">
          <span className="material-icons">info</span>
          <div className="tip-text">
            <p data-i18n="settingsUpdateTip">
              你可以在这里设置背景颜色、壁纸、悬浮球功能...
            </p>
          </div>
          <button className="tip-close">
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="tip-arrow"></div>
      </div>
    </div>
  );
}
