import React from 'react';
import { useTranslation } from 'react-i18next';

export const DeletedField = () => {
  const { t } = useTranslation();
  return <div style={{ color: '#ccc' }}>{t('The field has bee deleted')}</div>;
};
