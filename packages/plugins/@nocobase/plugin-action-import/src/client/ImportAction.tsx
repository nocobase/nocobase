/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { ISchema, useFieldSchema } from '@formily/react';
import { Action, ActionContextProvider, PopupSettingsProvider, SchemaComponent, useCompile } from '@nocobase/client';
import React, { useState } from 'react';
import { NAMESPACE } from './constants';
import { useTranslation } from 'react-i18next';
import { UploadOutlined } from '@ant-design/icons';

const importFormSchema: ISchema = {
  type: 'void',
  name: 'import-modal',
  title: `{{ t("Import Data", {ns: "${NAMESPACE}" }) }}`,
  'x-component': 'Action.Modal',
  'x-decorator': 'Form',
  'x-component-props': {
    width: '100%',
    style: {
      maxWidth: '750px',
    },
    className: css`
      .ant-formily-item-label {
        height: var(--controlHeightLG);
      }
    `,
  },
  properties: {
    formLayout: {
      type: 'void',
      'x-component': 'FormLayout',
      properties: {
        warning: {
          type: 'void',
          'x-component': 'ImportWarning',
        },
        download: {
          type: 'void',
          title: `{{ t("Step 1: Download template", {ns: "${NAMESPACE}" }) }}`,
          'x-component': 'FormItem',
          'x-acl-ignore': true,
          properties: {
            tip: {
              type: 'void',
              'x-component': 'DownloadTips',
            },
            downloadAction: {
              type: 'void',
              title: `{{ t("Download template", {ns: "${NAMESPACE}" }) }}`,
              'x-component': 'Action',
              'x-component-props': {
                className: css`
                  margin-top: 5px;
                `,
                useAction: '{{ useDownloadXlsxTemplateAction }}',
              },
            },
          },
        },
        upload: {
          type: 'array',
          title: `{{ t("Step 2: Upload Excel", {ns: "${NAMESPACE}" }) }}`,
          'x-decorator': 'FormItem',
          'x-acl-ignore': true,
          'x-component': 'Upload.Dragger',
          'x-validator': '{{ uploadValidator }}',
          'x-component-props': {
            action: '',
            height: '150px',
            tipContent: `{{ t("Upload placeholder", {ns: "${NAMESPACE}" }) }}`,
            beforeUpload: '{{ beforeUploadHandler }}',
          },
        },
      },
    },
    footer: {
      'x-component': 'Action.Modal.Footer',
      'x-component-props': {},
      properties: {
        actions: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-component-props': {},
          properties: {
            cancel: {
              type: 'void',
              title: '{{ t("Cancel") }}',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ cm.useCancelAction }}',
              },
            },
            startImport: {
              type: 'void',
              title: `{{ t("Start import", {ns: "${NAMESPACE}" }) }}`,
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                htmlType: 'submit',
                useAction: '{{ useImportStartAction }}',
              },
              'x-reactions': {
                dependencies: ['upload'],
                fulfill: {
                  run: 'validateUpload($form, $self, $deps)',
                },
              },
            },
          },
        },
      },
    },
  },
};

export const ImportAction = (props) => {
  const [visible, setVisible] = useState(false);
  const compile = useCompile();

  const fieldSchema = useFieldSchema();

  return (
    <ActionContextProvider value={{ visible, setVisible, fieldSchema }}>
      <Action
        icon={props.icon || 'uploadoutlined'}
        title={compile(fieldSchema?.title || "t('Import')")}
        {...props}
        onClick={() => setVisible(true)}
      />
      <SchemaComponent schema={importFormSchema} />
    </ActionContextProvider>
  );
};
