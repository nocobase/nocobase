import React, { useEffect, useState } from 'react';
import { Table, Input, Select, Tag } from 'antd';
import { Cascader } from '@formily/antd';
import { useField, useForm } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { useCollectionManager } from '../../hooks/useCollectionManager';
import { useCompile } from '../../../';
import { getOptions } from '../../Configuration/interfaces';

const getInterfaceOptions = (data, type) => {
  const interfaceOptions = [];
  data.forEach((item) => {
    const options = item.children.filter((h) => h?.availableTypes?.includes(type));
    interfaceOptions.push({
      label: item.label,
      key: item.key,
      children: options,
    });
  });
  return interfaceOptions.filter((v) => v.children.length > 0);
};
export const PreviewFields = (props) => {
  const { name, sources } = props;
  const api = useAPIClient();
  const { t } = useTranslation();
  const [dataSource, setDataSource] = useState([]);
  const [previewColumns, setPreviewColumns] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [sourceFields, setSourceFields] = useState([]);
  const field: any = useField();
  const form = useForm();
  const { getCollection } = useCollectionManager();
  const compile = useCompile();
  const initOptions = getOptions().filter((v) => !['relation', 'systemInfo'].includes(v.key));
  useEffect(() => {
    const data = [];
    sources.forEach((item) => {
      const collection = getCollection(item);
      const children = collection.fields?.map((v) => {
        return { value: v.name, label: v.uiSchema?.title };
      });
      data.push({
        value: item,
        label: collection.title,
        children,
      });
    });
    setSourceFields(data);
  }, [sources, name]);

  useEffect(() => {
    if (name) {
      api
        .resource(`dbViews`)
        .get({ filterByTk: name })
        .then(({ data }) => {
          if (data) {
            setDataSource([]);
            const fieldsData = Object.values(data?.data?.fields);
            field.value = fieldsData;
            setDataSource(fieldsData);
            const pColumns = formatPreviewColumns(fieldsData);
            setPreviewColumns(pColumns);
            form.setValuesIn('sources', data.data?.sources);
          }
        });
    }
  }, [name]);

  useEffect(() => {
    if (name) {
      api
        .resource(`dbViews`)
        .query({ filterByTk: name, pageSize: 20 })
        .then(({ data }) => {
          if (data) {
            setPreviewData(data?.data || []);
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
        source: typeof v.source === 'string' ? v.source : v.source?.join('.'),
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
      title: t('Field source'),
      dataIndex: 'source',
      key: 'source',
      width: 200,
      render: (text, record, index) => {
        const options = sourceFields.filter((v) => sources.includes(v.value));
        return (
          <Cascader
            defaultValue={typeof text === 'string' ? text?.split('.') : text}
            allowClear
            style={{ width: '100%' }}
            options={compile(options)}
            onChange={(value, selectedOptions) => {
              handleFieldChange({ ...record, source: value }, index);
            }}
            placeholder={t('Select field source')}
          />
        );
      },
    },
    {
      title: t('Field type'),
      dataIndex: 'type',
      width: 150,
      key: 'type',
      render: (text, _, index) => {
        const item = dataSource[index];
        return item.source || !item.possibleTypes ? (
          <Tag>{text}</Tag>
        ) : (
          <Select
            defaultValue={text}
            style={{ width: '100%' }}
            options={
              item?.possibleTypes.map((v) => {
                return { label: v, value: v };
              }) || []
            }
            onChange={(value) => handleFieldChange({ ...item, type: value }, index)}
          />
        );
      },
    },
    {
      title: t('Field interface'),
      dataIndex: 'interface',
      key: 'interface',
      width: 150,
      render: (text, _, index) => {
        const item = dataSource[index];
        const data = getInterfaceOptions(initOptions, item.type);
        return item.source ? (
          text
        ) : (
          <Select
            style={{ width: '100%' }}
            onChange={(value) => handleFieldChange({ ...item, interface: value }, index)}
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
    {
      title: t('Field display name'),
      dataIndex: 'title',
      key: 'title',
      render: (text, _, index) => {
        const item = dataSource[index];
        return item.source ? (
          text
        ) : (
          <Input
            defaultValue={text}
            onChange={(e) => handleFieldChange({ ...item, uiSchema: { title: e.target.value } }, index)}
          />
        );
      },
    },
  ];
  const formatPreviewColumns = (data) => {
    return data?.map((item) => {
      const fieldSource = typeof item?.source === 'string' ? item?.source?.split('.') : item?.source;
      const sourceField = getCollection(fieldSource?.[0])?.fields.find((v) => v.name === fieldSource?.[1])?.uiSchema
        ?.title;
      const target = sourceField || item?.uiSchema?.title || item.name;
      return {
        title: compile(target),
        dataIndex: item.name,
        key: item.name,
      };
    });
  };
  return (
    dataSource.length > 0 && (
      <>
        <h4>{t('Fields')}:</h4>
        <Table
          bordered
          columns={columns}
          dataSource={dataSource}
          scroll={{ y: 300 }}
          pagination={false}
          rowClassName="editable-row"
          key={name}
        />
        <h4>{t('Preview')}:</h4>
        <Table bordered columns={previewColumns} dataSource={previewData} scroll={{ x: 300 }} />
      </>
    )
  );
};
