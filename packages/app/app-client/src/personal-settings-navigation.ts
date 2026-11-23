import { useLocation, useNavigate, type Location } from 'react-router';
import { PERSONAL_SETTINGS_ROUTE_PATH as root } from './plugins.js';

export const parameter = 'personalSettings';
const historyKey = '__nocobasePersonalSettings';

export function settingsPath(path: string): boolean {
  const pathname = path.toLowerCase();
  return pathname === root || pathname.startsWith(root + '/');
}

export function overlaySearch(search: string, value: string | null): string {
  const params = new URLSearchParams(search);
  if (value === null) params.delete(parameter);
  else params.set(parameter, value);
  const query = params.toString();
  return query ? '?' + query : '';
}

interface OverlayEntry {
  openedHere?: boolean;
  backgroundKey: string;
  backgroundState: unknown;
  pageState?: unknown;
}

export function overlayEntry(location: Location): OverlayEntry {
  const state = location.state as { [historyKey]?: OverlayEntry } | null;
  return (
    state?.[historyKey] ?? {
      backgroundKey: location.key,
      backgroundState: location.state as unknown,
    }
  );
}

export function overlayState(
  location: Location,
  values: Partial<OverlayEntry>,
): { [historyKey]: OverlayEntry } {
  return { [historyKey]: { ...overlayEntry(location), ...values } };
}

/** The avatar entry follows the configured mode. A URL explicitly chooses its own presentation. */
export function usePersonalSettingsNavigation(): {
  readonly open: (mode?: 'page' | 'dialog', page?: string) => void;
  readonly close: () => void;
  readonly isOpen: boolean;
} {
  const location = useLocation();
  const navigate = useNavigate();
  const value = new URLSearchParams(location.search).get(parameter);
  const entry = overlayEntry(location);

  function open(mode: 'page' | 'dialog' = 'page', page = '') {
    if (mode === 'page' || settingsPath(location.pathname)) {
      void navigate(page ? root + '/' + page : root);
      return;
    }
    void navigate(
      { ...location, search: overlaySearch(location.search, page) },
      {
        replace: value !== null,
        state: overlayState(location, {
          openedHere: value === null || entry.openedHere,
        }),
        preventScrollReset: true,
      },
    );
  }

  function close() {
    if (entry.openedHere) {
      void navigate(-1);
    } else {
      void navigate(
        { ...location, search: overlaySearch(location.search, null) },
        {
          replace: true,
          state: entry.backgroundState,
          preventScrollReset: true,
        },
      );
    }
  }

  return {
    open,
    close,
    isOpen: value !== null && !settingsPath(location.pathname),
  };
}
