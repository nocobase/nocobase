import { useTranslation } from 'react-i18next';
import { useAsyncData } from '../../../../async-data-provider';
import React, { useEffect, useState } from 'react';
import { Alert, Input, Select, Spin, Table } from 'antd';
import { useField } from '@formily/react';
import { ArrayField } from '@formily/core';
import { getOptions } from '../../../Configuration/interfaces';
import { useCompile } from '../../../../schema-component';
import { useCollectionManager } from '../../../hooks';

export const FieldsConfigure = () => {
  const { t } = useTranslation();
  const [dataSource, setDataSource] = useState([]);
  const { data, error, loading } = useAsyncData();
  const field: ArrayField = useField();
  const compile = useCompile();
  const { getInterface } = useCollectionManager();

  useEffect(() => {
    if (!loading && data) {
      const fields = Object.keys(data?.[0] || {}).map((col) => {
        return {
          name: col,
        };
      });
      setDataSource(fields);
      field.setValue(fields);
    }
  }, [loading, data, field]);

  if (loading) {
    return <Spin />;
  }
  if (!data && !error) {
    return <Alert showIcon message={t('Please enter a valid select query')} />;
  }
  const err = error as any;
  if (err) {
    const errMsg =
      err?.response?.data?.errors?.map?.((item: { message: string }) => item.message).join('\n') || err.message;
    return <Alert showIcon message={`${t('SQL error: ')}${errMsg}`} type="error" />;
  }

  const handleFieldChange = (record: any, index: number) => {
    const fields = [...dataSource];
    fields.splice(index, 1, record);
    setDataSource([...dataSource]);
    field.setValue(fields);
  };

  const columns = [
    {
      title: t('Field name'),
      dataIndex: 'name',
      key: 'name',
      width: 130,
    },
    {
      title: t('Field display name'),
      dataIndex: 'title',
      key: 'title',
      width: 180,
      render: (text: string, record: any, index: number) => {
        const field = dataSource[index];
        return (
          <Input
            // value={field.uiSchema?.title !== undefined ? field.uiSchema.title : field?.name}
            onChange={(e) =>
              handleFieldChange({ ...field, uiSchema: { ...field?.uiSchema, title: e.target.value } }, index)
            }
          />
        );
      },
    },
    {
      title: t('Field interface'),
      dataIndex: 'interface',
      key: 'interface',
      width: 150,
      render: (text: string, record: any, index: number) => {
        const field = dataSource[index];
        const data = getOptions().filter((v) => !['relation', 'systemInfo'].includes(v.key));
        return (
          <Select
            // defaultValue={text}
            style={{ width: '100%' }}
            popupMatchSelectWidth={false}
            onChange={(value) => {
              const interfaceConfig = getInterface(value);
              handleFieldChange(
                {
                  ...field,
                  interface: value,
                  uiSchema: interfaceConfig?.default?.uiSchema,
                  type: interfaceConfig?.default?.type,
                },
                index,
              );
            }}
            allowClear={true}
          >
            {data.map((group) => (
              <Select.OptGroup key={group.key} label={compile(group.label)}>
                {group.children.map((item) => (
                  <Select.Option key={item.value} value={item.value}>
                    {compile(item.label)}
                  </Select.Option>
                ))}
              </Select.OptGroup>
            ))}
          </Select>
        );
      },
    },
  ];
  return (
    <Table
      bordered
      size="small"
      columns={columns}
      dataSource={dataSource}
      scroll={{ y: 300 }}
      pagination={false}
      rowClassName="editable-row"
      rowKey="name"
    />
  );
};
