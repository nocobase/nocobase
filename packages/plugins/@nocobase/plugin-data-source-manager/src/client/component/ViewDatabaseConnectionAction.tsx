import { useRecord } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getConnectionCollectionPath } from '../constant';

export const ViewDatabaseConnectionAction = () => {
  const record = useRecord();
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div>
      <a
        onClick={() => {
          navigate(getConnectionCollectionPath(record.name));
        }}
      >
        {t('Configure')}
      </a>
    </div>
  );
};
