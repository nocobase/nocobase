import { useField, useForm } from '@formily/react';
import { useAsyncData } from '../../../../async-data-provider';
import React, { useEffect } from 'react';
import { Input, SchemaComponent } from '../../../../schema-component';
import { css } from '@emotion/css';
import { Button } from 'antd';
import { EditOutlined, RightSquareOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Field } from '@formily/core';

export const SQLInput = ({ disabled }) => {
  const { t } = useTranslation();
  const { run, loading, error } = useAsyncData();
  const field = useField<Field>();
  const execute = () => {
    if (!field.value) {
      return;
    }
    run(field.value);
  };
  const toggleEditing = () => {
    if (!disabled && !field.value) {
      return;
    }
    if (!disabled) {
      run(field.value);
    }
    field.setComponentProps({
      disabled: !disabled,
    });
  };

  useEffect(() => {
    if (error) {
      field.setComponentProps({
        disabled: false,
      });
    }
  }, [field, error]);

  return (
    <div
      className={css`
        position: relative;
        .ant-input {
          width: 100%;
        }
      `}
    >
      <Input.TextArea value={field.value} disabled={disabled} onChange={(e) => (field.value = e.target.value)} />
      <Button.Group>
        <Button onClick={toggleEditing} ghost size="small" type="primary" icon={<EditOutlined />}>
          {t(!disabled ? 'Confirm' : 'Edit')}
        </Button>
        <Button
          onClick={() => execute()}
          loading={loading}
          ghost
          size="small"
          type="primary"
          icon={<RightSquareOutlined />}
        >
          {t('Execute')}
        </Button>
      </Button.Group>
    </div>
  );
};
