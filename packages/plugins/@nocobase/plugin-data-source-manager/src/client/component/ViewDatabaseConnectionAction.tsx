import { useRecord } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { getConnectionCollectionPath } from '../constant';

export const ViewDatabaseConnectionAction = () => {
  const record = useRecord();
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div>
      <a
        className={
          !record.enabled &&
          css`
            color: gray;
            text-decoration: none;
            cursor: not-allowed;
          `
        }
        onClick={() => {
          !record.enabled && navigate(getConnectionCollectionPath(record.key));
        }}
      >
        {t('Configure')}
      </a>
    </div>
  );
};
