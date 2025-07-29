/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, compileUiSchema, useFlowSettingsContext, useFlowModel } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { CollectionActionModel, Action } from '@nocobase/client';
import { ISchema, useFieldSchema, createSchemaField, FormProvider } from '@formily/react';
import React from 'react';
import { createForm, Form } from '@formily/core';
import { FormButtonGroup, FormLayout, FormItem } from '@formily/antd-v5';
import { Button, Upload } from 'antd';
import { tval } from '@nocobase/utils/client';
import { saveAs } from 'file-saver';
import { ImportWarning, DownloadTips } from './ImportActionInitializer';
import { NAMESPACE } from './constants';
import { css } from '@emotion/css';

const handelDownloadXlsxTemplateAction = async () => {
  // const { resource } = useBlockRequestContext();
  // const compile = useCompile();
  // const record = useRecord();
  // const { title } = useCollection_deprecated();
  // const { explain, importColumns } = record;
  // const { data } = await resource.downloadXlsxTemplate(
  //   {
  //     values: {
  //       title: compile(title),
  //       explain,
  //       columns: compile(importColumns),
  //     },
  //   },
  //   {
  //     method: 'post',
  //     responseType: 'blob',
  //   },
  // );
  // const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  // saveAs(blob, `${compile(title)}.xlsx`);
};

const importFormSchema = {
  type: 'object',
  properties: {
    warning: {
      type: 'void',
      'x-component': 'ImportWarning',
    },
    download: {
      type: 'void',
      title: escapeT('Step 1: Download template', { ns: `${NAMESPACE}` }),
      'x-component': 'FormItem',
      properties: {
        tip: {
          type: 'void',
          'x-component': 'DownloadTips',
        },
        downloadAction: {
          type: 'void',
          title: escapeT('Download template', { ns: `${NAMESPACE}` }),
          'x-component': 'Button',
          'x-component-props': {
            className: css`
              margin-top: 5px;
            `,
            onClick: '{{ useDownloadXlsxTemplateAction }}',
          },
        },
      },
    },
    upload: {
      type: 'array',
      title: escapeT('Step 2: Upload Excel', { ns: `${NAMESPACE}` }),
      'x-decorator': 'FormItem',
      'x-acl-ignore': true,
      'x-component': 'Upload.Dragger',
      'x-validator': '{{ uploadValidator }}',
      'x-component-props': {
        action: '',
        height: '150px',
        tipContent: escapeT('Upload placeholder', { ns: `${NAMESPACE}` }),
        beforeUpload: '{{ beforeUploadHandler }}',
      },
    },
  },
};

const SchemaField = createSchemaField({
  components: {
    ImportWarning,
    DownloadTips,
    Upload,
    FormItem,
  },
});

export class ImportActionModel extends CollectionActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('Import'),
    type: 'default',
    icon: 'uploadoutlined',
  };
}

ImportActionModel.define({
  title: escapeT('Import'),
});

ImportActionModel.registerFlow({
  key: 'importSettings',
  title: escapeT('Import settings'),
  on: 'click',
  steps: {
    import: {
      handler: async (ctx, params) => {
        const form = createForm();
        await ctx.engine.context.viewOpener.open({
          mode: 'dialog',
          placement: 'center',
          width: 800,
          title: ctx.t('Import Data', { ns: `${NAMESPACE}` }),
          content: (popover) => {
            return (
              <FormProvider form={form}>
                <FormLayout layout={'vertical'}>
                  <SchemaField schema={importFormSchema} scope={{ t: ctx.t }} />
                </FormLayout>
                <FormButtonGroup align="right">
                  <Button
                    onClick={() => {
                      popover.close();
                    }}
                  >
                    {ctx.t('Cancel')}
                  </Button>
                  <Button type="primary" htmlType="submit">
                    {ctx.t('Submit')}
                  </Button>
                </FormButtonGroup>
              </FormProvider>
            );
          },
        });
      },
    },
  },
});
