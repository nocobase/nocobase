import React, { useEffect } from 'react';
import { Input, Row, Col, Button } from 'antd';
import { Password, useActionContext } from '@nocobase/client';
import { useField } from '@formily/react';
import { Field } from '@formily/core';
import { useUsersTranslation } from './locale';
import { generatePassword } from './utils';

export const PasswordField: React.FC = () => {
  const { t } = useUsersTranslation();
  const field = useField<Field>();
  const [visible, setVisible] = React.useState(false);
  const ctx = useActionContext();

  useEffect(() => {
    if (ctx.visible) {
      return;
    }
    field.reset();
  }, [field, ctx.visible]);

  return (
    <Row gutter={10}>
      <Col span={18}>
        <Password
          checkStrength={true}
          visibilityToggle={{
            visible,
            onVisibleChange: setVisible,
          }}
          value={field.value}
          onChange={(e: any) => field.setValue(e.target.value)}
          autoComplete="off"
        />
      </Col>
      <Col span={4}>
        <Button
          onClick={() => {
            field.setValue(generatePassword());
            setVisible(true);
          }}
        >
          {t('Random password')}
        </Button>
      </Col>
    </Row>
  );
};
