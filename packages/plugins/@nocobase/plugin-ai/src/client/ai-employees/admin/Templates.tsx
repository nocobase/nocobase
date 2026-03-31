/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionContextProvider,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useRequest,
  useToken,
} from '@nocobase/client';
import React, { createContext, useContext, useMemo } from 'react';
import { avatars } from '../avatars';
import { AIEmployee } from '../types';
import { uid } from '@formily/shared';
import { createForm } from '@formily/core';
import { useCancelActionProps, useCreateActionProps } from './hooks';
import { Card, Col, Empty, Row, Spin, Typography, Avatar, Tag } from 'antd';
const { Meta } = Card;

const TemplateContext = createContext<{
  aiEmployee: AIEmployee;
}>(null);

const useTemplateFormProps = () => {
  const { aiEmployee } = useContext(TemplateContext);
  const form = useMemo(
    () =>
      createForm({
        initialValues: aiEmployee,
      }),
    [aiEmployee],
  );
  return {
    form,
  };
};

const Template: React.FC<{
  aiEmployee: AIEmployee;
}> = ({ aiEmployee }) => {
  const { token } = useToken();
  const { setVisible } = useActionContext();

  return (
    <Card variant="borderless" hoverable onClick={() => setVisible(true)}>
      <Meta
        avatar={aiEmployee.avatar ? <Avatar size={40} src={avatars(aiEmployee.avatar)} /> : null}
        title={aiEmployee.nickname}
        description={
          <>
            {aiEmployee.position && (
              <Tag
                style={{
                  marginBottom: token.marginXS,
                }}
              >
                {aiEmployee.position}
              </Tag>
            )}
            <Typography.Paragraph
              style={{ height: token.fontSize * token.lineHeight * 3 }}
              ellipsis={{ rows: 3 }}
              type="secondary"
            >
              {aiEmployee.bio}
            </Typography.Paragraph>
          </>
        }
      />
    </Card>
  );
};

export const Templates: React.FC = () => {
  const [visible, setVisible] = React.useState(false);
  const api = useAPIClient();
  const { data: templates, loading } = useRequest<AIEmployee[]>(() =>
    api
      .resource('aiEmployees')
      .getTemplates()
      .then((res) => res?.data?.data),
  );
  return loading ? (
    <Spin />
  ) : templates && templates.length ? (
    <Row gutter={[16, 16]}>
      {templates.map((employee) => (
        <ActionContextProvider key={employee.username} value={{ visible, setVisible }}>
          <Col span={12}>
            <Template aiEmployee={employee} />
          </Col>
          <TemplateContext.Provider value={{ aiEmployee: employee }}>
            <SchemaComponent
              scope={{ useCancelActionProps, useCreateActionProps, useTemplateFormProps }}
              schema={{
                type: 'void',
                name: uid(),
                'x-component': 'Action.Drawer',
                title: '{{t("New AI employee")}}',
                'x-decorator': 'FormV2',
                'x-use-decorator-props': 'useTemplateFormProps',
                properties: {
                  form: {
                    type: 'void',
                    'x-component': 'AIEmployeeForm',
                  },
                  footer: {
                    type: 'void',
                    'x-component': 'Action.Drawer.Footer',
                    properties: {
                      close: {
                        title: 'Cancel',
                        'x-component': 'Action',
                        'x-component-props': {
                          type: 'default',
                        },
                        'x-use-component-props': 'useCancelActionProps',
                      },
                      submit: {
                        title: '{{t("Submit")}}',
                        'x-component': 'Action',
                        'x-component-props': {
                          type: 'primary',
                        },
                        'x-use-component-props': 'useCreateActionProps',
                      },
                    },
                  },
                },
              }}
            />
          </TemplateContext.Provider>
        </ActionContextProvider>
      ))}
    </Row>
  ) : (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
  );
};
