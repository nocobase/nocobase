/** A failed deployment's error in the reader's language, as release management words the ones it knows. */
import { messageText } from '@nocobase/app-plugin-releases/client';
import { ACCESS_NAMESPACE } from '@nocobase/app-plugin-releases/shared/access';
import { useTranslation } from '@nocobase/i18n/client';

export function useDeploymentError(): (error: string) => string {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (error) => messageText(t, error);
}
