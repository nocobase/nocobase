import { Field } from '@formily/core';
import { observer, useField, useForm } from '@formily/react';
import { Select, Input } from 'antd';
import React, { useState, useEffect } from 'react';
import { useRecord_deprecated } from '../../../record-provider';
import { useCompile } from '../../../schema-component';
import { useCollectionManager_deprecated } from '../../hooks';

export const SourceForeignKey = observer(
  () => {
    const record = useRecord_deprecated();
    const { getCollection } = useCollectionManager_deprecated();
    const collection = record?.collectionName ? getCollection(record.collectionName) : record;
    const field = useField<Field>();
    const form = useForm();
    const { getCollectionFields } = useCollectionManager_deprecated();
    return (
      <div>
        <Select
          allowClear
          placeholder={'留空时，自动生成 FK 字段'}
          disabled={field.disabled}
          value={field.value}
          options={getCollectionFields(collection.name)
            .filter((field) => field.type)
            .map((field) => {
              return {
                label: field?.uiSchema?.title || field.name,
                value: field.name,
              };
            })}
        />
      </div>
    );
  },
  { displayName: 'SourceForeignKey' },
);

export const ThroughForeignKey = observer(
  () => {
    const field = useField<Field>();
    const form = useForm();
    const { getCollectionFields } = useCollectionManager_deprecated();
    return (
      <div>
        <Select
          allowClear
          popupMatchSelectWidth={false}
          placeholder={'留空时，自动生成 FK 字段'}
          disabled={field.disabled}
          value={field.value}
          options={getCollectionFields(form.values.through)
            .filter((field) => field.type)
            .map((field) => {
              return {
                label: field?.uiSchema?.title || field.name,
                value: field.name,
              };
            })}
        />
      </div>
    );
  },
  { displayName: 'ThroughForeignKey' },
);

export const TargetForeignKey = observer(
  () => {
    const field = useField<Field>();
    const form = useForm();
    const { getCollectionFields } = useCollectionManager_deprecated();
    return (
      <div>
        <Select
          allowClear
          popupMatchSelectWidth={false}
          placeholder={'留空时，自动生成 FK 字段'}
          disabled={field.disabled}
          value={field.value}
          options={getCollectionFields(form.values.target)
            .filter((field) => field.type)
            .map((field) => {
              return {
                label: field?.uiSchema?.title || field.name,
                value: field.name,
              };
            })}
        />
      </div>
    );
  },
  { displayName: 'TargetForeignKey' },
);

export const SourceCollection = observer(
  () => {
    const record = useRecord_deprecated();
    const { getCollection } = useCollectionManager_deprecated();
    const collection = record?.collectionName ? getCollection(record.collectionName) : record;
    const compile = useCompile();
    return (
      <div>
        <Select
          disabled
          popupMatchSelectWidth={false}
          value={collection.name}
          options={[{ value: collection.name, label: compile(collection.title) }]}
        />
      </div>
    );
  },
  { displayName: 'SourceCollection' },
);

export const SourceKey = observer(
  (props: any) => {
    const { sourceKey, collectionName, name } = useRecord_deprecated();
    const { getCollection } = useCollectionManager_deprecated();
    const field: any = useField();
    const compile = useCompile();
    const options = getCollection(collectionName || name)
      .fields?.filter((v) => {
        return ['string', 'bigInt', 'integer', 'float'].includes(v.type);
      })
      .map((k) => {
        console.log(k);
        return {
          value: k.name,
          label: compile(k.uiSchema?.title || k.name),
        };
      });
    useEffect(() => {
      field.initialValue = options?.[0]?.value || sourceKey;
    }, []);
    return (
      <div>
        <Select
          disabled={sourceKey}
          options={options}
          defaultValue={sourceKey || options?.[0]?.value}
          onChange={props?.onChange}
          showSearch
        />
      </div>
    );
  },
  { displayName: 'SourceKey' },
);
export const TargetKey = observer(
  (props: any) => {
    const { value, disabled } = props;
    const { targetKey } = useRecord_deprecated();
    const { getCollection } = useCollectionManager_deprecated();
    const [options, setOptions] = useState([]);
    const [initialValue, setInitialValue] = useState(value || targetKey);
    const form = useForm();
    const compile = useCompile();
    const field: any = useField();
    field.required = true;
    return (
      <div>
        <Select
          showSearch
          options={options}
          onDropdownVisibleChange={async (open) => {
            const { target } = form.values;
            if (target && open) {
              setOptions(
                getCollection(target)
                  .fields?.filter((v) => {
                    return ['string', 'bigInt', 'integer', 'float'].includes(v.type);
                  })
                  .map((k) => {
                    return {
                      value: k.name,
                      label: compile(k?.uiSchema?.title || k.title || k.name),
                    };
                  }),
              );
            }
          }}
          onChange={(value) => {
            props?.onChange?.(value);
            setInitialValue(value);
          }}
          value={initialValue}
          disabled={disabled}
        />
      </div>
    );
  },
  { displayName: 'TargetKey' },
);

export const ForeignKey = observer(
  (props) => {
    return (
      <div>
        <Input {...props} />
      </div>
    );
  },
  { displayName: 'ForeignKey' },
);
