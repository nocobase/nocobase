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
import { useGlobalVariable } from '../../../application/hooks/useGlobalVariable';
export const getVariableComponentWithScope = (Com, data = []) => {
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
    return <Com {...props} scope={data.concat(scope).filter(Boolean)} />;
  };
};

const useEvnVariable = () => {
  const environmentVariables = useGlobalVariable('$env');
  if (environmentVariables) {
    const { children } = environmentVariables;
    return {
      ...environmentVariables,
      children: children.filter((v) => v.type === 'default'),
    };
  }
  return null;
};

export const useURLAndHTMLSchema = () => {
  const { t } = useTranslation();
  const environmentVariables = useEvnVariable();
  const Com = useMemo(() => getVariableComponentWithScope(Variable.TextArea, [environmentVariables] || []), []);

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
  }, [t, Com]);

  const modeSchema = useMemo(() => {
    return {
      title: '{{t("Mode")}}',
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      default: 'url',
      enum: [
        { value: 'url', label: t('URL') },
        { value: 'html', label: t('HTML') },
      ],
    };
  }, [t]);

  const htmlSchema = useMemo(() => {
    return {
      title: t('html'),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': getVariableComponentWithScope(Variable.RawTextArea),
      'x-component-props': {
        rows: 10,
      },
      'x-reactions': {
        dependencies: ['mode'],
        fulfill: {
          state: {
            hidden: '{{$deps[0] === "url"}}',
          },
        },
      },
    };
  }, [t]);

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
  }, [Com]);

  const openInNewWindowSchema = useMemo(() => {
    return {
      type: 'boolean',
      'x-content': t('Open in new window'),
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-reactions': {
        dependencies: ['mode'],
        fulfill: {
          state: {
            hidden: '{{$deps[0] === "html"}}',
          },
        },
      },
    };
  }, [t]);

  return { urlSchema, paramsSchema, openInNewWindowSchema, modeSchema, htmlSchema };
};
