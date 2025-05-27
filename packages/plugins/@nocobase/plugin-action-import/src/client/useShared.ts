/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VoidField } from '@formily/core';
import { Cascader, css, useCollection_deprecated, useCompile } from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { NAMESPACE } from './constants';
import { useFields } from './useFields';

const INCLUDE_FILE_TYPE = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/wps-office.xlsx',
];

export const useShared = () => {
  const { t } = useTranslation(NAMESPACE);
  const { name } = useCollection_deprecated();
  const fields = useFields(name);
  const compile = useCompile();
  return {
    importSettingsSchema: {
      type: 'void',
      'x-component': 'Grid',
      properties: {
        explain: {
          type: 'string',
          title: `{{ t("Import explain", {ns: "${NAMESPACE}"}) }}`,
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
        importColumns: {
          type: 'array',
          'x-component': 'ArrayItems',
          'x-decorator': 'FormItem',
          items: {
            type: 'object',
            properties: {
              space: {
                type: 'void',
                'x-component': 'Space',
                'x-component-props': {
                  className: css`
                    width: 100%;
                    & .ant-space-item:nth-child(2) {
                      flex: 1;
                    }
                  `,
                },
                properties: {
                  sort: {
                    type: 'void',
                    'x-decorator': 'FormItem',
                    'x-component': 'ArrayItems.SortHandle',
                  },
                  dataIndex: {
                    type: 'array',
                    'x-decorator': 'FormItem',
                    'x-component': Cascader,
                    required: true,
                    // enum: fields,
                    'x-use-component-props': () => {
                      return {
                        options: compile(fields),
                      };
                    },
                    'x-component-props': {
                      fieldNames: {
                        label: 'title',
                        value: 'name',
                        children: 'children',
                      },
                      changeOnSelect: false,
                    },
                  },
                  title: {
                    type: 'string',
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                    'x-component-props': {
                      placeholder: '{{ t("Custom column title") }}',
                    },
                  },
                  description: {
                    type: 'string',
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                    'x-component-props': {
                      placeholder: `{{ t("Field description placeholder", {ns: "${NAMESPACE}"}) }}`,
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
          properties: {
            add: {
              type: 'void',
              title: `{{ t("Add importable field", {ns: "${NAMESPACE}"}) }}`,
              'x-component': 'ArrayItems.Addition',
              'x-component-props': {
                className: css`
                  border-color: var(--colorSettings);
                  color: var(--colorSettings);
                  &.ant-btn-dashed:hover {
                    border-color: var(--colorSettings);
                    color: var(--colorSettings);
                  }
                `,
              },
            },
          },
        },
      },
    },
    beforeUploadHandler() {
      return false;
    },
    uploadValidator(value, rule) {
      if (value.length > 1) {
        return {
          type: 'error',
          message: t('Only one file is allowed to be uploaded'),
        };
      }
      const file = value[0] ?? {};
      if (!INCLUDE_FILE_TYPE.includes(file.type)) {
        return {
          type: 'error',
          message: t('Please upload the file of Excel'),
        };
      }
      return '';
    },
    validateUpload(form, submitField: VoidField, deps) {
      const [upload] = deps;
      submitField.disabled = upload?.length === 0;
      submitField.componentProps = {
        ...submitField.componentProps,
        disabled: upload?.length === 0 || form.errors?.length > 0,
      };
    },
  };
};
