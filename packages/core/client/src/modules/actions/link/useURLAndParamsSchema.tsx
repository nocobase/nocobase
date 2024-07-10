/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { useFieldSchema } from '@formily/react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext } from '../../../block-provider/FormBlockProvider';
import { useRecord } from '../../../record-provider';
import { Variable } from '../../../schema-component/antd/variable/Variable';
import { useVariableOptions } from '../../../schema-settings/VariableInput/hooks/useVariableOptions';

const getVariableComponentWithScope = (Com) => {
  return (props) => {
    const fieldSchema = useFieldSchema();
    const { form } = useFormBlockContext();
    const record = useRecord();
    const scope = useVariableOptions({
      collectionField: { uiSchema: fieldSchema },
      form,
      record,
      uiSchema: fieldSchema,
      noDisabled: true,
    });
    return <Com {...props} scope={scope} />;
  };
};

export const useURLAndParamsSchema = () => {
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const Com = useMemo(() => getVariableComponentWithScope(Variable.TextArea), []);

  const urlSchema = useMemo(() => {
    return {
      title: t('URL'),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': Com,
      description: t('Do not concatenate search params in the URL'),
      'x-reactions': {
        dependencies: ['mode'],
        fulfill: {
          state: {
            hidden: '{{$deps[0] === "html"}}',
          },
        },
      },
    };
  }, [t, fieldSchema]);

  const paramsSchema = useMemo(() => {
    return {
      type: 'array',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      title: `{{t("Search parameters")}}`,
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            'x-component-props': {
              style: {
                flexWrap: 'nowrap',
                maxWidth: '100%',
              },
              className: css`
                & > .ant-space-item:first-child,
                & > .ant-space-item:last-child {
                  flex-shrink: 0;
                }
              `,
            },
            properties: {
              name: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: `{{t("Name")}}`,
                },
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': Com,
                'x-component-props': {
                  placeholder: `{{t("Value")}}`,
                  useTypedConstant: true,
                  changeOnSelect: true,
                },
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
        },
      },
      'x-reactions': {
        dependencies: ['mode'],
        fulfill: {
          state: {
            hidden: '{{$deps[0] === "html"}}',
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: `{{t("Add parameter")}}`,
          'x-component': 'ArrayItems.Addition',
        },
      },
    };
  }, [fieldSchema]);

  return { urlSchema, paramsSchema };
};
