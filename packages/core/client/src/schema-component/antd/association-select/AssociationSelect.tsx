import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { useFieldTitle } from '../../hooks';
import { RemoteSelect, RemoteSelectProps } from '../remote-select';
import { ReadPretty } from './ReadPretty';
import useServiceOptions from './useServiceOptions';

export const defaultFieldNames = {
  label: 'id',
  value: 'value',
  color: 'color',
  options: 'children',
};
export type AssociationSelectProps<P = any> = RemoteSelectProps<P> & {
  action?: string;
  multiple?: boolean;
};

const InternalAssociationSelect = connect(
  (props: AssociationSelectProps) => {
    const { fieldNames, objectValue = true } = props;
    const service = useServiceOptions(props);
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

    return <RemoteSelect {...props} objectValue={objectValue} value={value} service={service}></RemoteSelect>;
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

const AssociationSelect = InternalAssociationSelect as unknown as AssociationSelectInterface;

export { AssociationSelect };
