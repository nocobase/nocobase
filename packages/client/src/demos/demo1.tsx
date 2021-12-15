import React from 'react';
import { i18n } from '@nocobase/client';
import { I18nextProvider, useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();
  return <div>{t('Today')}</div>;
}

export default () => {
  return (
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  );
};
