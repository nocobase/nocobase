/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { App, Form, Input, Skeleton, Tag, Tooltip, Typography, theme } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { DrawerFormLayout } from '@nocobase/client-v2';
import { useFlowContext as useFlowEngineContext } from '@nocobase/flow-engine';
import {
  useFlowContext as useCanvasFlowContext,
  useWorkflowCanvasExecuted,
  CurrentWorkflowContext,
} from '../canvas/contexts';
import useStyles from '../canvas/style';
import { useT } from '../locale';
import { PluginWorkflowClientV2 } from '../plugin';
import type { Trigger } from '.';

function TriggerTypeDescription({
  trigger,
  t,
}: {
  trigger: Trigger;
  t: (key: string, options?: Record<string, any>) => string;
}) {
  const { token } = theme.useToken();
  if (!trigger.description) {
    return null;
  }
  return (
    <div style={{ marginBottom: token.marginLG, padding: token.padding, backgroundColor: token.colorFillAlter }}>
      <Typography.Paragraph>
        <Typography.Text>{t('Trigger type')}</Typography.Text>
        <Typography.Text>: </Typography.Text>
        <Tag icon={<ThunderboltOutlined />}>{t(trigger.title)}</Tag>
      </Typography.Paragraph>
      <Typography.Paragraph type="secondary">{t(trigger.description)}</Typography.Paragraph>
    </div>
  );
}

function TriggerConfigForm({
  trigger,
  workflow,
  onSubmitted,
}: {
  trigger?: Trigger;
  workflow: Record<string, any>;
  onSubmitted?: () => void;
}) {
  const ctx = useFlowEngineContext();
  const t = useT();
  const { message } = App.useApp();
  const executed = Boolean(workflow?.versionStats?.executed);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const Fieldset = useMemo(() => (trigger?.FieldsetLoader ? lazy(trigger.FieldsetLoader) : null), [trigger]);
  const initialValues = useMemo(() => ({ config: workflow.config ?? {} }), [workflow.config]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const onSubmit = useMemoizedFn(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await ctx.api.resource('workflows').update({
        filterByTk: workflow.id,
        values: {
          config: values.config ?? {},
        },
      });
      onSubmitted?.();
    } catch (error) {
      message.error(t('Failed to save trigger'));
      // eslint-disable-next-line no-console
      console.error(error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <CurrentWorkflowContext.Provider value={workflow}>
      <DrawerFormLayout
        title={t('Trigger')}
        onSubmit={onSubmit}
        submitting={submitting}
        submitText={t('Submit')}
        cancelText={t('Cancel')}
        footer={executed ? <span /> : undefined}
      >
        <Form form={form} layout="vertical" disabled={executed}>
          {trigger ? <TriggerTypeDescription trigger={trigger} t={t} /> : null}
          {Fieldset ? (
            <Suspense fallback={<Skeleton active paragraph={{ rows: 4 }} />}>
              <Fieldset />
            </Suspense>
          ) : (
            <Typography.Paragraph type="secondary">
              {trigger
                ? t("This trigger's configuration has not been migrated to the new canvas yet.")
                : t('This trigger type is not available in the new canvas yet.')}
            </Typography.Paragraph>
          )}
        </Form>
      </DrawerFormLayout>
    </CurrentWorkflowContext.Provider>
  );
}

export function openTriggerConfigDrawer(opts: {
  ctx: { viewer: { drawer: (options: Record<string, unknown>) => void } };
  trigger?: Trigger;
  workflow: Record<string, any>;
  refresh?: () => void;
}) {
  opts.ctx.viewer.drawer({
    width: '50%',
    closable: true,
    content: () => <TriggerConfigForm trigger={opts.trigger} workflow={opts.workflow} onSubmitted={opts.refresh} />,
  });
}

function isInteractiveClickTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(target.closest('textarea, input, button, a, .ant-dropdown, .workflow-node-actions'));
}

export function TriggerConfig() {
  const flowEngine = useFlowEngineContext();
  const t = useT();
  const { styles, cx } = useStyles();
  const { workflow, refresh } = useCanvasFlowContext() ?? {};
  const executed = Boolean(useWorkflowCanvasExecuted());
  const plugin = flowEngine.app.pm.get(PluginWorkflowClientV2) as PluginWorkflowClientV2;
  const trigger = workflow?.type ? plugin.getTriggerOptions(workflow.type) : undefined;
  const triggerTitle = trigger ? t(trigger.title) : workflow?.type ?? t('Unknown trigger');
  const [editingTitle, setEditingTitle] = useState<string>('');

  useEffect(() => {
    setEditingTitle(workflow?.triggerTitle ?? workflow?.title ?? triggerTitle);
  }, [triggerTitle, workflow?.title, workflow?.triggerTitle]);

  const onSaveTitle = useMemoizedFn(async (nextTitle: string) => {
    if (!workflow?.id) {
      return;
    }
    const title = nextTitle || triggerTitle;
    setEditingTitle(title);
    if (title === workflow.triggerTitle) {
      return;
    }
    await flowEngine.api.resource('workflows').update({
      filterByTk: workflow.id,
      values: {
        triggerTitle: title,
      },
    });
    refresh?.();
  });

  const openDrawer = useMemoizedFn(() => {
    if (!workflow?.id) {
      return;
    }
    openTriggerConfigDrawer({ ctx: flowEngine, trigger, workflow, refresh });
  });

  if (!workflow) {
    return null;
  }

  const titleText = t('Trigger');

  return (
    <div
      className={styles.nodeClass}
      role="button"
      aria-label={`${titleText}-${editingTitle}`}
      onClick={(event) => {
        if (!isInteractiveClickTarget(event.target)) {
          openDrawer();
        }
      }}
    >
      <div className={cx(styles.nodeCardClass, { invalid: !trigger })}>
        <div className={styles.nodeHeaderClass}>
          <div className={cx(styles.nodeMetaClass, 'workflow-node-meta')}>
            <Tooltip title={trigger?.description ? t(trigger.description) : undefined}>
              <Tag color={trigger ? 'gold' : 'error'} icon={<ThunderboltOutlined />}>
                <span className="type">{triggerTitle}</span>
              </Tag>
            </Tooltip>
          </div>
        </div>
        <div className="workflow-node-title">
          <Input.TextArea
            value={editingTitle}
            onChange={(event) => setEditingTitle(event.target.value)}
            onBlur={async (event) => {
              await onSaveTitle(event.target.value);
            }}
            autoSize
            disabled={executed}
            aria-label={t('Trigger title')}
          />
        </div>
      </div>
    </div>
  );
}

export default TriggerConfig;
