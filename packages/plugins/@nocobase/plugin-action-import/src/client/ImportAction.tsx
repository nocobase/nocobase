import React, { useEffect, useState } from 'react';
import { Action, SchemaComponent, FormProvider } from '@nocobase/client';
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { NAMESPACE } from './constants';
import { css } from '@emotion/css';
import { useImportStartAction } from './useImportAction';
import { FormLayout } from '@formily/antd-v5';
import { ISchema, useFieldSchema, useForm } from '@formily/react';
import { ImportActionContext } from './ImportActionContext';

const importFormSchema: ISchema = {
  type: 'void',
  name: 'importForm',
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
      required: true,
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
};

export const ImportAction = () => {
  const { t } = useTranslation(NAMESPACE);
  const [visible, setVisible] = useState(false);
  const form = useForm();
  const fieldSchema = useFieldSchema();

  const [disabled, setDisabled] = useState(false);

  const { run } = useImportStartAction({
    setVisible,
    fieldSchema,
    form,
  });

  const showModal = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
    form.reset();
  };

  const handleOk = async () => {
    try {
      await form.validate();
      await run();
      setDisabled(true);
    } catch (errors) {
      console.log('验证失败:', errors);
    } finally {
      setDisabled(false);
    }
  };

  return (
    <ImportActionContext.Provider value={{ fieldSchema, setVisible }}>
      <Action icon="ImportOutlined" title={t('Import')} onClick={showModal} />
      <Modal
        title={t('Import data')}
        open={visible}
        onCancel={handleCancel}
        onOk={handleOk}
        okButtonProps={{ disabled }}
        width={800}
      >
        <FormProvider form={form}>
          <FormLayout layout="vertical">
            <SchemaComponent schema={importFormSchema} />
          </FormLayout>
        </FormProvider>
      </Modal>
    </ImportActionContext.Provider>
  );
};
