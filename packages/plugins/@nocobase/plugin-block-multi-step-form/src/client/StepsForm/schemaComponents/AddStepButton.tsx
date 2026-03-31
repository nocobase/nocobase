import { useT } from '../../locale';
import React from 'react';
import { Button } from 'antd';
import { css, useDesignable } from '@nocobase/client';
import { PlusOutlined } from '@ant-design/icons';

export const AddStepButton = ({ onClick }) => {
  const { designable } = useDesignable();
  const t = useT();
  if (!designable) {
    return null;
  }
  return (
    <Button
      type={'dashed'}
      icon={<PlusOutlined />}
      className={css`
        border-color: var(--colorSettings);
        color: var(--colorSettings);
      `}
      style={{ marginLeft: 24, marginTop: 12 }}
      onClick={onClick}
    >
      {t('AddStep')}
    </Button>
  );
};
