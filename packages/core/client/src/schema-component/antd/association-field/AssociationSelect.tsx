import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { onFieldChange, FormPath } from '@formily/core';
import { RecursionField, connect, mapProps, observer, useField, useFieldSchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Space, message } from 'antd';
import { isFunction } from 'mathjs';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RecordProvider, useAPIClient } from '../../../';
import { isVariable } from '../../../variables/utils/isVariable';
import { getInnermostKeyAndValue } from '../../common/utils/uitls';
import { RemoteSelect, RemoteSelectProps } from '../remote-select';
import useServiceOptions, { useAssociationFieldContext } from './hooks';

export type AssociationSelectProps<P = any> = RemoteSelectProps<P> & {
  action?: string;
  multiple?: boolean;
};

export const filterAnalyses = (filters): any[] => {
  if (!filters) {
    return;
  }
  const type = Object.keys(filters)[0] || '$and';
  const conditions = filters[type];
  const results = [];
  conditions?.map((c) => {
    const jsonlogic = getInnermostKeyAndValue(c);
    const operator = jsonlogic?.key;

    if (!operator) {
      return true;
    }
    const regex = /\{\{\$(?:[a-zA-Z_]\w*)\.([a-zA-Z_]\w*)(?:\.id)?\}\}/;
    const fieldName = jsonlogic?.value?.match?.(regex)?.[1];
    if (fieldName) {
      results.push(fieldName);
    }
  });
  return results;
};

const InternalAssociationSelect = observer((props: AssociationSelectProps) => {
  const { objectValue = true } = props;
  const field: any = useField();
  const fieldSchema = useFieldSchema();
  const service = useServiceOptions(props);
  const { options: collectionField } = useAssociationFieldContext();
  const initValue = isVariable(props.value) ? undefined : props.value;
  const value = Array.isArray(initValue) ? initValue.filter(Boolean) : initValue;
  // 因为通过 Schema 的形式书写的组件，在值变更的时候 `value` 的值没有改变，所以需要维护一个 `innerValue` 来变更值
  const [innerValue, setInnerValue] = useState(value);
  const addMode = fieldSchema['x-component-props']?.addMode;
  const isAllowAddNew = fieldSchema['x-add-new'];
  const { t } = useTranslation();
  const { multiple } = props;
  const form = useForm();
  const api = useAPIClient();
  const resource = api.resource(collectionField.target);
  const linkageFields = filterAnalyses(field.componentProps?.service?.params?.filter);
  useEffect(() => {
    const id = uid();
    form.addEffects(id, () => {
      if (linkageFields?.length > 0) {
        //支持深层次子表单
        onFieldChange('*', (fieldPath: any) => {
          if (linkageFields.includes(fieldPath.props.name) && field.value) {
            props.onChange(null);
            setInnerValue(null);
          }
        });
      }
    });

    return () => {
      form.removeEffects(id);
    };
  }, []);

  const handleCreateAction = async (props) => {
    const { search: value, callBack } = props;
    const {
      data: { data },
    } = await resource.create({
      values: {
        [field?.componentProps?.fieldNames?.label || 'id']: value,
      },
    });
    if (data) {
      if (['m2m', 'o2m'].includes(collectionField?.interface) && multiple !== false) {
        const values = form.getValuesIn(field.path) || [];
        values.push(data);
        form.setValuesIn(field.path, values);
        field.onInput(values);
      } else {
        form.setValuesIn(field.path, data);
        field.onInput(data);
      }
      isFunction(callBack) && callBack?.();
      message.success(t('Saved successfully'));
    }
  };
  const QuickAddContent = (props) => {
    return (
      <div
        onClick={() => handleCreateAction(props)}
        style={{ cursor: 'pointer', padding: '5px 12px', color: '#0d0c0c' }}
      >
        <PlusOutlined />
        <span style={{ paddingLeft: 5 }}>{t('Add') + ` “${props.search}” `}</span>
      </div>
    );
  };

  return (
    <div key={fieldSchema.name}>
      <Space.Compact style={{ display: 'flex', lineHeight: '32px' }}>
        <RemoteSelect
          style={{ width: '100%' }}
          {...props}
          size={'middle'}
          objectValue={objectValue}
          value={value || innerValue}
          service={service}
          onChange={(value) => {
            const val = value?.length !== 0 ? value : null;
            setInnerValue(val);
            props.onChange?.(val);
          }}
          CustomDropdownRender={addMode === 'quickAdd' && QuickAddContent}
        ></RemoteSelect>

        {(addMode === 'modalAdd' || isAllowAddNew) && (
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
      </Space.Compact>
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
