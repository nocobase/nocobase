import { LoadingOutlined } from '@ant-design/icons';
import { RecursionField, connect, mapProps, observer, useField, useFieldSchema } from '@formily/react';
import { Input } from 'antd';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useFieldTitle } from '../../hooks';
import { RemoteSelect, RemoteSelectProps } from '../remote-select';
import useServiceOptions from './hooks';

export type AssociationSelectProps<P = any> = RemoteSelectProps<P> & {
  action?: string;
  multiple?: boolean;
};

const InternalAssociationSelect = observer((props: AssociationSelectProps) => {
  const { fieldNames, objectValue = true } = props;
  const field: any = useField();
  const fieldSchema = useFieldSchema();
  const service = useServiceOptions(props);
  const isAllowAddNew = fieldSchema['x-add-new'];
  const normalizeValues = useCallback(
    (obj) => {
      if (!objectValue && typeof obj === 'object') {
        return obj[fieldNames?.value];
      }
      return obj;
    },
    [objectValue, fieldNames?.value],
  );
  const value = useMemo(() => {
    if (props.value === undefined || props.value === null || !Object.keys(props.value).length) {
      return;
    }
    if (Array.isArray(props.value)) {
      return props.value;
    } else {
      return props.value;
    }
  }, [props.value, normalizeValues]);
  useEffect(() => {
    field.value = value;
  }, []);
  return (
    <div key={fieldSchema.name}>
      <Input.Group compact style={{ display: 'flex' }}>
        <RemoteSelect
          style={{ width: '100%' }}
          {...props}
          objectValue={objectValue}
          value={value}
          service={service}
        ></RemoteSelect>

        {isAllowAddNew && (
          <RecursionField
            onlyRenderProperties
            basePath={field.address}
            schema={fieldSchema}
            filterProperties={(s) => {
              return s['x-component'] === 'Action';
            }}
          />
        )}
      </Input.Group>
    </div>
  );
});

interface AssociationSelectInterface {
  (props: any): React.ReactElement;
  Designer: React.FC;
  FilterDesigner: React.FC;
}

export const AssociationSelect = InternalAssociationSelect as unknown as AssociationSelectInterface;

export const AssociationSelectReadPretty = connect(
  (props: any) => {
    if (props.fieldNames) {
      const service = useServiceOptions(props);
      useFieldTitle();
      return <RemoteSelect.ReadPretty {...props} service={service}></RemoteSelect.ReadPretty>;
    }
    return null;
  },
  mapProps(
    {
      dataSource: 'options',
      loading: true,
    },
    (props, field) => {
      return {
        ...props,
        fieldNames: props.fieldNames && { ...props.fieldNames, ...field.componentProps.fieldNames },
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
      };
    },
  ),
);
