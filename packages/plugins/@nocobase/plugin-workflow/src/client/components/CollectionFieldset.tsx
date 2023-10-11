import { CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { observer, useField, useForm } from '@formily/react';
import {
  CollectionField,
  CollectionProvider,
  SchemaComponent,
  Variable,
  css,
  useCollectionManager,
  useCompile,
  useToken,
} from '@nocobase/client';
import { Button, Dropdown, Form, Input, MenuProps } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { lang } from '../locale';
import { useWorkflowVariableOptions } from '../variable';

function AssociationInput(props) {
  const { getCollectionFields } = useCollectionManager();
  const { path } = useField();
  const fieldName = path.segments[path.segments.length - 1] as string;
  const { values: config } = useForm();
  const fields = getCollectionFields(config?.collection);
  const { type } = fields.find((item) => item.name === fieldName);

  const value = Array.isArray(props.value) ? props.value.join(',') : props.value;
  function onChange(ev) {
    const trimed = ev.target.value.trim();
    props.onChange(['belongsTo', 'hasOne'].includes(type) ? trimed : trimed.split(/[,\s]+/));
  }
  return <Input {...props} value={value} onChange={onChange} />;
}

// NOTE: observer for watching useProps
const CollectionFieldSet = observer(
  ({ value, disabled, onChange, filter }: any) => {
    const { token } = useToken();
    const { t } = useTranslation();
    const compile = useCompile();
    const form = useForm();
    const { getCollection, getCollectionFields } = useCollectionManager();
    const scope = useWorkflowVariableOptions();
    const { values: config } = form;
    const collectionName = config?.collection;
    const collectionFields = getCollectionFields(collectionName).filter((field) => field.uiSchema);
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
          <CollectionProvider collection={getCollection(collectionName)}>
            {fields
              .filter((field) => value && field.name in value)
              .map((field) => {
                // constant for associations to use Input, others to use CollectionField
                // dynamic values only support belongsTo/hasOne association, other association type should disable
                const ConstantCompoent = ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type)
                  ? AssociationInput
                  : CollectionField;
                // TODO: try to use <ObjectField> to replace this map
                return (
                  <Form.Item
                    key={field.name}
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
                      value={value[field.name]}
                      changeOnSelect
                      onChange={(next) => {
                        onChange({ ...value, [field.name]: next });
                      }}
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
                        data-testid="close-icon-button"
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
              })}
            {unassignedFields.length ? (
              <Dropdown menu={menu}>
                <Button icon={<PlusOutlined />}>{t('Add field')}</Button>
              </Dropdown>
            ) : null}
          </CollectionProvider>
        ) : (
          <p style={{ color: token.colorText }}>{lang('Please select collection first')}</p>
        )}
      </fieldset>
    );
  },
  { displayName: 'CollectionFieldSet' },
);

export default CollectionFieldSet;
