/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { IFormItemProps, FormItem as Item } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import React, { useEffect, useMemo } from 'react';
import { ACLCollectionFieldProvider } from '../../../acl/ACLProvider';
import { useApp } from '../../../application';
import { useFormActiveFields } from '../../../block-provider/hooks/useFormActiveFields';
import { Collection_deprecated } from '../../../collection-manager';
import { CollectionFieldProvider } from '../../../data-source/collection-field/CollectionFieldProvider';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { useDataFormItemProps } from '../../../modules/blocks/data-blocks/form/hooks/useDataFormItemProps';
import { GeneralSchemaDesigner } from '../../../schema-settings';
import { BlockItem } from '../block-item';
import { HTMLEncode } from '../input/shared';
import { FilterFormDesigner } from './FormItem.FilterFormDesigner';
import { useEnsureOperatorsValid } from './SchemaSettingOptions';
import useLazyLoadDisplayAssociationFieldsOfForm from './hooks/useLazyLoadDisplayAssociationFieldsOfForm';
import { useLinkageRulesForSubTableOrSubForm } from './hooks/useLinkageRulesForSubTableOrSubForm';
import useParseDefaultValue from './hooks/useParseDefaultValue';
import { useTranslation } from 'react-i18next';
import { NAMESPACE_UI_SCHEMA } from '../../../i18n/constant';

Item.displayName = 'FormilyFormItem';

const formItemWrapCss = css`
  & .ant-space {
    flex-wrap: wrap;
  }
  .ant-description-textarea img {
    max-width: 100%;
  }
  &.ant-formily-item-layout-vertical .ant-formily-item-label {
    display: inline;
    .ant-formily-item-label-tooltip-icon {
      display: inline;
    }
    .ant-formily-item-label-content {
      display: inline;
    }
  }
`;

const formItemLabelCss = css`
  .ant-card-body {
    padding: 0px !important;
  }
  > .ant-formily-item-label {
    display: none !important;
  }
`;

export const FormItem: any = withDynamicSchemaProps(
  observer((props: IFormItemProps) => {
    useEnsureOperatorsValid();
    const field = useField<Field>();
    const schema = useFieldSchema();
    const { addActiveFieldName } = useFormActiveFields() || {};
    const { wrapperStyle }: { wrapperStyle: any } = useDataFormItemProps();
    const { t } = useTranslation();
    useParseDefaultValue();
    useLazyLoadDisplayAssociationFieldsOfForm();
    useLinkageRulesForSubTableOrSubForm();

    useEffect(() => {
      addActiveFieldName?.(schema.name as string);
    }, [addActiveFieldName, schema.name]);
    field.title = field.title && t(field.title, { ns: NAMESPACE_UI_SCHEMA });
    const showTitle = schema['x-decorator-props']?.showTitle ?? true;
    const extra = useMemo(() => {
      if (field.description && field.description !== '') {
        return typeof field.description === 'string' ? (
          <div
            dangerouslySetInnerHTML={{
              __html: HTMLEncode(t(field.description, { ns: NAMESPACE_UI_SCHEMA }))
                .split('\n')
                .join('<br/>'),
            }}
          />
        ) : (
          field.description
        );
      }
    }, [field.description]);
    const className = useMemo(() => {
      return cx(formItemWrapCss, {
        [formItemLabelCss]: showTitle === false,
      });
    }, [showTitle]);
    // 联动规则中的“隐藏保留值”的效果
    if (field.data?.hidden) {
      return null;
    }

    return (
      <CollectionFieldProvider allowNull={true}>
        <BlockItem
          className={cx(
            'nb-form-item',
            css`
              .ant-formily-item-layout-horizontal .ant-formily-item-control {
                max-width: ${showTitle === false || schema['x-component'] !== 'CollectionField'
                  ? '100% !important'
                  : null};
              }
            `,
          )}
        >
          <ACLCollectionFieldProvider>
            <Item
              className={className}
              {...props}
              extra={extra}
              wrapperStyle={{
                ...(wrapperStyle.backgroundColor ? { paddingLeft: '5px', paddingRight: '5px' } : {}),
                ...wrapperStyle,
              }}
            />
          </ACLCollectionFieldProvider>
        </BlockItem>
      </CollectionFieldProvider>
    );
  }),
  { displayName: 'FormItem' },
);

FormItem.Designer = function Designer() {
  const app = useApp();
  const fieldSchema = useFieldSchema();
  const settingsName = `FormItemSettings:${fieldSchema['x-interface']}`;
  const defaultActionSettings = 'FormItemSettings';
  const hasFieldItem = app.schemaSettingsManager.has(settingsName);
  return (
    <GeneralSchemaDesigner schemaSettings={hasFieldItem ? settingsName : defaultActionSettings}></GeneralSchemaDesigner>
  );
};

export function isFileCollection(collection: Collection_deprecated) {
  return collection?.template === 'file';
}

FormItem.FilterFormDesigner = FilterFormDesigner;
