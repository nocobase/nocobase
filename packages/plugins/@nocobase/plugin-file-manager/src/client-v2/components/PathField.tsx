/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EnvVariableInput } from '@nocobase/client-v2';
import { Form } from 'antd';
import React from 'react';
import { useT } from '../locale';

export interface PathFieldProps {
  /**
   * Optional prefix shown inside the input's addonBefore slot. Local storage
   * uses this to render the fixed `storage/uploads/` mount point so users
   * understand the relative path is appended to it.
   */
  addonBefore?: string;
}

export function PathField(props: PathFieldProps) {
  const t = useT();
  return (
    <Form.Item
      name="path"
      label={`${t('Path')} :`}
      extra={t(
        'Relative path the file will be saved to. Left blank as root path. The leading and trailing slashes "/" will be ignored. For example: "user/avatar".',
      )}
    >
      <EnvVariableInput addonBefore={props.addonBefore} />
    </Form.Item>
  );
}
