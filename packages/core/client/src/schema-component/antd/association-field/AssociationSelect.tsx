import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, RecursionField, useFieldSchema, useField } from '@formily/react';
import { Button, Input } from 'antd';
import _ from 'lodash';
import { ActionContext } from '../action';
import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { useFieldTitle } from '../../hooks';
import { RemoteSelect, RemoteSelectProps } from '../remote-select';
import { useInsertSchema } from './hooks';
import useServiceOptions from './hooks';
import { useCollection } from '../../../collection-manager';
import schema from './schema';
import { CollectionProvider } from '../../../collection-manager';

export type AssociationSelectProps<P = any> = RemoteSelectProps<P> & {
  action?: string;
  multiple?: boolean;
};

const InternalAssociationSelect = memo((props: AssociationSelectProps) => {
  const { fieldNames, objectValue = true } = props;
  const field: any = useField();
  const [visibleAddNewer, setVisibleAddNewer] = useState(false);
  const { getField } = useCollection();
  const collectionField = getField(field.props.name);
  const service = useServiceOptions(props);
  const fieldSchema = useFieldSchema();
  const isFilterForm = fieldSchema['x-designer'] === 'FormItem.FilterFormDesigner';
  const isAllowAddNew = fieldSchema['x-add-new'];
  const insertAddNewer = useInsertSchema('AddNewer');
  useFieldTitle();
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
        {isAllowAddNew && !field.readPretty && !isFilterForm && (
          <Button
            type={'default'}
            onClick={() => {
              insertAddNewer(schema.AddNewer);
              setVisibleAddNewer(true);
            }}
          >
            Add new
          </Button>
        )}
      </Input.Group>

      <ActionContext.Provider value={{ openMode: 'drawer', visible: visibleAddNewer, setVisible: setVisibleAddNewer }}>
        <CollectionProvider name={collectionField.target}>
          <RecursionField
            onlyRenderProperties
            basePath={field.address}
            schema={fieldSchema}
            filterProperties={(s) => {
              return s['x-component'] === 'AssociationField.AddNewer';
            }}
          />
        </CollectionProvider>
      </ActionContext.Provider>
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
