/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { tStr, useT } from './../locale';
import { PrintTemplateActionName, PrintTemplateActionNameLowercase } from '../constants';
import { printTemplateActionSettings } from '../settings';
import {
  useCollection,
  useCollectionManager,
  useCollectionRecord,
  useDataBlockResource,
  useDataSource,
  useDataSourceKey,
  useDataBlock,
  useFormActiveFields,
} from '@nocobase/client';

import { useAPIClient, useActionContext } from '@nocobase/client';
import { useForm } from '@formily/react';
import { App as AntdApp } from 'antd';
import { saveAs } from 'file-saver';
import { generateDefaultFilename, getFileExtensionFromMimeType, getFilenameFromContentDisposition } from '../util';
export function usePrintTemplateActionProps() {
  const t = useT();

  return {
    title: t('print template action'),
    type: 'primary',
  };
}
export function useCancelPrintTemplateFile() {
  const { setVisible } = useActionContext();
  return {
    async onClick() {
      setVisible(false);
    },
  };
}
export function useDownloadPrintTemplateFile() {
  const form = useForm();
  const api = useAPIClient();
  const { setVisible } = useActionContext();
  const collection = useCollection();
  const collectionManager = useCollectionManager();
  const collections = collectionManager.getCollections();
  const record = useCollectionRecord();
  const resource = useDataBlockResource();
  const dataSource = useDataSource();
  const dataSourceKey = useDataSourceKey();
  const dataBlock = useDataBlock();
  const { message } = AntdApp.useApp();

  const [processing, setProcessing] = useState(false);
  return {
    // disabled() {
    //   return processing
    // },
    async onClick() {
      await form.submit();
      const values = form.values;
      const props = dataBlock.props;
      const params = props.params;
      console.log(values);
      const body = {
        dataSource: collection.dataSource,
        tableName: collection.name,
        rowFilterByTk: params.filterByTk,
        printTemplateId: values.name,
        primaryKey: collection.getPrimaryKey(),
      };

      setProcessing(true);
      const res = await api.request({
        url: 'printTemplate:formatTemplate',
        data: body,
        method: 'POST',
        responseType: 'blob',
      });
      if (res && res.data) {
        const data = res.data;
        const resHeaders = res.headers;
        const fileType = data.type;

        const fileExtension = getFileExtensionFromMimeType(fileType);
        const filenameFromHeader = getFilenameFromContentDisposition(resHeaders);
        const filename = filenameFromHeader || generateDefaultFilename(fileExtension);
        const blob = new Blob([data], {
          type: fileType,
        });
        saveAs(blob, filename);
        message.success('Submit success');
        form.reset(); // 提交成功后重置表单
        setVisible(false);
      } else {
        setProcessing(false);
      }
    },
  };
}
export const usePrintTemplateListSelect = () => {
  return [{}];
};
export const createPrintTemplateActionSchema = (blockComponent: string) => {
  return {
    type: 'void',
    'x-component': 'Action',
    'x-use-component-props': 'usePrintTemplateActionProps',
    'x-settings': printTemplateActionSettings.name,
    'x-component-props': {
      openSize: 'small',
      openMode: 'modal',
    },
    properties: {
      listTemplate: {
        type: 'void',
        'x-component': 'Action.Modal',
        title: tStr('print template modal title'),
        'x-decorator': 'FormV2',

        properties: {
          name: {
            type: 'string',
            title: tStr('select template'),
            required: true,
            'x-component': 'RemoteSelect',
            'x-decorator': 'FormItem',
            'x-component-props': {
              fieldNames: {
                label: 'templateName',
                value: 'id',
              },
              service: {
                resource: 'printTemplate',
                action: 'allList',
              },
            },
          },
          footer: {
            type: 'void',
            'x-component': 'Action.Modal.Footer',
            properties: {
              close: {
                title: 'Close',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'default',
                },
                'x-use-component-props': 'useCancelPrintTemplateFile',
              },
              submit: {
                title: 'Submit',
                type: 'primary',
                'x-component': 'Action',
                'x-use-component-props': 'useDownloadPrintTemplateFile',
              },
            },
          },
        },
      },
    },
  };
};
