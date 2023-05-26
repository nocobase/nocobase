import { LoadingOutlined } from '@ant-design/icons';
import { RecursionField, connect, mapProps, observer, useField, useFieldSchema, useForm } from '@formily/react';
import { Input, Button, message } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RemoteSelect, RemoteSelectProps } from '../remote-select';
import useServiceOptions, { useAssociationFieldContext } from './hooks';
import { useAPIClient } from '../../../';
import { isFunction } from 'mathjs';

export type AssociationSelectProps<P = any> = RemoteSelectProps<P> & {
  action?: string;
  multiple?: boolean;
};

const InternalAssociationSelect = observer((props: AssociationSelectProps) => {
  const { objectValue = true } = props;
  const field: any = useField();
  const fieldSchema = useFieldSchema();
  const service = useServiceOptions(props);
  const { options: collectionField } = useAssociationFieldContext();
  const value = Array.isArray(props.value) ? props.value.filter(Boolean) : props.value;
  const addMode = fieldSchema['x-component-props']?.addMode;
  const isAllowAddNew = fieldSchema['x-add-new'];
  const { t } = useTranslation();
  const { multiple } = props;
  const form = useForm();
  const api = useAPIClient();
  const resource = api.resource(collectionField.target);

  const handleCreateAction = async (props) => {
    const { search: value, callBack } = props;
    const { data } = await resource.create({
      values: {
        [field?.componentProps?.fieldNames?.label || 'id']: value,
      },
    });
    if (data) {
      if (['m2m', 'o2m'].includes(collectionField?.interface) && multiple !== false) {
        const values = JSON.parse(JSON.stringify(form.values[fieldSchema.name] || []));
        values.push({
          ...data?.data,
        });
        setTimeout(() => {
          form.setValuesIn(field.props.name, values);
        }, 100);
      } else {
        const value = {
          ...data?.data,
        };
        setTimeout(() => {
          form.setValuesIn(field.props.name, value);
        }, 100);
      }
      isFunction(callBack) && callBack?.();
      message.success(t('Saved successfully'));
    }
  };

  const QuickAddContent = (props) => {
    return (
      <div>
        <span style={{ color: 'black' }}>
          {t('Not found.')} {t('Add') + ` ${props.search} ` + t('to') + ' Collection' + ` ${collectionField.target}? `}
        </span>
        <Button type="primary" onClick={() => handleCreateAction(props)}>
          {t('Ok')}
        </Button>
      </div>
    );
  };
  return (
    <div key={fieldSchema.name}>
      <Input.Group compact style={{ display: 'flex' }}>
        <RemoteSelect
          style={{ width: '100%' }}
          {...props}
          objectValue={objectValue}
          value={value}
          service={service}
          CustomDropdownRender={addMode === 'quickAdd' && QuickAddContent}
        ></RemoteSelect>

        {(addMode === 'modalAdd' || isAllowAddNew) && (
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
