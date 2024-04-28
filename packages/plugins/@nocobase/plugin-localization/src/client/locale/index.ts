import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'localization';

export const useLocalTranslation = () => {
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
};
