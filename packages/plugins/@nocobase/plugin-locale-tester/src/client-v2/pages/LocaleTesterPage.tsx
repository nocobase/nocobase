/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsonTextArea } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Alert, App, Button, Card, Flex, Form, theme } from 'antd';
import React from 'react';
import { useT } from '../locale';
import { reloadWindow } from '../utils';

type LocaleTesterRecord = {
  id?: number | string;
  locale?: unknown;
};

type ResourceResponse<T> = {
  data?: T;
};

type LocaleTesterFormValues = {
  locale?: unknown;
};

const descriptionKey =
  'Please go to <a target="_blank" href="https://github.com/nocobase/locales">nocobase/locales</a> to get the language file that needs translation, then paste it below and provide the translation.';

const LocaleTesterPage = () => {
  const ctx = useFlowContext();
  const t = useT();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const [form] = Form.useForm<LocaleTesterFormValues>();

  const localeRequest = useRequest<LocaleTesterRecord | undefined, []>(
    async () => {
      const response = await ctx.api.request<ResourceResponse<LocaleTesterRecord>>({
        url: 'localeTester:get',
      });

      return response.data?.data;
    },
    {
      onSuccess(record) {
        form.setFieldsValue({
          locale: record?.locale,
        });
      },
    },
  );

  const saveRequest = useRequest(
    async (values: LocaleTesterFormValues) => {
      await ctx.api.request({
        url: 'localeTester:updateOrCreate',
        method: 'post',
        params: {
          filterKeys: ['id'],
        },
        data: {
          id: localeRequest.data?.id,
          locale: values.locale,
        },
      });
    },
    {
      manual: true,
      onSuccess() {
        message.success(t('Saved successfully!'));
        reloadWindow();
      },
    },
  );

  const handleSubmit = (values: LocaleTesterFormValues) => {
    saveRequest.run(values);
  };

  return (
    <Card loading={localeRequest.loading}>
      <Flex vertical gap={token.marginSM}>
        <Alert
          description={
            <span
              dangerouslySetInnerHTML={{
                __html: t(descriptionKey),
              }}
            />
          }
        />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="locale" label={t('Translations')}>
            <JsonTextArea autoSize={{ minRows: 20, maxRows: 30 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saveRequest.loading}>
              {t('Submit')}
            </Button>
          </Form.Item>
        </Form>
      </Flex>
    </Card>
  );
};

export default LocaleTesterPage;
