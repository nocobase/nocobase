import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty, useField, useFieldSchema } from '@formily/react';
import { SelectProps, Tag, Empty, Divider } from 'antd';
import { uniqBy } from 'lodash';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ResourceActionOptions, useRequest } from '../../../api-client';
import { mergeFilter } from '../../../block-provider/SharedFilterProvider';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { Select, defaultFieldNames } from '../select';
import { ReadPretty } from './ReadPretty';

const EMPTY = 'N/A';

export type RemoteSelectProps<P = any> = SelectProps<P, any> & {
  objectValue?: boolean;
  onChange?: (v: any) => void;
  target: string;
  wait?: number;
  manual?: boolean;
  mapOptions?: (data: any) => RemoteSelectProps['fieldNames'];
  targetField?: any;
  service: ResourceActionOptions<P>;
  CustomDropdownRender?: (v: any) => any;
};

const InternalRemoteSelect = connect(
  (props: RemoteSelectProps) => {
    const {
      fieldNames = {},
      service = {},
      wait = 300,
      value,
      objectValue,
      manual = true,
      mapOptions,
      targetField: _targetField,
      CustomDropdownRender,
      ...others
    } = props;
    const [open, setOpen] = useState(false);
    const firstRun = useRef(false);
    const fieldSchema = useFieldSchema();
    const isQuickAdd = fieldSchema['x-component-props']?.addMode === 'quickAdd';
    const field = useField();
    const { getField } = useCollection();
    const searchData = useRef(null);
    const { getCollectionJoinField, getInterface } = useCollectionManager();
    const collectionField = getField(fieldSchema.name);
    const targetField =
      _targetField ||
      (collectionField?.target &&
        fieldNames?.label &&
        getCollectionJoinField(`${collectionField.target}.${fieldNames.label}`));

    const operator = useMemo(() => {
      if (targetField?.interface) {
        return getInterface(targetField.interface)?.filterable?.operators[0].value || '$includes';
      }
      return '$includes';
    }, [targetField]);

    const mapOptionsToTags = useCallback(
      (options) => {
        try {
          return options
            .map((option) => {
              let label = option[fieldNames.label];

              if (targetField?.uiSchema?.enum) {
                if (Array.isArray(label)) {
                  label = label
                    .map((item, index) => {
                      const option = targetField.uiSchema.enum.find((i) => i.value === item);
                      if (option) {
                        return (
                          <Tag key={index} color={option.color} style={{ marginRight: 3 }}>
                            {option?.label || item}
                          </Tag>
                        );
                      } else {
                        return <Tag key={item}>{item}</Tag>;
                      }
                    })
                    .reverse();
                } else {
                  const item = targetField.uiSchema.enum.find((i) => i.value === label);
                  if (item) {
                    label = <Tag color={item.color}>{item.label}</Tag>;
                  }
                }
              }

              if (targetField?.type === 'date') {
                label = moment(label).format('YYYY-MM-DD');
              }

              if (mapOptions) {
                return mapOptions({
                  [fieldNames.label]: label || EMPTY,
                  [fieldNames.value]: option[fieldNames.value],
                });
              }
              return {
                ...option,
                [fieldNames.label]: label || EMPTY,
                [fieldNames.value]: option[fieldNames.value],
              };
            })
            .filter(Boolean);
        } catch (err) {
          console.error(err);
          return options;
        }
      },
      [targetField?.uiSchema, fieldNames],
    );

    const { data, run, loading } = useRequest(
      {
        action: 'list',
        ...service,
        params: {
          pageSize: 200,
          ...service?.params,
          // fields: [fieldNames.label, fieldNames.value, ...(service?.params?.fields || [])],
          // search needs
          filter: mergeFilter([field.componentProps?.service?.params?.filter || service?.params?.filter]),
        },
      },
      {
        manual,
        debounceWait: wait,
      },
    );
    const runDep = useMemo(
      () =>
        JSON.stringify({
          service,
          fieldNames,
        }),
      [service, fieldNames],
    );
    const CustomRenderCom = useCallback(() => {
      if (searchData.current && CustomDropdownRender) {
        return (
          <CustomDropdownRender
            search={searchData.current}
            callBack={() => {
              searchData.current = null;
              setOpen(false);
            }}
          />
        );
      }
      return null;
    }, [searchData.current]);

    useEffect(() => {
      // Lazy load
      if (firstRun.current) {
        run();
      }
    }, [runDep]);

    const onSearch = async (search) => {
      run({
        filter: mergeFilter([
          search
            ? {
                [fieldNames.label]: {
                  [operator]: search,
                },
              }
            : {},
          field.componentProps?.service?.params?.filter || service?.params?.filter,
        ]),
      });
      searchData.current = search;
    };

    const options = useMemo(() => {
      if (!data?.data?.length) {
        return value != null ? (Array.isArray(value) ? value : [value]) : [];
      }
      const valueOptions = (value != null && (Array.isArray(value) ? value : [value])) || [];
      return uniqBy(data?.data?.concat(valueOptions) || [], fieldNames.value);
    }, [data?.data, value]);
    const onDropdownVisibleChange = (visible) => {
      setOpen(visible);
      searchData.current = null;
      if (firstRun.current && data?.data.length > 0) {
        return;
      }
      run();
      firstRun.current = true;
    };
    return (
      <Select
        open={open}
        dropdownMatchSelectWidth={false}
        autoClearSearchValue
        filterOption={false}
        filterSort={null}
        fieldNames={fieldNames as any}
        onSearch={onSearch}
        onDropdownVisibleChange={onDropdownVisibleChange}
        objectValue={objectValue}
        value={value}
        {...others}
        loading={data! ? loading : true}
        options={mapOptionsToTags(options)}
        rawOptions={options}
        dropdownRender={(menu) => {
          const isFullMatch = options.some((v) => v[fieldNames.label] === searchData.current);
          return (
            <>
              {isQuickAdd ? (
                <>
                  {!(data?.data.length === 0 && searchData?.current) && menu}
                  {data?.data.length > 0 && searchData?.current && !isFullMatch && <Divider style={{ margin: 0 }} />}
                  {!isFullMatch && <CustomRenderCom />}
                </>
              ) : (
                menu
              )}
            </>
          );
        }}
      />
    );
  },
  mapProps(
    {
      dataSource: 'options',
    },
    (props, field) => {
      const fieldSchema = useFieldSchema();
      return {
        ...props,
        fieldNames: { ...defaultFieldNames, ...props.fieldNames, ...field.componentProps.fieldNames,...fieldSchema['x-component-props']?.fieldNames },
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
      };
    },
  ),
  mapReadPretty(ReadPretty),
);

export const RemoteSelect = InternalRemoteSelect as unknown as typeof InternalRemoteSelect & {
  ReadPretty: typeof ReadPretty;
};

RemoteSelect.ReadPretty = ReadPretty;
export default RemoteSelect;
