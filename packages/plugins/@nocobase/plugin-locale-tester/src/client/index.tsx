/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { ActionProps, ISchema, Plugin, SchemaComponent, useAPIClient, useApp, useRequest } from '@nocobase/client';
import { Alert, App as AntdApp, Card, Spin } from 'antd';
import React from 'react';
import { useT } from './locale';

function LocaleTester() {
  const { data, loading } = useRequest<any>({
    url: 'localeTester:get',
  });
  const t = useT();

  const schema: ISchema = {
    type: 'void',
    name: 'root',
    properties: {
      test: {
        type: 'void',
        'x-component': 'FormV2',
        properties: {
          locale: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input.JSON',
            'x-component-props': {
              autoSize: { minRows: 20, maxRows: 30 },
            },
            default: data?.data?.locale,
            title: t('Translations'),
          },
          button: {
            type: 'void',
            'x-component': 'Action',
            title: t('Submit'),
            'x-use-component-props': 'useSubmitActionProps',
          },
        },
      },
    },
  };

  const useSubmitActionProps = () => {
    const form = useForm();
    const api = useAPIClient();
    const { message } = AntdApp.useApp();
    const app = useApp();

    return {
      type: 'primary',
      htmlType: 'submit',
      async onClick() {
        await form.submit();
        const values = form.values;
        await api.request({
          url: 'localeTester:updateOrCreate',
          method: 'post',
          params: {
            filterKeys: ['id'],
          },
          data: {
            id: data?.data?.id,
            locale: values.locale,
          },
        });
        message.success(app.i18n.t('Saved successfully!'));
        window.location.reload();
      },
    };
  };

  if (loading) {
    return <Spin />;
  }
  return (
    <Card>
      <Alert
        style={{ marginBottom: 12 }}
        description={
          <div
            dangerouslySetInnerHTML={{
              __html: t(
                `Please go to <a target="_blank" href="https://github.com/nocobase/locales">nocobase/locales</a> to get the language file that needs translation, then paste it below and provide the translation.`,
              ),
            }}
          ></div>
        }
      />
      <SchemaComponent schema={schema} scope={{ useSubmitActionProps }} />
    </Card>
  );
}

export class PluginLocaleTesterClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.pluginSettingsManager.add('locale-tester', {
      title: this.t('Locale tester'),
      icon: 'TranslationOutlined',
      Component: LocaleTester,
    });
    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default PluginLocaleTesterClient;
