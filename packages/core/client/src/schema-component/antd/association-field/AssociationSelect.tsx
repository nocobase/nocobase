import { LoadingOutlined } from '@ant-design/icons';
import { RecursionField, connect, mapProps, observer, useField, useFieldSchema } from '@formily/react';
import { Input } from 'antd';
import React from 'react';
import { RemoteSelect, RemoteSelectProps } from '../remote-select';
import useServiceOptions from './hooks';
import { RecordProvider } from '../../../';

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
  const value = Array.isArray(props.value) ? props.value.filter(Boolean) : props.value;

  return (
    <div key={fieldSchema.name}>
      <Input.Group compact style={{ display: 'flex', lineHeight: '32px' }}>
        <RemoteSelect
          style={{ width: '100%' }}
          {...props}
          objectValue={objectValue}
          value={value}
          service={service}
        ></RemoteSelect>

        {isAllowAddNew && (
          <RecordProvider record={null}>
            <RecursionField
              onlyRenderProperties
              basePath={field.address}
              schema={fieldSchema}
              filterProperties={(s) => {
                return s['x-component'] === 'Action';
              }}
            />
          </RecordProvider>
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
    const service = useServiceOptions(props);
    if (props.fieldNames) {
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
