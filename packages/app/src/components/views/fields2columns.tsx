import React from 'react';

import { MenuOutlined } from '@ant-design/icons';
import Field from '@/components/views/Field';
import cloneDeep from 'lodash/cloneDeep';
import { Checkbox, message } from 'antd';
import api from '@/api-client';

export const DragHandle = () => (
  <MenuOutlined
    className="drag-handle"
    style={{ cursor: 'pointer', color: '#999' }}
  />
);

export function fields2columns(fields = [], ctx: any = {}) {
  const columns: any[] = fields.map(item => {
    const field = cloneDeep(item);
    if (!field.dataIndex) {
      field.dataIndex = field.name.split('.');
    }
    if (['datetime', 'number'].includes(field.interface)) {
      field.sorter = true;
    }
    field.render = (value, record, index) =>
      field.interface === 'sort' ? (
        <DragHandle />
      ) : (
        <Field
          ctx={{ ...ctx, index }}
          data={record}
          viewType={'table'}
          schema={field}
          value={value}
        />
      );
    field.className = `${field.className || ''} noco-field-${field.interface}`;
    if (field.editable && field.interface === 'boolean') {
      field.title = (
        <span>
          <Checkbox
            onChange={async e => {
              try {
                await api.resource(field.resource).update({
                  associatedKey: ctx.associatedKey,
                  // resourceKey: data.id,
                  // tableName: data.tableName||'pages',
                  values: {
                    accessible: e.target.checked,
                  },
                });
                message.success('保存成功');
                if (ctx.refresh) {
                  ctx.refresh();
                }
              } catch (error) {
                message.error('保存失败');
              }
            }}
          />{' '}
          {field.title}
        </span>
      );
    }
    return {
      ...field,
      ...(field.component || {}),
    };
  });
  return columns;
}
