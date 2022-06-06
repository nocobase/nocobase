import { CloseCircleOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { useCompile } from '@nocobase/client';
import { Cascader, Input, Space } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const FieldItem = observer((props: any) => {
  const { fields, value, index, values, removeFieldItem } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const [dataIndex, setDataIndex] = useState(value?.dataIndex ?? []);
  const [title, setTitle] = useState(value?.title);
  return (
    <Space>
      <Cascader
        fieldNames={{
          label: 'title',
          value: 'name',
          children: 'children',
        }}
        style={{
          width: 410,
        }}
        changeOnSelect={false}
        value={dataIndex}
        options={compile(fields)}
        onChange={(value) => {
          values[index].dataIndex = value;
          setDataIndex(value);
        }}
      />
      <Input
        placeholder={t('Exported table header name')}
        style={{
          width: 410,
        }}
        value={title}
        onChange={(e) => {
          values[index].title = e.target.value;
          setTitle(title);
        }}
      />
      <a>
        <CloseCircleOutlined onClick={removeFieldItem} style={{ color: '#bfbfbf' }} />
      </a>
    </Space>
  );
});
