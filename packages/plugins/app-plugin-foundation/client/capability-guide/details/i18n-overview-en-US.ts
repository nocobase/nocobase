const i18nOverview = {
  statusTitle: 'This application',
  current: 'Your interface language',
  clientDefault: 'Interface default language',
  serverDefault: 'Server default language',
  loading: 'Checking…',
  unknown: 'Unable to confirm',
  refresh: 'Refresh server languages',
  failed:
    'Unable to read server languages. The interface information below is still available.',
  expired:
    'Your session has expired. Sign in to read server language information.',
  forbidden: 'You do not have permission to read server language information.',
  signIn: 'Sign in',
  sourceNote:
    'These are effective runtime values. This page does not identify whether the default came from config.yml, an environment variable or application defaults.',
  languageTitle: 'Available languages',
  languageCount: 'Languages — interface: {{client}} · server: {{server}}',
  clientCount: 'Interface languages: {{count}} · server languages unavailable',
  browser: 'Interface',
  server: 'Server',
  supported: 'Available',
  unsupported: 'Not declared',
  empty: 'No languages were reported by either runtime.',
  coverageNote:
    'A declared language does not guarantee that every page or plugin is fully translated. Missing translations may fall back to English. Plugin translations alone do not add languages to the application’s language menu.',
  fallbackNote:
    'The server does not declare your current interface language. When the language is synchronized, server responses fall back to English.',
  switchTitle: 'Change your language',
  switchHint:
    'Open the account menu in the top right and choose Language. This changes your preference, not the application default. The menu is hidden when only one interface language is available.',
  persistence:
    'With user preferences integrated, the choice follows your account; otherwise it stays in this browser. The application also synchronizes the language used for server responses.',
  setupTitle: 'Add or configure languages',
  add: {
    title: 'Add a language',
    steps: {
      translate:
        'Choose a locale code, such as ja-JP. Add the application’s interface translations using the English resource structure, keeping keys, interpolation and plural forms consistent.',
      declare:
        'Declare its loader in client/locales/index.ts. For server messages, also translate and declare the language in server/locales/index.ts; keep the two lists aligned where possible.',
      plugins:
        'Check the plugins and shared components used by the application. Supply missing translations or application overrides so the new language does not appear partially translated.',
      verify:
        'Run pnpm nocobase locales check and the application type check. Switch to the new language and verify menus, pages, errors and notifications. Rebuild and restart for deployment.',
    },
    prompt:
      'Help me add a language to this NocoBase application.\n\nTarget language and locale code: [for example, Japanese / ja-JP].\nBusiness pages to cover: [describe the scope].\n\nRead the installed nocobase-app-plugin-i18n Skill and inspect current frontend/server locale declarations and plugin translations. Preserve existing languages, keys and custom wording.\n\nAdd translations and lazy loaders to the application’s client/locales and server/locales as appropriate. Keep interpolation, plurals and namespaces correct; check plugin fallbacks and use application overrides where needed. Do not try to add supported languages through config.yml. Do not change the default language unless requested.\n\nRun pnpm nocobase locales check, type checks and relevant tests. Switch language and verify menus, business pages, server errors and recipient-language notifications. Report any remaining untranslated content.',
  },
  default: {
    title: 'Change the default language',
    steps: {
      check:
        'Confirm that the target language is declared in both application locale lists and that the required translations are available.',
      configure:
        'Set i18n.defaultLocale in the application configuration. APP_DEFAULT_LOCALE can override this value, so check the deployment environment too.',
      verify:
        'Run pnpm nocobase config check, then restart the application. Verify both runtime defaults on this page and test an account or browser without a saved language preference.',
      preference:
        'Changing the default does not overwrite a user’s saved language preference. People who have already chosen a language continue to use their choice.',
    },
    prompt:
      'Help me change this NocoBase application’s default language to [locale code, for example zh-CN].\n\nRead the installed nocobase-app-plugin-i18n Skill. First check that both frontend and server locale declarations support the target language. If translations are missing, list the gaps instead of claiming that changing configuration translates the application.\n\nInspect i18n.defaultLocale and the APP_DEFAULT_LOCALE environment mapping and deployment override. Change only the relevant default, preserving existing languages, other configuration and users’ saved preferences.\n\nRun pnpm nocobase config check. Restart as needed and verify frontend/server effective defaults using an account or browser without a saved preference. Explain any remaining override or translation gaps.',
  },
  agentTab: 'Use Agent',
  manualTab: 'Manual steps',
  promptHint:
    'Replace the bracketed details, then copy the edited request to your development Agent. This page does not change configuration.',
  promptLabel: 'Editable request',
  copy: 'Copy request',
  copied: 'Copied',
  copyFailed: 'Copy failed. Select the request above and copy it manually.',
  exampleHint:
    'Format example only, not an export of this application’s configuration. The selected language must already be declared.',
};

export default i18nOverview;
