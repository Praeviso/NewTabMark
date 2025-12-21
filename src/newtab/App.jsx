import { LegacyAppShell } from '../legacy/LegacyAppShell.jsx';
import legacyIndexHtml from '../index.html?raw';
import { bootstrapLegacyNewtab } from './bootstrap-legacy.js';
import { YearProgressPortal } from '../ui/year-progress.jsx';
import { MoreButtonToastPortal } from '../ui/more-button-toast.jsx';
import { LinksIcons } from '../ui/links-icons.jsx';
import { SettingsIcon } from '../ui/settings-icon.jsx';
import { SearchEngineDropdownPortal } from '../ui/search-engine-dropdown-portal.jsx';
import { ThemeTogglePortal } from '../ui/theme-toggle.jsx';
import { QuickLinksPortal } from '../ui/quick-links-portal.jsx';
import { SearchSuggestionsPortal } from '../ui/search-suggestions-portal.jsx';
import { ToggleSidebar } from '../ui/toggle-sidebar.jsx';
import { SettingsSwitchPortal } from '../ui/SettingsSwitchPortal.jsx';
import { BackgroundOptionsPortal } from '../ui/BackgroundOptionsPortal.jsx';
import { SettingsTabsPortal } from '../ui/SettingsTabsPortal.jsx';
import { WallpaperActionsPortal } from '../ui/WallpaperActionsPortal.jsx';
import { WallpaperOptionsPortal } from '../ui/WallpaperOptionsPortal.jsx';
import { BookmarkCleanupButtonPortal } from '../ui/BookmarkCleanupButtonPortal.jsx';

export function App() {

  return (
    <>
      <LegacyAppShell
        legacyHtml={legacyIndexHtml}
        bootstrap={bootstrapLegacyNewtab}
        stripSelectors={['.links-icons', '.settings-icon', '.theme-toggle', '#toggle-sidebar']}
        replaceSelectors={[
          { selector: '.search-suggestions-wrapper', placeholderId: 'ntm-search-suggestions-portal' },
          { selector: '.quick-links-wrapper', placeholderId: 'ntm-quick-links-portal' }
        ]}
      />
      <YearProgressPortal />
      <MoreButtonToastPortal />
      <SearchEngineDropdownPortal />
      <SearchSuggestionsPortal variant="newtab" />
      <QuickLinksPortal />
      <LinksIcons />
      <SettingsIcon />
      <ThemeTogglePortal />
      <ToggleSidebar />
      <SettingsSwitchPortal />
      <BackgroundOptionsPortal />
      <SettingsTabsPortal />
      <WallpaperActionsPortal />
      <WallpaperOptionsPortal />
      <BookmarkCleanupButtonPortal />
    </>
  );
}
