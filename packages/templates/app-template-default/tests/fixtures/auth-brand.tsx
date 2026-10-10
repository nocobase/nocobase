import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { AuthPage } from '../../client/pages/auth/shared';
import { PasswordLoginForm } from '../../client/extensions/nocobase-auth-forms/password-login-form';
import { AppThemeProvider, ThemeSettings } from '../../client/theme';
import locales from '../../client/locales';
import '../../client/styles.css';

// Visual-only fixture of the real brand panel and form. No authentication requests.
const runtime = new I18nRuntime({
  applicationNamespace: 'app',
  defaultLocale: 'en-US',
  locales: ['en-US', 'zh-CN'],
});
runtime.registerApplicationNamespace('app', locales);
await runtime.init('en-US');
const root = createRoot(document.getElementById('root')!);
root.render(
  <I18nProvider runtime={runtime}>
    <MemoryRouter>
      <AppThemeProvider>
        <div className='fixed top-4 right-4 z-10'>
          <ThemeSettings />
        </div>
        <AuthPage
          title='Welcome back'
          description='Sign in with your username or email and password.'
        >
          <PasswordLoginForm
            className='[&_[data-slot=input]]:h-12 [&_[data-slot=input-group]]:h-12 [&_button[type=submit]]:h-12'
            onSubmit={() => undefined}
          />
        </AuthPage>
      </AppThemeProvider>
    </MemoryRouter>
  </I18nProvider>,
);
import.meta.hot?.dispose(() => root.unmount());
