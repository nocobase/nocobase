import React, { useEffect, useState } from 'react';
import { Select } from 'antd';
import { observer, useForm, useField } from '@formily/react';
import { useParams } from 'react-router-dom';
import { useRecord, useCompile, useAPIClient } from '@nocobase/client';
import { useRemoteCollectionContext } from '../CollectionFields';

export const SourceKey = observer(
  (props: any) => {
    const { fields, sourceKey } = useRecord();
    const field: any = useField();
    const compile = useCompile();
    const options = fields
      ?.filter((v) => {
        return ['string', 'bigInt', 'integer', 'float'].includes(v.type);
      })
      .map((k) => {
        return {
          value: k.name,
          label: compile(k.title || k.name),
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
          defaultValue={options?.[0]?.value || sourceKey}
          onChange={props?.onChange}
          showSearch
        />
      </div>
    );
  },
  { displayName: 'SourceKey' },
);

export const ForeignKey = observer(
  (props: any) => {
    const { value, disabled } = props;
    const api = useAPIClient();
    const [options, setOptions] = useState([]);
    const { name: dataSourceKey } = useParams();
    const { name: collectionName, fields } = useRecord();
    const compile = useCompile();
    const form = useForm();
    const { target, type, through } = form.values;
    const [initialValue, setInitialValue] = useState(value);
    const field: any = useField();
    useEffect(() => {
      field.initialValue = null;
      if (['belongsTo'].includes(type) && fields) {
        const sourceOptions = fields
          ?.filter((v) => {
            return ['string', 'bigInt', 'integer', 'float'].includes(v.type);
          })
          .map((k) => {
            return {
              value: k.name,
              label: compile(k.title || k.name),
            };
          });
        setOptions(sourceOptions);
      }
    }, [type]);
    useEffect(() => {
      setInitialValue(value);
    }, [value]);
    return (
      <div>
        <Select
          disabled={disabled}
          value={initialValue}
          options={options}
          showSearch
          onDropdownVisibleChange={async (open) => {
            const effectField = ['belongsTo'].includes(type)
              ? collectionName
              : ['belongsToMany'].includes(type)
                ? through
                : target;
            if (effectField && open) {
              const { data } = await api.request({
                url: `dataSourcesCollections/${dataSourceKey}.${effectField}/fields:list`,
                params: {
                  paginate: false,
                  filter: {
                    $or: [{ 'interface.$not': null }, { 'options.source.$notEmpty': true }],
                  },
                  sort: ['sort'],
                },
              });
              setOptions(
                data.data
                  ?.filter((v) => {
                    return ['string', 'bigInt', 'integer', 'float'].includes(v.type);
                  })
                  .map((k) => {
                    return {
                      value: k.name,
                      label: compile(k.title || k.name),
                    };
                  }),
              );
            }
          }}
          onChange={(value) => {
            props?.onChange?.(value);
            setInitialValue(value);
          }}
        />
      </div>
    );
  },
  { displayName: 'ForeignKey' },
);
export const TargetKey = observer(
  (props: any) => {
    const { value, disabled } = props;
    const { targetKey } = useRecord();
    const { name: dataSourceKey } = useParams();
    const api = useAPIClient();
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
              const { data } = await api.request({
                url: `dataSourcesCollections/${dataSourceKey}.${target}/fields:list`,
                params: {
                  paginate: false,
                  filter: {
                    $or: [{ 'interface.$not': null }, { 'options.source.$notEmpty': true }],
                  },
                  sort: ['sort'],
                },
              });
              setOptions(
                data.data
                  ?.filter((v) => {
                    return ['string', 'bigInt', 'integer', 'float'].includes(v.type);
                  })
                  .map((k) => {
                    return {
                      value: k.name,
                      label: compile(k.title || k.name),
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

export const SourceCollection = observer(
  () => {
    const compile = useCompile();
    const { targetCollection } = useRemoteCollectionContext();

    return (
      <div>
        <Select
          disabled
          showSearch
          popupMatchSelectWidth={false}
          value={targetCollection.name}
          options={[{ value: targetCollection.name, label: compile(targetCollection.title || targetCollection.name) }]}
        />
      </div>
    );
  },
  { displayName: 'SourceCollection' },
);
