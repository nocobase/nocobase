import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../../schema-component';

export const DeletedPlaceholder = () => {
  const { t } = useTranslation();
  const { designable } = useDesignable();
  if (!designable) return null;
  return <div style={{ color: '#ccc' }}>{t('The field has been deleted')}</div>;
};
