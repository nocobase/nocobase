import { Field } from '@formily/core';
import { observer, useField, useForm } from '@formily/react';
import { Select } from 'antd';
import React, { useMemo } from 'react';
import { useRecord } from '../../../record-provider';
import { useCompile } from '../../../schema-component';
import { useCollectionManagerV2 } from '../../../application';

export const SourceForeignKey = observer(
  () => {
    const record = useRecord();
    const collectionManager = useCollectionManagerV2();
    const collection = useMemo(() => {
      return record?.collectionName ? collectionManager.getCollection(record.collectionName) : record;
    }, [collectionManager, record]);
    const field = useField<Field>();
    return (
      <div>
        <Select
          allowClear
          placeholder={'留空时，自动生成 FK 字段'}
          disabled={field.disabled}
          value={field.value}
          options={collection.fields
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
    const collectionManager = useCollectionManagerV2();
    const collection = useMemo(() => {
      return collectionManager.getCollection(form.values.through);
    }, [collectionManager, form.values.through]);
    return (
      <div>
        <Select
          allowClear
          popupMatchSelectWidth={false}
          placeholder={'留空时，自动生成 FK 字段'}
          disabled={field.disabled}
          value={field.value}
          options={collection
            .getFields((field) => field.type)
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
    const collectionManager = useCollectionManagerV2();
    const collection = useMemo(() => {
      return collectionManager.getCollection(form.values.target);
    }, [collectionManager, form.values.target]);
    return (
      <div>
        <Select
          allowClear
          popupMatchSelectWidth={false}
          placeholder={'留空时，自动生成 FK 字段'}
          disabled={field.disabled}
          value={field.value}
          options={collection
            .getFields((field) => field.type)
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
    const record = useRecord();
    const collectionManager = useCollectionManagerV2();
    const collection = record?.collectionName ? collectionManager.getCollection(record.collectionName) : record;
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
  () => {
    return (
      <div>
        <Select disabled value={'id'} options={[{ value: 'id', label: 'ID' }]} />
      </div>
    );
  },
  { displayName: 'SourceKey' },
);

export const TargetKey = observer(
  () => {
    return (
      <div>
        <Select disabled value={'id'} options={[{ value: 'id', label: 'ID' }]} />
      </div>
    );
  },
  { displayName: 'TargetKey' },
);
