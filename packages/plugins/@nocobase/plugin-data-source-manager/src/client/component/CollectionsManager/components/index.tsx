import React, { useEffect, useState } from 'react';
import { Select } from 'antd';
import { observer, useForm, useField } from '@formily/react';
import { useParams } from 'react-router-dom';
import { useRecord, useCompile, useAPIClient, useCollectionManager_deprecated } from '@nocobase/client';
import { useRemoteCollectionContext } from '../CollectionFields';

const supportTypes = ['string', 'bigInt', 'integer', 'uuid', 'uid'];

export const SourceKey = observer(
  (props: any) => {
    const { name: dataSourceKey } = useParams();
    const { collectionName, sourceKey, name } = useRecord();
    const field: any = useField();
    const compile = useCompile();
    const { getCollection } = useCollectionManager_deprecated();
    const options = getCollection(collectionName || name, dataSourceKey)
      .fields?.filter((v) => {
        return v.primaryKey || v.unique;
      })
      .map((k) => {
        return {
          value: k.name,
          label: compile(k.uiSchema?.title || k.title || k.name),
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
    const { disabled } = props;
    const api = useAPIClient();
    const [options, setOptions] = useState([]);
    const { name: dataSourceKey } = useParams();
    const record = useRecord();
    const field: any = useField();
    const { collectionName, target, type, through, name } = record;
    const value = record[field.props.name];
    const { getCollection } = useCollectionManager_deprecated();
    const compile = useCompile();
    const form = useForm();
    const [initialValue, setInitialValue] = useState(value);
    useEffect(() => {
      field.initialValue = null;
      const effectField = ['belongsTo'].includes(type)
        ? collectionName
        : ['belongsToMany'].includes(type)
          ? through
          : target;
      const fields = getCollection(effectField, dataSourceKey)?.fields;
      if (fields) {
        const sourceOptions = fields
          ?.filter((v) => {
            return supportTypes.includes(v.type);
          })
          .map((k) => {
            return {
              value: k.name,
              label: compile(k.uiSchema?.title || k.title || k.name),
            };
          });
        setOptions(sourceOptions);
        if (value) {
          const option = sourceOptions.find((v) => v.value === value);
          setInitialValue(option?.label || value);
        }
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
            const { target, type, through } = form.values;
            const effectField = ['belongsTo'].includes(type)
              ? collectionName || name
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
                    return supportTypes.includes(v.type);
                  })
                  .map((k) => {
                    return {
                      value: k.name,
                      label: compile(k.uiSchema?.title || k.title || k.name),
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
    const { targetKey, target, type } = useRecord();
    const { name: dataSourceKey } = useParams();
    const { getCollection } = useCollectionManager_deprecated();
    const api = useAPIClient();
    const [options, setOptions] = useState([]);
    const [initialValue, setInitialValue] = useState(value || targetKey);
    const form = useForm();
    const compile = useCompile();
    const field: any = useField();
    field.required = true;
    useEffect(() => {
      if (target) {
        setOptions(
          getCollection(target, dataSourceKey)
            .fields?.filter((v) => {
              if (type !== 'hasMany') {
                return v.primaryKey || v.unique;
              }
              return supportTypes.includes(v.type);
            })
            .map((k) => {
              return {
                value: k.name,
                label: compile(k?.uiSchema?.title || k.title || k.name),
              };
            }),
        );
      }
    }, []);
    return (
      <div>
        <Select
          showSearch
          options={options}
          onDropdownVisibleChange={async (open) => {
            const { target, type } = form.values;
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
                    if (type !== 'hasMany') {
                      return v.primaryKey || v.unique;
                    }
                    return supportTypes.includes(v.type);
                  })
                  .map((k) => {
                    return {
                      value: k.name,
                      label: compile(k.uiSchema?.title || k.title || k.name),
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

export const ThroughCollection = observer(
  (props: any) => {
    const { disabled } = props;
    const compile = useCompile();
    const [options, setOptions] = useState([]);
    const { name: dataSourceKey } = useParams();
    const field: any = useField();
    const { getCollections } = useCollectionManager_deprecated(dataSourceKey);
    const record = useRecord();
    const value = record[field.props.name];

    const loadCollections = () => {
      const filteredItems = getCollections().filter((item) => {
        const isAutoCreateAndThrough = item.autoCreate && item.isThrough;
        if (isAutoCreateAndThrough) {
          return false;
        }
        return true;
      });
      return filteredItems.map((item) => ({
        label: compile(item.title || item.name),
        value: item.name,
      }));
    };
    useEffect(() => {
      const data = loadCollections();
      setOptions(data);
    }, []);
    return (
      <div>
        <Select
          disabled={disabled}
          showSearch
          popupMatchSelectWidth={false}
          fieldNames={{ label: 'label', value: 'value' }}
          defaultValue={value}
          options={options}
          onChange={(value) => {
            props?.onChange?.(value);
          }}
        />
      </div>
    );
  },
  { displayName: 'ThroughCollection' },
);
