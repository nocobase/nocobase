import { useHref } from 'react-router';

/**
 * The application's public address including its base path, for commands shown to people (the router's basename is
 * that path); not used to call the API.
 */
export function useServerUrl(): string {
  const basePath = useHref('/');
  return new URL(basePath, window.location.origin).href.replace(/\/+$/u, '');
}
