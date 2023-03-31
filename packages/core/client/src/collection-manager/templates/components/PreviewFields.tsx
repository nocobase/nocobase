import React, { useEffect, useState } from 'react';
import { Table, Input, Select, Tag } from 'antd';
import { Cascader } from '@formily/antd';
import { useField, useForm, RecursionField } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { useCollectionManager } from '../../hooks/useCollectionManager';
import { useCompile, EllipsisWithTooltip, TableBlockProvider } from '../../../';
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
  const { name, sources, viewName, schema, fields } = props;
  const api = useAPIClient();
  const { t } = useTranslation();
  const [dataSource, setDataSource] = useState([]);
  const [previewColumns, setPreviewColumns] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [sourceFields, setSourceFields] = useState([]);
  const field: any = useField();
  const form = useForm();
  const { getCollection, getCollectionField, getInterface } = useCollectionManager();
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
        .get({ filterByTk: viewName, schema })
        .then(({ data }) => {
          if (data) {
            setDataSource([]);
            const fieldsData = Object.values(data?.data?.fields)?.map((v: any) => {
              if (v.source) {
                return v;
              } else {
                return fields.find((h) => h.name === v.name) || v;
              }
            });
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
      getPreviewData({ page: 1, pageSize: 10 });
    }
  }, [name]);

  const getPreviewData = ({ page, pageSize }) => {
    api
      .resource(`dbViews`)
      .query({ filterByTk: viewName, schema, page, pageSize })
      .then(({ data }) => {
        if (data) {
          setPreviewData(data?.data || []);
        }
      });
  };

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
      width: 130,
    },
    {
      title: t('Field source'),
      dataIndex: 'source',
      key: 'source',
      width: 200,
      render: (text, record, index) => {
        return (
          <Cascader
            defaultValue={typeof text === 'string' ? text?.split('.') : text}
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
      title: t('Field type'),
      dataIndex: 'type',
      width: 140,
      key: 'type',
      render: (text, _, index) => {
        const item = dataSource[index];
        return item?.source || !item?.possibleTypes ? (
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
            defaultValue={text}
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
      width: 180,
      render: (text, record, index) => {
        const item = dataSource[index];
        return item.source ? (
          record?.uiSchema?.title
        ) : (
          <Input
            defaultValue={record?.uiSchema?.title}
            onChange={(e) => handleFieldChange({ ...item, uiSchema: { title: e.target.value } }, index)}
          />
        );
      },
    },
  ];
  const formatPreviewColumns = (data) => {
    return data
      .filter((k) => k.source || k.interface)
      ?.map((item) => {
        const fieldSource = typeof item?.source === 'string' ? item?.source?.split('.') : item?.source;
        const sourceField = getCollection(fieldSource?.[0])?.fields.find((v) => v.name === fieldSource?.[1])?.uiSchema
          ?.title;
        const target = sourceField || item?.uiSchema?.title || item.name;
        const schema: any = item.source
          ? getCollectionField(item.source)?.uiSchema
          : getInterface(item.interface)?.properties?.['uiSchema.title'];
        return {
          title: compile(target),
          dataIndex: item.name,
          key: item.name,
          width: 150,
          render: (v, record, index) => {
            const content = record[item.name];
            const objSchema: any = {
              type: 'object',
              properties: {
                [item.name]: { ...schema, default: content, 'x-read-pretty': true, title: null },
              },
            };
            return (
              <EllipsisWithTooltip
                ellipsis={true}
                popoverContent={<RecursionField schema={objSchema} name={index} onlyRenderProperties />}
              >
                <RecursionField schema={objSchema} name={index} onlyRenderProperties />
              </EllipsisWithTooltip>
            );
          },
        };
      });
  };
  return (
    dataSource.length > 0 && (
      <div>
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
        <TableBlockProvider>
          <Table
            key={name}
            onChange={(pagination, filters, sorter, extra) => {
              getPreviewData({ page: pagination.current, pageSize: pagination.pageSize });
            }}
            bordered
            columns={previewColumns}
            dataSource={previewData}
            scroll={{ x: 1000, y: 300 }}
          />
        </TableBlockProvider>
      </div>
    )
  );
};
