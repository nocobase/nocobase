/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card, Form } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

export function FieldPlaceholder() {
  const { t } = useTranslation();
  return (
    <Form.Item>
      <Card
        size="small"
        styles={{
          body: {
            color: 'rgba(0,0,0,0.45)',
          },
        }}
      >
        {t(
          'This field has been hidden and you cannot view it (this content is only visible when the UI Editor is activated).',
        )}
      </Card>
    </Form.Item>
  );
}
