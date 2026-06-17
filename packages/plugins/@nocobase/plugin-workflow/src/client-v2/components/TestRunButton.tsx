/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * "Test run" action — native-antd rewrite of v1's Formily `TestButton`
 * (`client/nodes/index.tsx`). v1 is deeply Formily-coupled (createForm /
 * SchemaComponent / Action.Modal / observer), so per ADR-0003 it is rebuilt
 * here rather than ported.
 *
 * Click opens a centered `ctx.viewer.dialog` (X-to-close only, no footer) that:
 *   - warns that a test run hits real data / APIs;
 *   - lists every `{{ ... }}` variable reference in the node config (extracted
 *     with `parse(...).parameters`) as a row: left = the disabled variable pill,
 *     right = a pure-constant `TypedVariableInput` (no variable tree) to supply a
 *     literal test value — exactly v1's "replace variables" form;
 *   - on Run, substitutes the supplied values into the config via the
 *     `template(context)` returned by `parse`, POSTs `flow_nodes.test`, and shows
 *     the status (Resolved / Failed), the result JSON, and a collapsible log.
 */

import React, { useMemo, useState } from 'react';
import { CaretRightOutlined } from '@ant-design/icons';
import { Alert, Button, Collapse, Empty, Input, Space } from 'antd';
import { css } from '@emotion/css';
import { TypedVariableInput, type TypedConstantSpec } from '@nocobase/client-v2';
import { useFlowContext as useFlowEngineContext } from '@nocobase/flow-engine';
import { parse } from '@nocobase/utils/client';
import { useT } from '../locale';
import { CurrentWorkflowContext, NodeContext, useCurrentWorkflowContext } from '../canvas/contexts';
import { WorkflowVariableInput } from '../canvas/WorkflowVariableInput';

// Replacement values accept any literal, matching v1's
// `useTypedConstant={['string','number','boolean','date','object']}`.
const REPLACE_TYPES: TypedConstantSpec[] = ['string', 'number', 'boolean', 'date', 'object'];

/** One variable row: disabled pill (which variable) + a constant input (test value). */
function VariableReplacer({
  name,
  value,
  onChange,
}: {
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  // A plain flex row (not antd `Space`): `Space` wraps each child in a shrink-to-content `.ant-space-item`, which
  // collapses `TypedVariableInput`'s internal `width:100%` and squashes the boolean Select. Giving each side an
  // explicit flex basis keeps both at a usable width (mirrors v1's layout).
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', width: '100%' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <WorkflowVariableInput value={`{{${name}}}`} disabled />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* metaTree={[]} → no variable branch, pure constant (mirrors v1). */}
        <TypedVariableInput
          metaTree={[]}
          types={REPLACE_TYPES}
          value={value}
          onChange={onChange}
          defaultToFirstConstantTypeWhenUndefined
        />
      </div>
    </div>
  );
}

/** Collapsible log panel — mirrors v1's `LogCollapse`. */
function LogCollapse({ value }: { value?: string }) {
  const t = useT();
  if (!value) {
    return null;
  }
  return (
    <Collapse
      ghost
      items={[
        {
          key: 'log',
          label: t('Log'),
          children: (
            <Input.TextArea
              value={value}
              autoSize={{ minRows: 5, maxRows: 20 }}
              style={{ whiteSpace: 'pre', cursor: 'text', fontFamily: 'monospace', fontSize: '80%' }}
              disabled
            />
          ),
        },
      ]}
      className={css`
        .ant-collapse-item > .ant-collapse-header {
          padding: 0;
        }
        .ant-collapse-content > .ant-collapse-content-box {
          padding: 0;
        }
      `}
    />
  );
}

type TestResult = { status: number; result?: unknown; log?: string };

