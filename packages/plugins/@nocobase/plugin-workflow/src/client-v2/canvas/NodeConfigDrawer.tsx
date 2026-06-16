/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Modern canvas node config drawer (doc §3/§9.3). Opened via `ctx.viewer.drawer`
 * from a node card click, using the shared `DrawerFormLayout` chrome (title +
 * native close + Cancel/Submit footer) for consistency with the rest of the v2
 * client.
 *
 * The drawer body is the shared antd `<Form>`; it renders the instruction's
 * `FieldsetLoader` (lazy) when present, else the "not yet migrated" placeholder
 * — never a Formily fallback. Submitting writes `config` via `flow_nodes.update`.
 * Testable nodes get a "Test run" action grafted into the footer's left side.
 */

import React, { Suspense, lazy, useMemo, useState } from 'react';
import { App, Button, Form, Skeleton, Space, Tag, Tooltip, theme } from 'antd';
import { css, cx } from '@emotion/css';
import { DrawerFormLayout } from '@nocobase/client-v2';
import { useFlowContext as useFlowEngineContext, useFlowView } from '@nocobase/flow-engine';
import { useT } from '../locale';
import { CurrentWorkflowContext, NodeContext } from './contexts';
import { TestRunButton } from '../components/TestRunButton';
import type { Instruction } from './Instruction';

/**
 * The grey "node type" description region at the top of the config drawer body —
 * v2 mirror of v1's `DrawerDescription` (`client/components/DrawerDescription.tsx`).
 * Shows a `Node type: <icon tag>` definition row and, when the instruction has a
 * `description`, a muted paragraph below it. Rendered only for nodes that carry
 * a `description`.
 */
function NodeTypeDescription({
  instruction,
  t,
}: {
  instruction: Instruction;
  t: (key: string, options?: Record<string, any>) => string;
}) {
  const { token } = theme.useToken();
  if (!instruction.description) {
    return null;
  }
  const containerClass = css`
    margin-bottom: 1.5em;
    padding: 1em;
    background-color: ${token.colorFillAlter};

    > *:last-child {
      margin-bottom: 0;
    }

    dl {
      display: flex;
      align-items: baseline;
      margin: 0;

      dt {
        color: ${token.colorText};
        &:after {
          content: ':';
          margin-right: 0.5em;
        }
      }

      dd {
        margin: 0;
      }
    }

    p {
      color: ${token.colorTextDescription};
      margin-top: 0.5em;
    }
  `;
  return (
    <div className={cx(containerClass)}>
      <dl>
        <dt>{t('Node type')}</dt>
        <dd>
          <Tag icon={instruction.icon} style={{ background: 'none' }}>
            {t(instruction.title as string)}
          </Tag>
        </dd>
      </dl>
      <p>{t(instruction.description as string)}</p>
    </div>
  );
}

/**
 * Open the node config drawer for a node. Call from a card click handler.
 * `ctx` is the flow-engine context (from `useFlowContext()`).
 *
 * `workflow` is threaded in explicitly because the drawer renders at the React
 * root (`ctx.viewer.drawer`), OUTSIDE the canvas `FlowContext.Provider` — so the
 * config form can't read the workflow from the canvas tree. It is re-provided via
 * `CurrentWorkflowContext` so the variable aggregator's trigger scope (and the
 * `executed` read-only state) resolve correctly.
 */
export function openNodeConfigDrawer(opts: {
  ctx: any;
  data: any;
  instruction?: Instruction;
  t: (key: string, options?: Record<string, any>) => string;
  workflow?: any;
  refresh?: () => void;
}) {
  const { ctx, data, instruction, workflow } = opts;
  ctx.viewer.drawer({
    width: '50%',
    closable: true,
    content: () => (
      <NodeConfigForm data={data} instruction={instruction} workflow={workflow} onSubmitted={opts.refresh} />
    ),
  });
}

function NodeConfigForm({
  data,
  instruction,
  workflow,
  onSubmitted,
}: {
  data: any;
  instruction?: Instruction;
  workflow?: any;
  onSubmitted?: () => void;
}) {
  const ctx = useFlowEngineContext();
  const t = useT();
  const { message } = App.useApp();
  const view = useFlowView();
  const executed = Boolean(workflow?.versionStats?.executed);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const Fieldset = useMemo(() => {
    if (instruction?.FieldsetLoader) {
      return lazy(instruction.FieldsetLoader);
    }
    return null;
  }, [instruction]);

  const initialValues = useMemo(() => ({ config: data.config ?? {} }), [data]);

  React.useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const onSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await ctx.api.resource('flow_nodes').update({
        filterByTk: data.id,
        values: { config: values.config ?? {} },
      });
      onSubmitted?.();
    } catch (err) {
      message.error(t('Failed to save node'));
      // eslint-disable-next-line no-console
      console.error(err);
      throw err; // keep the drawer open on failure
    } finally {
      setSubmitting(false);
    }
  };

  const typeTitle = instruction ? t(instruction.title as string) : data.type;

  const footer = executed ? (
    <span />
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <div>{instruction?.testable ? <TestRunButton data={data} form={form} /> : null}</div>
      <Space>
        <Button onClick={() => view.close()}>{t('Cancel')}</Button>
        <Button
          type="primary"
          loading={submitting}
          onClick={async () => {
            await onSubmit();
            await view.close();
          }}
        >
          {t('Submit')}
        </Button>
      </Space>
    </div>
  );

  return (
    <CurrentWorkflowContext.Provider value={workflow}>
      <NodeContext.Provider value={data}>
        <DrawerFormLayout
          title={
            // `justify-content: space-between` pushes the node-key tag to the drawer's far right (mirrors v1's flex
            // title), the native close X sitting just left of the title.
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <strong>{data.title ?? typeTitle}</strong>
              <Tooltip title={t('Variable key of node')}>
                <Tag style={{ marginInlineEnd: 0 }}>
                  <code>{data.key}</code>
                </Tag>
              </Tooltip>
            </div>
          }
          footer={footer}
        >
          <Form form={form} layout="vertical" disabled={executed}>
            {instruction ? <NodeTypeDescription instruction={instruction} t={t} /> : null}
            {Fieldset ? (
              <Suspense fallback={<Skeleton active paragraph={{ rows: 4 }} />}>
                <Fieldset />
              </Suspense>
            ) : (
              <div style={{ padding: '2em 0', textAlign: 'center', color: 'var(--colorTextTertiary, #999)' }}>
                {t("This node's configuration has not been migrated to the new canvas yet.")}
              </div>
            )}
          </Form>
        </DrawerFormLayout>
      </NodeContext.Provider>
    </CurrentWorkflowContext.Provider>
  );
}
