/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { observer, useField, useForm, ObjectField } from '@formily/react';
import {
  CollectionField,
  CollectionProvider_deprecated,
  SchemaComponent,
  Variable,
  css,
  parseCollectionName,
  useCollectionManager_deprecated,
  useCompile,
  useToken,
} from '@nocobase/client';
import { Button, Dropdown, Form, Input, MenuProps } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { lang } from '../locale';
import { useWorkflowVariableOptions } from '../variable';

function AssociationInput(props) {
  const { getCollectionFields } = useCollectionManager_deprecated();
  const { path } = useField();
  const fieldName = path.segments[path.segments.length - 1] as string;
  const { values: config } = useForm();
  const [dataSourceName, collectionName] = parseCollectionName(config?.collection);
  const fields = getCollectionFields(collectionName, dataSourceName);
  const { type } = fields.find((item) => item.name === fieldName);

  const value = Array.isArray(props.value) ? props.value.join(',') : props.value;
  const onChange = useCallback(
    (ev) => {
      const trimed = ev.target.value.trim();
      const next = ['belongsTo', 'hasOne'].includes(type)
        ? trimed || null
        : trimed
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item !== '');
      props.onChange(next);
    },
    [props.onChange, type],
  );

  return <Input {...props} value={value} onChange={onChange} />;
}

/**
 * @deprecated
 */
const CollectionFieldSet = observer(
  ({ value, disabled, onChange, filter }: any) => {
    const { token } = useToken();
    const { t } = useTranslation();
    const compile = useCompile();
    const form = useForm();
    const { getCollectionFields } = useCollectionManager_deprecated();
    const scope = useWorkflowVariableOptions();
    const { values: config } = form;
    const [dataSourceName, collectionName] = parseCollectionName(config?.collection);
    const collectionFields = getCollectionFields(collectionName, dataSourceName).filter((field) => field.uiSchema);
    const fields = filter ? collectionFields.filter(filter.bind(config)) : collectionFields;

    const unassignedFields = useMemo(() => fields.filter((field) => !value || !(field.name in value)), [fields, value]);
    const mergedDisabled = disabled || form.disabled;
    const menu = useMemo<MenuProps>(() => {
      return {
        onClick: ({ key }) => {
          onChange({ ...value, [key]: null });
        },
        style: {
          maxHeight: 300,
          overflowY: 'auto',
        },
        items: unassignedFields.map((field) => ({
          key: field.name,
          label: compile(field.uiSchema?.title ?? field.name),
        })),
      };
    }, [onChange, unassignedFields, value]);

    return (
      <fieldset
        className={css`
          margin-top: 0.5em;

          > .ant-formily-item {
            flex-direction: column;

            > .ant-formily-item-label {
              line-height: 32px;
            }
          }
        `}
      >
        {fields.length ? (
          <CollectionProvider_deprecated name={collectionName} dataSource={dataSourceName}>
            {fields
              .filter((field) => value && field.name in value)
              .map((field) => {
                const ConstantCompoent = ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type)
                  ? AssociationInput
                  : CollectionField;
                const FieldItem = ({ value: fieldValue, onChange: onFieldChange }) => (
                  <Form.Item
                    label={compile(field.uiSchema?.title ?? field.name)}
                    labelAlign="left"
                    className={css`
                      .ant-form-item-control-input-content {
                        display: flex;
                      }
                    `}
                  >
                    <Variable.Input
                      scope={scope}
                      value={fieldValue}
                      changeOnSelect
                      onChange={onFieldChange}
                    >
                      <SchemaComponent
                        schema={{
                          type: 'void',
                          properties: {
                            [field.name]: {
                              'x-component': ConstantCompoent,
                              ['x-validator']() {
                                return '';
                              },
                            },
                          },
                        }}
                      />
                    </Variable.Input>
                    {!mergedDisabled ? (
                      <Button
                        aria-label="icon-close"
                        type="link"
                        icon={<CloseCircleOutlined />}
                        onClick={() => {
                          const { [field.name]: _, ...rest } = value;
                          onChange(rest);
                        }}
                      />
                    ) : null}
                  </Form.Item>
                );
                return <ObjectField key={field.name} name={field.name} component={[FieldItem]} />;
              })}
            {unassignedFields.length ? (
              <Dropdown menu={menu}>
                <Button icon={<PlusOutlined />}>{t('Add field')}</Button>
              </Dropdown>
            ) : null}
          </CollectionProvider_deprecated>
        ) : (
          <p style={{ color: token.colorText }}>{lang('Please select collection first')}</p>
        )}
      </fieldset>
    );
  },
  { displayName: 'CollectionFieldSet' },
);

export default CollectionFieldSet;
