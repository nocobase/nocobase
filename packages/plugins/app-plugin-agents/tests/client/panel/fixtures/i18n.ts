/**
 * The application's own wording the panel's shared UI reads outside the plugin's namespace (the spinner's and the dialogs' close labels),
 * as the application that renders the panel provides it.
 */
export const appResources = {
  status: { loading: 'Loading' },
  actions: { close: 'Close' },
} as const;
