/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ObjectField, Field, connect } from '@formily/react';
import React from 'react';
import { SQLEditor } from './SQLEditor';
import { Radio } from 'antd';
import { useT } from '../../locale';
import { BuildOutlined, ConsoleSqlOutlined } from '@ant-design/icons';

const QueryMode: React.FC = connect(({ value = 'sql', onChange }) => {
  const t = useT();
  return (
    <Radio.Group
      value={value}
      onChange={(value) => {
        onChange(value);
      }}
    >
      <Radio.Button value="builder" disabled>
        <BuildOutlined /> {t('Query builder')}
      </Radio.Button>
      <Radio.Button value="sql">
        <ConsoleSqlOutlined /> {t('SQL')}
      </Radio.Button>
    </Radio.Group>
  );
});

export const QueryPanel: React.FC = () => {
  return (
    <>
      <ObjectField name="query">
        <div
          style={{
            marginBottom: '8px',
          }}
        >
          <Field name="mode" component={[QueryMode]} />
        </div>
        <Field name="sql" component={[SQLEditor]} />
      </ObjectField>
    </>
  );
};
