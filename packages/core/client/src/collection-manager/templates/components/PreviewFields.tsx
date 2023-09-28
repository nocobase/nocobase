import { useField, useForm } from '@formily/react';
import { Cascader, Input, Select, Spin, Table, Tag } from 'antd';
import { last } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceActionContext, useCompile } from '../../../';
import { useAPIClient } from '../../../api-client';
import { getOptions } from '../../Configuration/interfaces';
import { useCollectionManager } from '../../hooks/useCollectionManager';

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
const PreviewCom = (props) => {
  const { databaseView, viewName, sources, schema } = props;
  const { data: fields } = useContext(ResourceActionContext);
  const api = useAPIClient();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [sourceFields, setSourceFields] = useState([]);
  const [sourceCollections, setSourceCollections] = useState(sources);
  const field: any = useField();
  const form = useForm();
  const { getCollection, getInterface, getCollectionFields, getInheritCollections, getParentCollectionFields } =
    useCollectionManager();
  const compile = useCompile();
  const initOptions = getOptions().filter((v) => !['relation', 'systemInfo'].includes(v.key));
  useEffect(() => {
    const data = [];
    sourceCollections.forEach((item) => {
      const collection = getCollection(item);
      const inherits = getInheritCollections(item);
      const result = inherits.map((v) => {
        const fields = getParentCollectionFields(v, item);
        return {
          type: 'group',
          key: v,
          label: t(`Parent collection fields`) + t(`(${getCollection(v).title})`),
          children: fields
            .filter((v) => !['hasOne', 'hasMany', 'belongsToMany'].includes(v?.type))
            .map((k) => {
              return {
                value: k.name,
                label: t(k.uiSchema?.title),
              };
            }),
        };
      });
      const children = collection.fields
        .filter((v) => !['hasOne', 'hasMany', 'belongsToMany'].includes(v?.type))
        ?.map((v) => {
          return { value: v.name, label: t(v.uiSchema?.title) };
        })
        .concat(result);
      data.push({
        value: item,
        label: t(collection.title),
        children,
      });
    });
    setSourceFields(data);
  }, [sourceCollections, databaseView]);
  useEffect(() => {
    if (databaseView) {
      setLoading(true);
      api
        .resource(`dbViews`)
        .get({ filterByTk: viewName, schema })
        .then(({ data }) => {
          if (data) {
            setLoading(false);
            setDataSource([]);
            const fieldsData = Object.values(data?.data?.fields)?.map((v: any) => {
              if (v.source) {
                return v;
              } else {
                return fields?.data.find((h) => h.name === v.name) || v;
              }
            });
            field.value = fieldsData;
            setTimeout(() => {
              setDataSource(fieldsData);
              form.setValuesIn('sources', data.data?.sources);
              setSourceCollections(data.data?.sources);
            });
          }
        }).catch;
    }
  }, [databaseView]);

  const handleFieldChange = (record, index) => {
    dataSource.splice(index, 1, record);
    setDataSource(dataSource);
    field.value = dataSource.map((v) => {
      const source = typeof v.source === 'string' ? v.source : v.source?.filter?.(Boolean)?.join('.');
      return {
        ...v,
        source,
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
              const sourceField = getCollectionFields(value?.[0])?.find((v) => v.name === last(value));
              handleFieldChange({ ...record, source: value, uiSchema: sourceField?.uiSchema }, index);
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
            data-testid="antd-select"
            defaultValue={text}
            popupMatchSelectWidth={false}
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
            data-testid="antd-select"
            defaultValue={text}
            style={{ width: '100%' }}
            popupMatchSelectWidth={false}
            onChange={(value) => {
              const interfaceConfig = getInterface(value);
              handleFieldChange({ ...item, interface: value, uiSchema: interfaceConfig?.default?.uiSchema }, index);
            }}
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
        return (
          <Input
            value={item?.uiSchema?.title || text}
            onChange={(e) =>
              handleFieldChange({ ...item, uiSchema: { ...item?.uiSchema, title: e.target.value } }, index)
            }
          />
        );
      },
    },
  ];
  return (
    <Spin spinning={loading}>
      {dataSource.length > 0 && (
        <>
          <div className="ant-formily-item-label" style={{ display: 'flex', padding: '0 0 8px' }}>
            <div className="ant-formily-item-label-content">
              <span>
                <label>{t('Fields')}</label>
              </span>
            </div>
            <span className="ant-formily-item-colon">:</span>
          </div>
          <Table
            bordered
            size={'middle'}
            columns={columns}
            dataSource={dataSource}
            scroll={{ y: 300 }}
            pagination={false}
            rowClassName="editable-row"
            key={viewName}
          />
        </>
      )}
    </Spin>
  );
};

function areEqual(prevProps, nextProps) {
  return nextProps.name === prevProps.name && nextProps.sources === prevProps.sources;
}

export const PreviewFields = React.memo(PreviewCom, areEqual);
PreviewFields.displayName = 'PreviewFields';
