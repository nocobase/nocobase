import { css } from '@emotion/css';
import { Button } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const SaveDefaultValue = (props) => {
  const { t } = useTranslation();
  return (
    <Button
      className={css`
        border-color: rgb(241, 139, 98);
        color: rgb(241, 139, 98);
      `}
      type={'dashed'}
    >
      {t('Save conditions')}
    </Button>
  );
};