function TestRunDialog({ data }: { data: any }) {
  const ctx = useFlowEngineContext();
  const t = useT();

  // Variable keys referenced by the node config (e.g. `$jobsMapByNodeKey.x.y`).
  const template = useMemo(() => parse(data.config ?? {}), [data.config]);
  const keys = useMemo(() => template.parameters.map((p: { key: string }) => p.key), [template]);
  const [replaceValues, setReplaceValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const config = template(replaceValues);
      const {
        data: { data: res },
      } = await ctx.api.resource('flow_nodes').test({
        values: { config, type: data.type },
      });
      setResult(res as TestResult);
    } catch (err) {
      setError((err as Error)?.message ?? t('Failed to run'));
    } finally {
      setLoading(false);
    }
  };

  const succeeded = result != null && result.status > 0;

  return (
    <div>
      <Alert
        type="warning"
        showIcon
        message={t('Test run will do the actual data manipulating or API calling, please use with caution.')}
        style={{ marginBottom: '1em' }}
      />

      <div style={{ marginBottom: '1em' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5em' }}>{t('Replace variables')}</div>
        {keys.length ? (
          <Space direction="vertical" style={{ display: 'flex', width: '100%' }}>
            {keys.map((key: string) => (
              <VariableReplacer
                key={key}
                name={key}
                value={replaceValues[key]}
                onChange={(v) => setReplaceValues((prev) => ({ ...prev, [key]: v }))}
              />
            ))}
          </Space>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No variable')} style={{ margin: '1em' }} />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1em' }}>
        <Button type="primary" loading={loading} onClick={onRun}>
          {t('Run')}
        </Button>
      </div>

      <div style={{ fontWeight: 'bold', marginBottom: '0.5em' }}>{t('Result')}</div>
      {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: '0.5em' }} /> : null}
      {result != null ? (
        <Alert
          type={succeeded ? 'success' : 'error'}
          showIcon
          message={succeeded ? t('Resolved') : t('Failed')}
          style={{ marginBottom: '0.5em' }}
        />
      ) : null}
      <Input.TextArea
        value={result == null ? '' : JSON.stringify(result.result ?? null, null, 2)}
        readOnly
        autoSize={{ minRows: 5, maxRows: 20 }}
        style={{ whiteSpace: 'pre', cursor: 'text', fontFamily: 'monospace', fontSize: '80%' }}
      />
      <LogCollapse value={result?.log} />
    </div>
  );
}

/**
 * The footer "Test run" button shown in the node config drawer for testable
 * nodes. `form` is the drawer's antd form — its live `config` value is snapshot
 * into the dialog when opened.
 */
export function TestRunButton({ data, form, workflow: workflowProp }: { data: any; form: any; workflow?: any }) {
  const ctx = useFlowEngineContext();
  const t = useT();
  // Footer actions are rendered through the detached `view.Footer` slot, so they
  // cannot rely on inheriting the drawer body's React contexts. Prefer the
  // explicitly-threaded workflow prop; fall back to the local context only when
  // the button is rendered inside the body tree.
  const workflowFromContext = useCurrentWorkflowContext();
  const workflow = workflowProp ?? workflowFromContext;

  const onOpen = () => {
    const config = form.getFieldsValue()?.config ?? data.config ?? {};
    // The dialog renders in a detached portal, so React contexts from the drawer (NodeContext) don't cross into it.
    // Re-provide both workflow + node contexts from the config drawer tree:
    //   - `CurrentWorkflowContext` keeps trigger-scope variable pills resolving to their labelled path instead of
    //     falling back to the raw `{{...}}` template;
    //   - `NodeContext` keeps node-result variables resolving through the live upstream linked-list.
    ctx.viewer.dialog({
      width: 800,
      closable: true,
      title: t('Test run'),
      content: () => (
        <CurrentWorkflowContext.Provider value={workflow}>
          <NodeContext.Provider value={{ ...data, config }}>
            <TestRunDialog data={{ ...data, config }} />
          </NodeContext.Provider>
        </CurrentWorkflowContext.Provider>
      ),
    });
  };

  return (
    <Button icon={<CaretRightOutlined />} onClick={onOpen}>
      {t('Test run')}
    </Button>
  );
}

export default TestRunButton;
