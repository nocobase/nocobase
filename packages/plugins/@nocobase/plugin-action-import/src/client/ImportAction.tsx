import { css } from '@emotion/css';
import { ISchema } from '@formily/react';
import { Action, ActionContextProvider, SchemaComponent } from '@nocobase/client';
import React, { useEffect, useState } from 'react';
import { NAMESPACE } from './constants';
import { useForm } from '@formily/react';

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
            downloadTemplate: {
              type: 'void',
              title: `{{ t("Download template", {ns: "${NAMESPACE}" }) }}`,
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ useDownloadXlsxTemplateAction }}',
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

const usePreviewAction = () => {
  const form = useForm();
  return {
    async run() {
      const values = form.values;
      console.log('Preview values:', values);
      // 这里添加预览逻辑
    },
  };
};

export const ImportAction = () => {
  const [visible, setVisible] = useState(false);

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <Action icon="ImportOutlined" title="Import" onClick={() => setVisible(true)} />
      <SchemaComponent schema={importFormSchema} />
    </ActionContextProvider>
  );
};
