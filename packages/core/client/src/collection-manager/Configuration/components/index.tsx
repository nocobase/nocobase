import { Field } from '@formily/core';
import { observer, useField, useForm } from '@formily/react';
import { Select, AutoComplete } from 'antd';
import React, { useState, useEffect } from 'react';
import { useRecord } from '../../../record-provider';
import { useCompile } from '../../../schema-component';
import { useCollectionManager_deprecated } from '../../hooks';

const supportTypes = ['string', 'bigInt', 'integer', 'uuid', 'uid'];
export const SourceForeignKey = observer(
  () => {
    const record = useRecord();
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
    const record = useRecord();
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
    const { sourceKey, collectionName, name } = useRecord();
    const { getCollection } = useCollectionManager_deprecated();
    const field: any = useField();
    const compile = useCompile();
    const options = getCollection(collectionName || name)
      .fields?.filter((v) => {
        return v.primaryKey || v.unique;
      })
      .map((k) => {
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
    const { targetKey, target, type } = useRecord();
    const { getCollection } = useCollectionManager_deprecated();
    const [options, setOptions] = useState([]);
    const [initialValue, setInitialValue] = useState(value || targetKey);
    const form = useForm();
    const compile = useCompile();
    const field: any = useField();
    field.required = true;
    useEffect(() => {
      if (target) {
        setOptions(
          getCollection(target)
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
              setOptions(
                getCollection(target)
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
  (props: any) => {
    const { disabled } = props;
    const [options, setOptions] = useState([]);
    const { getCollection } = useCollectionManager_deprecated();
    const record = useRecord();
    const field: any = useField();
    const { collectionName, target, type, through, name, template } = record;
    const value = record[field.props.name];
    const compile = useCompile();
    const form = useForm();
    const [initialValue, setInitialValue] = useState(value || (template === 'view' ? null : field.initialValue));
    useEffect(() => {
      const effectField = ['belongsTo'].includes(type)
        ? collectionName
        : ['belongsToMany'].includes(type)
          ? through
          : target;
      const fields = getCollection(effectField)?.fields;
      if (fields) {
        const sourceOptions = fields
          ?.filter((v) => {
            return supportTypes.includes(v.type);
          })
          .map((k) => {
            return {
              value: k.name,
              label: compile(k.uiSchema?.title || k.name),
            };
          });
        setOptions(sourceOptions);
        if (value) {
          const option = sourceOptions.find((v) => v.value === value);
          setInitialValue(option?.label || value);
        }
      }
    }, [type]);
    const Compoent = template === 'view' ? Select : AutoComplete;
    return (
      <div>
        <Compoent
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
              const fields = getCollection(effectField)?.fields || [];
              setOptions(
                fields
                  ?.filter((v) => {
                    return supportTypes.includes(v.type);
                  })
                  .map((k) => {
                    return {
                      value: k.name,
                      label: compile(k.uiSchema?.title || k.name),
                    };
                  }),
              );
            }
          }}
          onChange={(value, option) => {
            props?.onChange?.(value);
            setInitialValue(option.label || value);
          }}
        />
      </div>
    );
  },
  { displayName: 'ForeignKey' },
);

export const ThroughCollection = observer(
  (props: any) => {
    const { disabled } = props;
    const compile = useCompile();
    const { getCollections } = useCollectionManager_deprecated();
    const [options, setOptions] = useState([]);
    const field: any = useField();
    const record = useRecord();
    const value = record[field.props.name];
    const [initialValue, setInitialValue] = useState(value || field.initialValue);

    const loadCollections = () => {
      const filteredItems = getCollections().filter((item) => {
        const isAutoCreateAndThrough = item.autoCreate && item.isThrough;
        if (isAutoCreateAndThrough) {
          return false;
        }
        return true;
      });
      return filteredItems.map((item) => ({
        label: compile(item.title),
        value: item.name,
      }));
    };
    useEffect(() => {
      const data = loadCollections();
      setOptions(data);
      if (value) {
        const option = data.find((v) => v.value === value);
        setInitialValue(option?.label || value);
      }
    }, []);
    const handleSearch = (value: string) => {
      if (value) {
        const filteredOptions = options.filter((option) => {
          return option.label.toLowerCase().includes(value.toLowerCase());
        });
        setOptions(filteredOptions);
      } else {
        const data = loadCollections();
        setOptions(data);
      }
    };
    return (
      <div>
        <AutoComplete
          disabled={disabled}
          showSearch
          popupMatchSelectWidth={false}
          value={initialValue}
          options={options}
          onSearch={handleSearch}
          onChange={(value, option) => {
            props?.onChange?.(value);
            setInitialValue(option.label || value);
          }}
        />
      </div>
    );
  },
  { displayName: 'ThroughCollection' },
);
