/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { useField, useForm, FormProvider, Field } from '@formily/react';
import { omit } from 'lodash';
import { FormItem } from '@formily/antd-v5';
import { Input, Select, Spin, Table, Tag } from 'antd';
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { createForm, onFieldValidateFailed, onFieldValidateSuccess } from '@formily/core';
import {
  ResourceActionContext,
  useCompile,
  useAPIClient,
  useFieldInterfaceOptions,
  useCollectionManager_deprecated,
} from '@nocobase/client';
import { UnSupportFields } from './UnSupportFields';

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
  return interfaceOptions.filter((v) => v.children?.length > 0);
};

const PreviewCom = (props) => {
  const { remoteServerName, remoteTableName } = props;
  const { data: fields } = useContext(ResourceActionContext);
  const api = useAPIClient();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [unsupportedFields, setUnsupportedFields] = useState([]);
  const parentForm = useForm();
  const form = useMemo(
    () =>
      createForm({
        effects() {
          onFieldValidateFailed('*', () => {
            parentForm.query('fields').take((field: any) => {
              field.setFeedback({
                type: 'error',
                messages: ['display name is required'],
              });
            });
          });
          onFieldValidateSuccess('*', () => {
            if (form.valid) {
              parentForm.query('fields').take((field: any) => {
                field.setFeedback({
                  type: 'error',
                  messages: [],
                });
              });
            }
          });
        },
      }),
    [],
  );
  const field: any = useField();
  const { getInterface } = useCollectionManager_deprecated();
  const compile = useCompile();
  const options = useFieldInterfaceOptions();
  const initOptions = options.filter((v) => !['relation'].includes(v.key));
  useEffect(() => {
    if (remoteServerName && remoteTableName) {
      setLoading(true);
      api
        .resource(`databaseServers/${remoteServerName}/tables`)
        .get({ filterByTk: remoteTableName })
        .then(({ data }) => {
          if (data) {
            setLoading(false);
            setDataSource([]);
            const fieldsData = Object.values(data?.data?.fields)
              ?.map((v: any) => {
                const option = fields?.data.find((h) => h.name === v.name && h.type === v.type) || v;
                return {
                  ...option,
                  uiSchema: omit(option?.uiSchema, 'rawTitle'),
                  allowNull: v.allowNull,
                  primaryKey: v.primaryKey,
                  unique: v.unique,
                };
              })
              .map((v) => {
                return {
                  ...v,
                  uiSchema: { title: v.title || v.uiSchema?.title || v.name, required: !v.allowNull },
                };
              });
            field.value = fieldsData;
            setTimeout(() => {
              setDataSource(fieldsData);
              setUnsupportedFields(data?.data?.unsupportedFields);
            });
          }
        }).catch;
    } else {
      setDataSource([]);
      field.value = [];
    }
  }, [remoteTableName, remoteServerName]);

  const handleFieldChange = (obj, index) => {
    const record = { ...dataSource[index], ...obj };
    dataSource.splice(index, 1, record);
    setDataSource(dataSource);
    field.value = dataSource;
  };

  const InterfaceSelect = ({ item, index }) => {
    const data = getInterfaceOptions(initOptions, item.type);
    const defaultValue = data?.[0]?.children?.[0]?.name;
    useEffect(() => {
      if (!item.interface) {
        const interfaceConfig = getInterface(defaultValue);
        handleFieldChange(
          {
            interface: defaultValue,
            uiSchema: {
              title: item?.uiSchema?.title,
              ...interfaceConfig?.default?.uiSchema,
              required: !item.allowNull,
            },
          },
          index,
        );
      }
    }, []);
    return (
      <Select
        defaultValue={item.interface || defaultValue}
        style={{ width: '100%' }}
        popupMatchSelectWidth={false}
        onChange={(value) => {
          const interfaceConfig = getInterface(value);
          handleFieldChange(
            { interface: value, uiSchema: { ...interfaceConfig?.default?.uiSchema, required: !item.allowNull } },
            index,
          );
        }}
      >
        {data.map((group) => (
          <Select.OptGroup key={group.key} label={compile(group.label)}>
            {group.children.map((item) => (
              <Select.Option key={item.value} value={item.name}>
                {compile(item.label)}
              </Select.Option>
            ))}
          </Select.OptGroup>
        ))}
      </Select>
    );
  };

  const columns = [
    {
      title: t('Name'),
      dataIndex: 'name',
      key: 'name',
      width: 130,
    },
    {
      title: t('Type'),
      dataIndex: 'type',
      width: 140,
      key: 'type',
      render: (text, _, index) => {
        const item = dataSource[index];
        return !item?.possibleTypes ? (
          text && <Tag>{text}</Tag>
        ) : (
          <Select
            defaultValue={text}
            popupMatchSelectWidth={false}
            style={{ width: '100%' }}
            options={
              item?.possibleTypes.map((v) => {
                return { label: v, value: v };
              }) || []
            }
            onChange={(value) => handleFieldChange({ type: value }, index)}
          />
        );
      },
    },
    {
      title: t('Interface'),
      dataIndex: 'interface',
      key: 'interface',
      width: 150,
      render: (text, _, index) => {
        const item = dataSource[index];
        return item.source ? text : <InterfaceSelect item={item} index={index} />;
      },
    },
    {
      title: t('Display name'),
      dataIndex: 'title',
      key: 'title',
      width: 180,
      render: (text, record, index) => {
        const item = dataSource[index];
        return (
          <Field
            name={`${record.name}`} // 使用唯一的name属性
            required
            decorator={[
              FormItem,
              {
                feedbackLayout: 'terse',
                style: { marginBottom: '0px' },
              },
            ]}
            component={[
              Input,
              {
                defaultValue: item?.uiSchema?.title || text,
                onChange: (e) =>
                  handleFieldChange(
                    { uiSchema: { ...omit(item?.uiSchema, 'rawTitle'), title: e.target.value } },
                    index,
                  ),
              },
            ]}
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
          <FormProvider form={form}>
            <Table
              bordered
              size={'middle'}
              columns={columns}
              dataSource={dataSource}
              scroll={{ y: 300 }}
              pagination={false}
              rowClassName="editable-row"
              key={remoteServerName}
            />
          </FormProvider>
        </>
      )}
      <UnSupportFields dataSource={unsupportedFields} />
    </Spin>
  );
};

function areEqual(prevProps, nextProps) {
  return (
    nextProps.remoteServerName === prevProps.remoteServerName && nextProps.remoteTableName === prevProps.remoteTableName
  );
}

export const PreviewFields = React.memo(PreviewCom, areEqual);
PreviewFields.displayName = 'PreviewFields';
