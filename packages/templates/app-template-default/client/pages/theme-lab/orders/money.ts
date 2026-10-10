import { useTranslation } from '@nocobase/i18n/client';
export function useOrderMoney() {
  const { i18n } = useTranslation();
  return (value: number) =>
    new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'CNY',
      maximumFractionDigits: 2,
    }).format(value);
}
