import { compile } from '@formily/json-schema/lib/compiler';
import { useTranslation } from 'react-i18next';

export const useCompile = () => {
  const { t } = useTranslation();
  return (source: any) => {
    return compile(source, { t });
  };
};
