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
import { App, Button, Form, Skeleton, Space, Tag, Tooltip } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import { DrawerFormLayout } from '@nocobase/client-v2';
import { useFlowContext as useFlowEngineContext, useFlowView } from '@nocobase/flow-engine';
import { useT } from '../locale';
import { NodeContext, useWorkflowCanvasExecuted } from './contexts';
import type { Instruction } from './Instruction';

/**
 * Open the node config drawer for a node. Call from a card click handler.
 * `ctx` is the flow-engine context (from `useFlowContext()`).
 */
export function openNodeConfigDrawer(opts: {
  ctx: any;
  data: any;
  instruction?: Instruction;
  t: (key: string, options?: Record<string, any>) => string;
  refresh?: () => void;
}) {
  const { ctx, data, instruction, t } = opts;
  ctx.viewer.drawer({
    width: '50%',
    closable: true,
    content: () => <NodeConfigForm data={data} instruction={instruction} onSubmitted={opts.refresh} />,
  });
}

function NodeConfigForm({
  data,
  instruction,
  onSubmitted,
}: {
  data: any;
  instruction?: Instruction;
  onSubmitted?: () => void;
}) {
  const ctx = useFlowEngineContext();
  const t = useT();
  const { message } = App.useApp();
  const view = useFlowView();
  const executed = useWorkflowCanvasExecuted();
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
    <NodeContext.Provider value={data}>
      <DrawerFormLayout
        title={
          <Space>
            <strong>{data.title ?? typeTitle}</strong>
            <Tooltip title={t('Variable key of node')}>
              <Tag>
                <code>{data.key}</code>
              </Tag>
            </Tooltip>
          </Space>
        }
        footer={footer}
      >
        <Form form={form} layout="vertical" disabled={executed}>
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
  );
}

/** "Test run" action (doc — v1 `TestButton`). Runs the node with the current
 *  form config via `flow_nodes.test` and surfaces the result/log. */
function TestRunButton({ data, form }: { data: any; form: any }) {
  const ctx = useFlowEngineContext();
  const t = useT();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);

  const onTest = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const {
        data: { data: result },
      } = await ctx.api.resource('flow_nodes').test({
        values: { config: values.config ?? {}, type: data.type },
      });
      modal.info({
        title: t('Test run'),
        width: 640,
        content: (
          <pre style={{ maxHeight: '60vh', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(result?.result ?? result, null, 2)}
            {result?.log ? `\n\n--- log ---\n${result.log}` : ''}
          </pre>
        ),
      });
    } catch (err) {
      message.error((err as any)?.message ?? t('Failed to run'));
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button icon={<CaretRightOutlined />} loading={loading} onClick={onTest}>
      {t('Test run')}
    </Button>
  );
}
