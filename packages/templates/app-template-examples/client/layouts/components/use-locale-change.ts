import { useToaster } from '@nocobase/app-client';
import { useAppLocale } from '@nocobase/app-plugin-i18n/client';
import { useTranslation } from '@nocobase/i18n/client';

/**
 * Changes the viewer's language and reports what the change could not do. The account menu and the personal Language
 * and appearance page share it, so both change the same preference the same way.
 */
export function useLocaleChange(): (value: unknown) => void {
  const { locale, setLocale } = useAppLocale();
  const { t } = useTranslation();
  const toaster = useToaster();

  async function applyLocaleChange(value: string): Promise<void> {
    const result = await setLocale(value);
    if (result.fallback) {
      toaster.show({
        type: 'info',
        title: t('notices.serverLocaleFallback', {
          lng: value,
          defaultValue:
            'The server does not support this language, so server messages will use English.',
        }),
      });
    }
  }

  return function handleLocaleChange(value: unknown): void {
    if (typeof value !== 'string' || value === locale) return;

    const localeChange = applyLocaleChange(value);
    localeChange.catch(() => {
      toaster.show({
        type: 'error',
        title: t('notices.languageChangeFailed', {
          lng: value,
          defaultValue:
            'Unable to complete the language change. Please try again.',
        }),
      });
    });
  };
}
