import React from "react";
import { observer, useForm, useField } from "@formily/react";
import { Input, Button, Dropdown, Menu, Form } from "antd";
import { PlusOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from "react-i18next";
import { css } from "@emotion/css";

import { CollectionField, CollectionProvider, SchemaComponent, Variable, useCollectionManager, useCompile } from "@nocobase/client";
import { lang } from "../locale";
import { useWorkflowVariableOptions } from "../variable";

function AssociationInput(props) {
  const { getCollectionFields } = useCollectionManager();
  const { path } = useField();
  const fieldName = path.segments[path.segments.length - 1] as string;
  const { values: data } = useForm();
  const fields = getCollectionFields(data?.config?.collection);
  const { type } = fields.find(item => item.name === fieldName);

  const value = Array.isArray(props.value) ? props.value.join(',') : props.value;
  function onChange(ev) {
    const trimed = ev.target.value.trim();
    props.onChange(['belongsTo', 'hasOne'].includes(type) ? trimed : trimed.split(/[,\s]+/));
  }
  return (
    <Input {...props} value={value} onChange={onChange} />
  );
}

// NOTE: observer for watching useProps
export default observer(({ value, disabled, onChange }: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const form = useForm();
  const { getCollection, getCollectionFields } = useCollectionManager();
  const { values: data } = useForm();
  const collectionName = data?.config?.collection;
  const fields = getCollectionFields(collectionName)
    .filter(field => (
      !field.hidden
      && (field.uiSchema ? !field.uiSchema['x-read-pretty'] : false)
      // TODO: should use some field option but not type to control this
      && (!['formula'].includes(field.type))
    ));

  const unassignedFields = fields.filter(field => !(field.name in value));
  const scope = useWorkflowVariableOptions();
  const mergedDisabled = disabled || form.disabled;

  return (
    <fieldset className={css`
      margin-top: .5em;

      > .ant-formily-item{
        flex-direction: column;

        > .ant-formily-item-label{
          line-height: 32px;
        }
      }
    `}>
      {fields.length
        ? (
          <CollectionProvider collection={getCollection(collectionName)}>
            {fields
              .filter(field => field.name in value)
              .map(field => {
                // constant for associations to use Input, others to use CollectionField
                // dynamic values only support belongsTo/hasOne association, other association type should disable
                const ConstantCompoent = ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type)
                  ? AssociationInput
                  : CollectionField;
                // TODO: try to use <ObjectField> to replace this map
                return (
                  <Form.Item key={field.name} label={compile(field.uiSchema?.title ?? field.name)} labelAlign="left" className={css`
                    .ant-form-item-control-input-content{
                      display: flex;
                    }
                  `}>
                    <Variable.Input
                      scope={['hasMany', 'belongsToMany'].includes(field.type) ? [] : scope}
                      value={value[field.name]}
                      onChange={(next) => {
                        onChange({ ...value, [field.name]: next });
                      }}
                    >
                      <SchemaComponent
                        schema={{
                          type: 'void',
                          properties: {
                            [field.name]: {
                              'x-component': ConstantCompoent
                            }
                          }
                        }}
                      />
                    </Variable.Input>
                    {!mergedDisabled
                      ? (
                        <Button
                          type="link"
                          icon={<CloseCircleOutlined />}
                          onClick={() => {
                            const { [field.name]: _, ...rest } = value;
                            onChange(rest);
                          }}
                        />
                      )
                      : null}
                  </Form.Item>
                );
              })
            }
            {unassignedFields.length
              ? (
                <Dropdown overlay={
                  <Menu onClick={({ key }) => onChange({ ...value, [key]: null })} className={css`
                    max-height: 300px;
                    overflow-y: auto;
                  `}>
                    {unassignedFields.map(field => (
                      <Menu.Item key={field.name}>{compile(field.uiSchema?.title ?? field.name)}</Menu.Item>
                    ))}
                  </Menu>
                }>
                  <Button icon={<PlusOutlined />}>{t('Add field')}</Button>
                </Dropdown>
              )
              : null
            }
          </CollectionProvider>
        )
        : <p>{lang('Please select collection first')}</p>
      }
    </fieldset>
  );
});
