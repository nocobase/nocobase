/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Checkbox, Form } from 'antd';
import React from 'react';
import { useT } from '../locale';

export interface DefaultFieldProps {
  /**
   * Disables the checkbox when editing a storage that is already marked as the
   * default. v1 prevents un-checking the default storage from the edit form
   * because that operation needs to happen by promoting another storage first.
   */
  disabled?: boolean;
}

export function DefaultField(props: DefaultFieldProps) {
  const t = useT();
  return (
    <Form.Item name="default" valuePropName="checked">
      <Checkbox disabled={props.disabled}>{t('Default storage')}</Checkbox>
    </Form.Item>
  );
}
