import { CloseCircleOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { useCompile } from '@nocobase/client';
import { Cascader, Form, Input } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const FieldItem = observer((props: any) => {
  const { fields, value, index, values, removeFieldItem } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const [dataIndex, setDataIndex] = useState(value?.dataIndex ?? []);
  const [title, setTitle] = useState(value?.title);
  return (
    <Form.Item>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Cascader
          fieldNames={{
            label: 'title',
            value: 'name',
            children: 'children',
          }}
          style={{ margin: '0 12px' }}
          changeOnSelect={false}
          value={dataIndex}
          options={compile(fields)}
          onChange={(value, selectedOptions) => {
            values[index].dataIndex = value;
            values[index].defaultTitle = selectedOptions[selectedOptions.length - 1].title;
            setDataIndex(value);
          }}
        />
        <Input
          placeholder={t('Exported table header name')}
          value={title}
          style={{ margin: '0 12px' }}
          onChange={(e) => {
            values[index].title = e.target.value;
            setTitle(title);
          }}
        />
        <a style={{ margin: '0 12px' }}>
          <CloseCircleOutlined onClick={removeFieldItem} style={{ color: '#bfbfbf' }} />
        </a>
      </div>
    </Form.Item>
  );
});
