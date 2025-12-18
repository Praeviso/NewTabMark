import { LegacyAppShell } from '../legacy/LegacyAppShell.jsx';
import legacySidepanelHtml from '../sidepanel.html?raw';
import { bootstrapLegacySidepanel } from './bootstrap-legacy.js';
import { YearProgressPortal } from '../ui/year-progress.jsx';
import { MoreButtonToastPortal } from '../ui/more-button-toast.jsx';
import { LinksIcons } from '../ui/links-icons.jsx';
import { SettingsIcon } from '../ui/settings-icon.jsx';
import { SearchEngineDropdownPortal } from '../ui/search-engine-dropdown-portal.jsx';

export function App() {
  return (
    <>
      <LegacyAppShell
        legacyHtml={legacySidepanelHtml}
        bootstrap={bootstrapLegacySidepanel}
        stripSelectors={['.links-icons', '.settings-icon']}
      />
      <YearProgressPortal />
      <MoreButtonToastPortal />
      <SearchEngineDropdownPortal />
      <LinksIcons />
      <SettingsIcon />
    </>
  );
}
