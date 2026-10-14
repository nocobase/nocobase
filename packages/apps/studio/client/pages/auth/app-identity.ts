import { useClientApplication } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';

/** The application's name and version, published by the server from its package.json. */
export function useAppIdentity(): {
  readonly name: string;
  readonly version: string;
} {
  const publicConfig = useClientApplication().config.public;
  return {
    name: publicConfig.get('app.displayName', 'NocoBase Studio'),
    version: publicConfig.get('app.version', '0.0.0'),
  };
}

/** The sign-in page title, which names the application. */
export function useSignInTitle(): string {
  const { t } = useTranslation();
  const { name } = useAppIdentity();
  return t('auth.signInTitle', { defaultValue: 'Sign in to {{name}}', name });
}
