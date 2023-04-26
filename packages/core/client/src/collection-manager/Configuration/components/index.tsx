import { Field } from '@formily/core';
import { observer, useField, useForm } from '@formily/react';
import { Select } from 'antd';
import React from 'react';
import { useRecord } from '../../../record-provider';
import { useCompile } from '../../../schema-component';
import { useCollectionManager } from '../../hooks';

export const SourceForeignKey = observer(() => {
  const record = useRecord();
  const { getCollection } = useCollectionManager();
  const collection = record?.collectionName ? getCollection(record.collectionName) : record;
  const field = useField<Field>();
  const form = useForm();
  const { getCollectionFields } = useCollectionManager();
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
});

export const ThroughForeignKey = observer(() => {
  const field = useField<Field>();
  const form = useForm();
  const { getCollectionFields } = useCollectionManager();
  return (
    <div>
      <Select
        allowClear
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
});

export const TargetForeignKey = observer(() => {
  const field = useField<Field>();
  const form = useForm();
  const { getCollectionFields } = useCollectionManager();
  return (
    <div>
      <Select
        allowClear
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
});

export const SourceCollection = observer(() => {
  const record = useRecord();
  const { getCollection } = useCollectionManager();
  const collection = record?.collectionName ? getCollection(record.collectionName) : record;
  const compile = useCompile();
  return (
    <div>
      <Select
        disabled
        value={collection.name}
        options={[{ value: collection.name, label: compile(collection.title) }]}
      />
    </div>
  );
});

export const SourceKey = observer(() => {
  return (
    <div>
      <Select disabled value={'id'} options={[{ value: 'id', label: 'ID' }]} />
    </div>
  );
});

export const TargetKey = observer(() => {
  return (
    <div>
      <Select disabled value={'id'} options={[{ value: 'id', label: 'ID' }]} />
    </div>
  );
});
