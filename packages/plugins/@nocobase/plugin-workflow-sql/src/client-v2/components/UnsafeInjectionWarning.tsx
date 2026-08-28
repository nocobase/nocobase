/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Alert, Button, Form } from 'antd';
import { migrateUnsafeSqlConfig } from '../utils';
import { useT } from '../locale';
import type { SQLInstructionConfig } from '../types';

export function UnsafeInjectionWarning() {
  const t = useT();
  const form = Form.useFormInstance();
  const watchedUnsafeInjection = Form.useWatch(['config', 'unsafeInjection'], form);
  const unsafeInjection = watchedUnsafeInjection ?? form.getFieldValue(['config', 'unsafeInjection']);

  if (!unsafeInjection) {
    return null;
  }

  return (
    <Alert
      type="error"
      showIcon
      message={t('Current node is using unsafe injection mode (legacy), which has SQL injection risks.')}
      action={
        <Button
          size="small"
          type="primary"
          onClick={() => {
            const config = form.getFieldValue('config') as SQLInstructionConfig;
            form.setFieldValue('config', migrateUnsafeSqlConfig(config));
          }}
        >
          {t('Migrate to safe mode')}
        </Button>
      }
    />
  );
}
