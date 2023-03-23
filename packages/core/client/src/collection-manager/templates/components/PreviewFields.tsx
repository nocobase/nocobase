import React, { useEffect, useState } from 'react';
import { Table, Tag, Select, Input } from 'antd';
import { Cascader } from '@formily/antd';
import { useField } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { useCollectionManager } from '../../hooks/useCollectionManager';
import { useCompile } from '../../../';

export const PreviewFields = (props) => {
  const { name, source } = props;
  const api = useAPIClient();
  const { t } = useTranslation();
  const [dataSource, setDataSource] = useState([]);
  const [previewColumns, setPreviewColumns] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [sourceFields, setSourceFields] = useState([]);
  const field: any = useField();
  const { getCollection } = useCollectionManager();
  const compile = useCompile();

  useEffect(() => {
    const data = [];
    source.forEach((item) => {
      const collection = getCollection(item);
      const children = collection.fields?.map((v) => {
        return { value: v.name, label: v.uiSchema.title };
      });
      data.push({
        value: item,
        label: collection.title,
        children,
      });
    });
    setSourceFields(data);
  }, [source]);

  useEffect(() => {
    if (name) {
      api
        .resource(`dbViews/${name}/fields`)
        .list({
          paginate: false,
        })
        .then(({ data }) => {
          if (data?.data) {
            field.value = data.data;
            setDataSource(data?.data);
            const pColumns = formatPreviewColumns(data?.data);
            setPreviewColumns(pColumns);
          }
        });
    }
  }, [name]);

  const handleFieldChange = (record, index) => {
    dataSource.splice(index, 1, record);
    const pColumns = formatPreviewColumns(dataSource);
    setPreviewColumns(pColumns);
    setDataSource(dataSource);
    field.value = dataSource.map((v) => {
      return {
        ...v,
        source: v.source?.join('.'),
      };
    });
  };
  const columns = [
    {
      title: t('Field name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('Field type'),
      dataIndex: 'type',
      key: 'type',
      render: (text) => {
        return <Tag>{text}</Tag>;
      },
    },
    {
      title: t('Field source'),
      dataIndex: 'source',
      key: 'source',
      render: (text, record, index) => {
        return (
          <Cascader
            defaultValue={text?.split('.')}
            allowClear
            style={{ width: '100%' }}
            options={compile(sourceFields)}
            onChange={(value, selectedOptions) => {
              handleFieldChange({ ...record, source: value }, index);
            }}
            placeholder={t('Select field source')}
          />
        );
      },
    },
    {
      title: t('Field interface'),
      dataIndex: 'interface',
      key: 'interface',
      render: (text, _, index) => {
        const item = dataSource[index];
        return item.source ? (
          text
        ) : (
          <Select
            defaultValue={text}
            style={{ width: '100%' }}
            onChange={(value) => handleFieldChange({ ...item, interface: value }, index)}
          />
        );
      },
    },
    {
      title: t('Field display name'),
      dataIndex: 'title',
      key: 'title',
      render: (text, _, index) => {
        const item = dataSource[index];
        return item.source ? (
          text
        ) : (
          <Input defaultValue={text} onChange={(e) => handleFieldChange({ ...item, title: e.target.value }, index)} />
        );
      },
    },
  ];
  const formatPreviewColumns = (data) => {
    return data?.map((item) => {
      const sourceField = getCollection(item?.source?.[0])?.fields.find((v) => v.name === item?.source?.[1])?.uiSchema
        .title;
      const target = sourceField || item.title || item.name;
      return {
        title: compile(target),
        dataIndex: target,
        key: target,
      };
    });
  };
  return (
    dataSource.length > 0 && (
      <>
        <h4>Fields:</h4>
        <Table
          bordered
          columns={columns}
          dataSource={dataSource}
          scroll={{ y: 300 }}
          pagination={false}
          rowClassName="editable-row"
          key={name}
        />
        <h4>Preview:</h4>
        <Table bordered columns={previewColumns} scroll={{ x: 300 }} />
      </>
    )
  );
};
