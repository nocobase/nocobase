import { useTranslation } from 'react-i18next';
import { useAsyncData } from '../../../../async-data-provider';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Input, Select, Spin, Table } from 'antd';
import { useField } from '@formily/react';
import { ArrayField } from '@formily/core';
import { getOptions } from '../../../Configuration/interfaces';
import { useCompile } from '../../../../schema-component';
import { useCollectionManager } from '../../../hooks';
import dayjs from 'dayjs';

const inferInterface = (field: string, value: any) => {
  if (field.toLowerCase().includes('id')) {
    return 'id';
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return 'integer';
    }
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (dayjs(value).isValid()) {
    return 'datetime';
  }
  return 'input';
};

export const FieldsConfigure = () => {
  const { t } = useTranslation();
  const [dataSource, setDataSource] = useState([]);
  const { data, error, loading } = useAsyncData();
  const field: ArrayField = useField();
  const compile = useCompile();
  const { getInterface } = useCollectionManager();
  const interfaceOptions = useMemo(
    () =>
      getOptions()
        .filter((v) => !['relation'].includes(v.key))
        .map((options, index) => ({
          ...options,
          key: index,
          label: compile(options.label),
          options: options.children.map((option) => ({
            ...option,
            label: compile(option.label),
          })),
        })),
    [compile],
  );

  useEffect(() => {
    const fieldsMp = new Map();
    if (!loading && data) {
      Object.entries(data?.[0] || {}).forEach(([col, val]) => {
        const fieldInterface = inferInterface(col, val);
        const defaultConfig = getInterface(fieldInterface)?.default;
        fieldsMp.set(col, {
          name: col,
          interface: fieldInterface,
          type: defaultConfig?.type,
          uiSchema: {
            title: col,
            ...defaultConfig?.uiSchema,
          },
        });
      });
    }
    if (field.value?.length) {
      field.value.forEach((item) => {
        if (fieldsMp.has(item.name)) {
          fieldsMp.set(item.name, item);
        }
      });
    }
    const fields = Array.from(fieldsMp.values());
    if (!fields.length) {
      return;
    }
    setDataSource(fields);
    field.setValue(fields);
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
    setDataSource(fields);
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
            defaultValue={field.uiSchema?.title !== undefined ? field.uiSchema.title : field?.name}
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
        return (
          <Select
            defaultValue={field.interface || 'input'}
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
            options={interfaceOptions}
          />
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
