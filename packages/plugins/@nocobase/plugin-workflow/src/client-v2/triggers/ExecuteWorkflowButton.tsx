/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { lazy, Suspense, useMemo, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { App, Alert, Button, Checkbox, Form, Skeleton, Space, Tag, Tooltip, theme } from 'antd';
import { DialogFormLayout } from '@nocobase/client-v2';
import { useFlowContext as useFlowEngineContext, useFlowView } from '@nocobase/flow-engine';
import { EXECUTION_STATUS_OPTIONS_MAP } from '../../common/executionStatus';
import { CurrentWorkflowContext } from '../canvas/contexts';
import { HideVariableContext } from '../components/HideVariableContext';
import { useWorkflowRuntimePaths } from '../hooks/useWorkflowRuntimePaths';
import { useT } from '../locale';
import { PluginWorkflowClientV2 } from '../plugin';
import type { LoaderOf, Trigger } from '.';
import { Link } from 'react-router-dom';
import { Trans } from 'react-i18next';
import { NAMESPACE } from '../../common/constants';

type WorkflowLike = {
  id?: string | number;
  type?: string;
  config?: Record<string, unknown>;
  versionStats?: { executed?: number };
};

function ExecutedMessage({ execution }: { execution?: { id?: string | number; status?: number | null } }) {
  const t = useT();
  const { getWorkflowExecutionPath } = useWorkflowRuntimePaths();
  const option = execution ? EXECUTION_STATUS_OPTIONS_MAP[String(execution.status)] : null;
  if (!option) {
    return <span>{t('Workflow not executed')}</span>;
  }
  const statusText = t(option.label);
  return (
    <Trans ns={NAMESPACE} values={{ statusText }}>
      {'Workflow executed, the result status is '}
      <Tag color={option.color}>{'{{statusText}}'}</Tag>
      <Link to={getWorkflowExecutionPath(execution.id ?? '')}>View the execution</Link>
    </Trans>
  );
}

function ExecuteWorkflowForm({
  workflow,
  trigger,
  TriggerFieldsetLoader,
  valid,
  onSubmitted,
}: {
  workflow: WorkflowLike;
  trigger: Trigger;
  TriggerFieldsetLoader: LoaderOf;
  valid: boolean;
  onSubmitted?: () => void;
}) {
  const ctx = useFlowEngineContext();
  const view = useFlowView();
  const t = useT();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const { getWorkflowCanvasPath } = useWorkflowRuntimePaths();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const executed = Boolean(workflow.versionStats?.executed);
  const Fieldset = useMemo(() => lazy(TriggerFieldsetLoader), [TriggerFieldsetLoader]);
  const disabled = !valid;

  const onSubmit = useMemoizedFn(async () => {
    if (!valid) {
      return;
    }
    const raw = await form.validateFields();
    const { autoRevision, ...values } = raw;
    setSubmitting(true);
    try {
      const response = await ctx.api.resource('workflows').execute({
        filterByTk: workflow.id,
        values,
        ...(!executed && autoRevision ? { autoRevision: 1 } : {}),
      });
      const result = response?.data?.data;
      message.open({
        type: result?.execution ? 'info' : 'error',
        content: <ExecutedMessage execution={result?.execution} />,
      });
      await view.close();
      if (result?.newVersionId) {
        ctx.router.navigate(getWorkflowCanvasPath(result.newVersionId));
      } else {
        onSubmitted?.();
      }
    } finally {
      setSubmitting(false);
    }
  });

  const footer = (
    <Space>
      <Button disabled={disabled} onClick={() => view.close()}>
        {t('Cancel')}
      </Button>
      <Button type="primary" loading={submitting} disabled={disabled} onClick={onSubmit}>
        {t('Confirm')}
      </Button>
    </Space>
  );

  return (
    <CurrentWorkflowContext.Provider value={workflow}>
      <HideVariableContext.Provider value>
        <DialogFormLayout
          title={t('Execute manually')}
          onSubmit={onSubmit}
          submitting={submitting}
          submitText={t('Confirm')}
          cancelText={t('Cancel')}
          footer={footer}
        >
          <Form form={form} layout="vertical" initialValues={{ autoRevision: true }} disabled={disabled}>
            <Alert
              message={t('Trigger variables need to be filled for executing.')}
              type="info"
              style={{ marginBottom: token.margin }}
            />
            <Form.Item label={t('Trigger variables')}>
              <div
                style={{
                  padding: token.padding,
                  border: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
                  borderRadius: token.borderRadiusLG,
                }}
              >
                <Suspense fallback={<Skeleton active paragraph={{ rows: 2 }} />}>
                  <Fieldset />
                </Suspense>
              </div>
            </Form.Item>
            {executed ? null : (
              <Form.Item name="autoRevision" valuePropName="checked">
                <Checkbox>{t('Automatically create a new version after execution')}</Checkbox>
              </Form.Item>
            )}
          </Form>
        </DialogFormLayout>
      </HideVariableContext.Provider>
    </CurrentWorkflowContext.Provider>
  );
}

export function ExecuteWorkflowButton({ record, refresh }: { record: WorkflowLike; refresh?: () => void }) {
  const ctx = useFlowEngineContext();
  const t = useT();
  const plugin = ctx.app.pm.get(PluginWorkflowClientV2) as PluginWorkflowClientV2;
  const trigger = record.type ? plugin.getTriggerOptions(record.type) : undefined;
  const valid = trigger?.validate(record.config ?? {}) ?? false;

  const disabledReason = useMemo(() => {
    if (!trigger) {
      return t('This trigger type is not available in the new canvas yet.');
    }
    if (!trigger.TriggerFieldsetLoader) {
      return t('This type of trigger has not been supported to be executed manually.');
    }
    return '';
  }, [t, trigger]);

  const openExecuteDialog = useMemoizedFn(() => {
    if (!trigger || disabledReason || !trigger.TriggerFieldsetLoader) {
      return;
    }
    openExecuteWorkflowDialog({
      ctx,
      workflow: record,
      trigger,
      TriggerFieldsetLoader: trigger.TriggerFieldsetLoader,
      valid,
      refresh,
    });
  });

  return (
    <Tooltip title={disabledReason || undefined}>
      <span>
        <Button disabled={Boolean(disabledReason)} onClick={openExecuteDialog}>
          {t('Execute manually')}
        </Button>
      </span>
    </Tooltip>
  );
}

export default ExecuteWorkflowButton;

export function openExecuteWorkflowDialog(opts: {
  ctx: { viewer: { dialog: (options: Record<string, unknown>) => void } };
  workflow: WorkflowLike;
  trigger: Trigger;
  TriggerFieldsetLoader: LoaderOf;
  valid: boolean;
  refresh?: () => void;
}) {
  opts.ctx.viewer.dialog({
    width: 520,
    closable: true,
    content: () => (
      <ExecuteWorkflowForm
        workflow={opts.workflow}
        trigger={opts.trigger}
        TriggerFieldsetLoader={opts.TriggerFieldsetLoader}
        valid={opts.valid}
        onSubmitted={opts.refresh}
      />
    ),
  });
}
