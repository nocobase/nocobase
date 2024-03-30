import { useRecord } from '@nocobase/client';
import React from 'react';
import { Button } from 'antd';
import { css } from '@emotion/css';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getConnectionCollectionPath } from '../constant';

export const ViewDatabaseConnectionAction = () => {
  const record = useRecord();
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div
      className={
        !record.enabled
          ? css`
              .ant-btn-link {
                &:hover {
                  color: rgba(0, 0, 0, 0.25) !important;
                }
              }
            `
          : undefined
      }
    >
      <Button
        type="link"
        style={{ padding: '0px' }}
        disabled={!record.enabled}
        onClick={() => {
          navigate(getConnectionCollectionPath(record.key));
        }}
        role="button"
        aria-label={`${record?.key}-Configure`}
      >
        {t('Configure')}
      </Button>
    </div>
  );
};
