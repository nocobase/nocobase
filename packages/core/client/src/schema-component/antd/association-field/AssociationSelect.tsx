import { LoadingOutlined } from '@ant-design/icons';
import { ISchema, connect, mapProps, mapReadPretty, RecursionField, useFieldSchema, useField } from '@formily/react';
import { Button, Input, Select } from 'antd';
import _ from 'lodash';
import { ActionContext } from '../action';
import React, { useCallback, useMemo, useState, useContext } from 'react';
import { useFieldTitle } from '../../hooks';
import { RemoteSelect, RemoteSelectProps } from '../remote-select';
import { defaultFieldNames } from '../select';
import { ReadPretty } from './ReadPretty';
import { useInsertSchema } from './hooks';
import useServiceOptions from './hooks';
import { useCollection } from '../../../collection-manager';
import schema from './schema';
import { AssociationFieldContext } from './context';
import { CollectionProvider } from '../../../collection-manager';

export type AssociationSelectProps<P = any> = RemoteSelectProps<P> & {
  action?: string;
  multiple?: boolean;
};

const InternalAssociationSelect = connect(
  (props: AssociationSelectProps) => {
    const { fieldNames, objectValue = true } = props;
    const field: any = useField();
    const [visibleAddNewer, setVisibleAddNewer] = useState(false);
    const { getField } = useCollection();
    const collectionField = getField(field.props.name);
    const service = useServiceOptions(props);
    const fieldSchema = useFieldSchema();
    const isAllowAddNew = fieldSchema['x-add-new'] !== false;
    const insertAddNewer = useInsertSchema('AddNewer');
    useFieldTitle();
    const normalizeValues = useCallback(
      (obj) => {
        if (!objectValue && typeof obj === 'object') {
          return obj[fieldNames.value];
        }
        return obj;
      },
      [objectValue, fieldNames.value],
    );

    const value = useMemo(() => {
      if (props.value === undefined || props.value === null) {
        return;
      }

      if (Array.isArray(props.value)) {
        return props.value.map(normalizeValues);
      } else {
        return normalizeValues(props.value);
      }
    }, [props.value, normalizeValues]);
    return (
      <>
        <Input.Group compact>
          <RemoteSelect
            style={{ width: '85%' }}
            {...props}
            objectValue={objectValue}
            value={value}
            service={service}
          ></RemoteSelect>
          {isAllowAddNew && (
            <Button
              type={'primary'}
              onClick={() => {
                insertAddNewer(schema.AddNewer);
                setVisibleAddNewer(true);
              }}
            >
              Add new
            </Button>
          )}
        </Input.Group>

        <ActionContext.Provider
          value={{ openMode: 'drawer', visible: visibleAddNewer, setVisible: setVisibleAddNewer }}
        >
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
      </>
    );
  },
  mapProps(
    {
      dataSource: 'options',
      loading: true,
    },
    (props, field) => {
      return {
        ...props,
        fieldNames: { ...defaultFieldNames, ...props.fieldNames, ...field.componentProps.fieldNames },
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
      };
    },
  ),
  mapReadPretty(ReadPretty),
);

interface AssociationSelectInterface {
  (props: any): React.ReactElement;
  Designer: React.FC;
  FilterDesigner: React.FC;
}

export const AssociationSelect = InternalAssociationSelect as unknown as AssociationSelectInterface;
