/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ObjectField, Field, connect, useForm, observer } from '@formily/react';
import React from 'react';
import { SQLEditor } from './SQLEditor';
import { Radio } from 'antd';
import { useT } from '../../locale';
import { BuildOutlined, ConsoleSqlOutlined } from '@ant-design/icons';
import { QueryBuilder } from './QueryBuilder';

const QueryMode: React.FC = connect(({ value = 'sql', onChange }) => {
  const t = useT();
  return (
    <Radio.Group
      value={value}
      onChange={(e) => {
        const value = e.target.value;
        onChange(value);
      }}
    >
      <Radio.Button value="builder">
        <BuildOutlined /> {t('Query builder')}
      </Radio.Button>
      <Radio.Button value="sql">
        <ConsoleSqlOutlined /> {t('SQL')}
      </Radio.Button>
    </Radio.Group>
  );
});

export const QueryPanel: React.FC = observer(() => {
  const form = useForm();
  const mode = form?.values?.query?.mode || 'sql';

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
        {mode === 'builder' ? <QueryBuilder /> : <Field name="sql" component={[SQLEditor]} />}
      </ObjectField>
    </>
  );
});
