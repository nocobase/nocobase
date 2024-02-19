import { useRecord_deprecated } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getConnectionCollectionPath } from '../constant';

export const ViewDatabaseConnectionAction = () => {
  const record = useRecord_deprecated();
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div>
      <a
        onClick={() => {
          navigate(getConnectionCollectionPath(record.key));
        }}
      >
        {t('Configure')}
      </a>
    </div>
  );
};
