/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineFlow, FlowModel, tExpr, useFlowContext } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const PreviewButton = ({ style }) => {
  const { t } = useTranslation();
  const ctx = useFlowContext();
  useEffect(() => {
    const initValues = ctx.getStepFormValues('markdownBlockSettings', 'editMarkdown');
    ctx.model._previousStepParams = _.cloneDeep(initValues);
  }, []);
  return (
    <Button
      color="primary"
      variant="outlined"
      style={style}
      onClick={() => {
        const formValues = ctx.getStepFormValues('markdownBlockSettings', 'editMarkdown');
        ctx.model.setStepParams('markdownBlockSettings', 'editMarkdown', formValues);
      }}
    >
      {t('Preview')}
    </Button>
  );
};

const CancelButton = ({ style }) => {
  const { t } = useTranslation();
  const ctx = useFlowContext();
  return (
    <Button
      type="default"
      style={style}
      onClick={() => {
        // 回滚 未保存的 stepParams
        if (ctx.model._previousStepParams) {
          ctx.model.setStepParams('markdownBlockSettings', 'editMarkdown', ctx.model._previousStepParams);
          ctx.model._previousStepParams = null;
        }
        ctx.view.close();
      }}
    >
      {t('Cancel')}
    </Button>
  );
};

export const editMarkdownFlow = defineFlow<FlowModel>({
  key: 'markdownBlockSettings',
  title: tExpr('Markdown block settings', { ns: 'block-markdown' }),
  steps: {
    editMarkdown: {
      title: tExpr('Edit markdown'),
      uiSchema(ctx) {
        const t = ctx.t;
        const descriptionContent = (
          <Space>
            <span style={{ marginLeft: '10px' }} className={'ant-formily-item-extra'}>
              {t('References')}:
            </span>
            <a
              href={`https://v2.docs.nocobase.com/interface-builder/blocks/other-blocks/markdown`}
              target="_blank"
              rel="noreferrer"
            >
              Markdown
            </a>
          </Space>
        );

        return {
          content: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': (props) => {
              return ctx.markdown.edit({
                ...props,
                value: props.value || ctx.model.props.value,
                mode: 'sv',
                height: '82vh',
                style: {
                  padding: 10,
                },
              });
            },
            description: descriptionContent,
          },
        };
      },
      uiMode: {
        type: 'embed',
        props: {
          styles: {
            body: {
              transform: 'translateX(0)',
            },
          },
          footer: (originNode, { OkBtn }) => (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <CancelButton style={{ marginRight: 6 }} />
              <PreviewButton style={{ marginRight: 6 }} />
              <OkBtn />
            </div>
          ),
        },
      },
      useRawParams: true,
      defaultParams: (ctx) => {
        return {
          content: ctx.t('{{t("This is a demo text, **supports Markdown syntax**.")}}'),
        };
      },
      async handler(ctx, params) {
        const content = params.content;
        try {
          const result = await ctx.liquid.renderWithFullContext(content, ctx);
          // 解析 Markdown
          const mdContent = ctx.markdown.render(result, { textOnly: false });
          ctx.model.setProps({
            content: mdContent,
            value: content,
          });
        } catch (error) {
          ctx.model.setProps({
            content: <pre>{`渲染失败: ${error}`}</pre>,
            value: content,
          });
        }
      },
    },
  },
});
