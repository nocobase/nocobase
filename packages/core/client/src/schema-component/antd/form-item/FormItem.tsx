import { css, cx } from '@emotion/css';
import { FormItem as Item } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { ACLCollectionFieldProvider } from '../../../acl/ACLProvider';
import { useFormActiveFields } from '../../../block-provider';
import { Collection } from '../../../collection-manager';
import { GeneralSchemaDesigner } from '../../../schema-settings';
import { useVariables } from '../../../variables';
import useContextVariable from '../../../variables/hooks/useContextVariable';
import { BlockItem } from '../block-item';
import { HTMLEncode } from '../input/shared';
import { FilterFormDesigner } from './FormItem.FilterFormDesigner';
import { useEnsureOperatorsValid } from './SchemaSettingOptions';
import useLazyLoadAssociationFieldOfForm from './hooks/useLazyLoadAssociationFieldOfForm';
import useLazyLoadDisplayAssociationFieldsOfForm from './hooks/useLazyLoadDisplayAssociationFieldsOfForm';
import useParseDefaultValue from './hooks/useParseDefaultValue';

export const FormItem: any = observer(
  (props: any) => {
    useEnsureOperatorsValid();
    const field = useField<Field>();
    const schema = useFieldSchema();
    const contextVariable = useContextVariable();
    const variables = useVariables();
    const { addActiveFieldName } = useFormActiveFields() || {};

    useEffect(() => {
      variables?.registerVariable(contextVariable);
    }, [contextVariable]);

    // 需要放在注冊完变量之后
    useParseDefaultValue();
    useLazyLoadDisplayAssociationFieldsOfForm();
    useLazyLoadAssociationFieldOfForm();

    useEffect(() => {
      addActiveFieldName?.(schema.name as string);
    }, [addActiveFieldName, schema.name]);

    const showTitle = schema['x-decorator-props']?.showTitle ?? true;
    const extra = useMemo(() => {
      return typeof field.description === 'string' ? (
        <div
          dangerouslySetInnerHTML={{
            __html: HTMLEncode(field.description).split('\n').join('<br/>'),
          }}
        />
      ) : (
        field.description
      );
    }, [field.description]);
    const className = useMemo(() => {
      return cx(
        css`
          & .ant-space {
            flex-wrap: wrap;
          }
        `,
        {
          [css`
            > .ant-formily-item-label {
              display: none;
            }
          `]: showTitle === false,
        },
      );
    }, [showTitle]);

    return (
      <ACLCollectionFieldProvider>
        <BlockItem className={'nb-form-item'}>
          <Item className={className} {...props} extra={extra} />
        </BlockItem>
      </ACLCollectionFieldProvider>
    );
  },
  { displayName: 'FormItem' },
);

FormItem.Designer = function Designer() {
  return <GeneralSchemaDesigner schemaSettings="FormItemSettings"></GeneralSchemaDesigner>;
};

export function isFileCollection(collection: Collection) {
  return collection?.template === 'file';
}

FormItem.FilterFormDesigner = FilterFormDesigner;
