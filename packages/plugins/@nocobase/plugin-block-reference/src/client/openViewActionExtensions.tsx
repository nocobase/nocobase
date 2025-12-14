/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ActionDefinition, FlowEngine, FlowSettingsContext } from '@nocobase/flow-engine';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { useField, useForm } from '@formily/react';
import { Select, Typography } from 'antd';
import debounce from 'lodash/debounce';
import { NAMESPACE } from './locale';

type TemplateRow = {
  uid: string;
  name?: string;
  description?: string;
  targetUid?: string;
  rootUse?: string;
  type?: string;
  dataSourceKey?: string;
  collectionName?: string;
  associationName?: string;
  filterByTk?: string;
  sourceId?: string;
};

const unwrapData = (val: any) => {
  let cur = val;
  // axios response: { data: { data: ... } }
  while (cur && typeof cur === 'object' && 'data' in cur) {
    cur = (cur as any).data;
  }
  return cur;
};

const tWithNs = (ctx: any, key: string, options?: Record<string, any>) => {
  const opt = { ns: [NAMESPACE, 'client'], nsMode: 'fallback', ...(options || {}) };
  return ctx?.t ? ctx.t(key, opt) : key;
};

const stripTemplateParams = (params: any) => {
  if (!params || typeof params !== 'object') return params;
  const next = { ...params };
  delete next.popupTemplateUid;
  delete next.popupTemplateMode;
  // Avoid overriding runtime defaults with null/empty values.
  const isEmptyValue = (v: any) => {
    if (v === null || typeof v === 'undefined') return true;
    if (typeof v === 'string') return v.trim() === '';
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'object') return Object.keys(v).length === 0;
    return false;
  };
  if (isEmptyValue(next.filterByTk)) delete next.filterByTk;
  if (isEmptyValue(next.sourceId)) delete next.sourceId;
  return next;
};

const fetchPopupTemplates = async (ctx: any, keyword?: string): Promise<TemplateRow[]> => {
  const api = ctx?.api;
  if (!api?.resource) return [];
  const res = await api.resource('flowModelTemplates').list({
    pageSize: 20,
    search: keyword || undefined,
    filter: {
      $or: [
        { type: 'popup' },
        { $and: [{ type: null }, { rootUse: 'PopupActionModel' }] },
        { $and: [{ type: '' }, { rootUse: 'PopupActionModel' }] },
      ],
    },
  });
  const body = unwrapData(res);
  const rows = Array.isArray(body?.rows) ? body.rows : Array.isArray(body) ? body : [];
  return rows as TemplateRow[];
};

const fetchTemplateByUid = async (ctx: any, templateUid: string): Promise<TemplateRow | null> => {
  const api = ctx?.api;
  if (!api?.resource) return null;
  const res = await api.resource('flowModelTemplates').get({ filterByTk: templateUid });
  const body = unwrapData(res);
  if (!body) return null;
  return body as TemplateRow;
};

function PopupTemplateSelect(props: any) {
  const { value, onChange } = props as { value?: string; onChange?: (v: string | undefined) => void };
  const ctx = useFlowSettingsContext();
  const field: any = useField();
  const form = useForm();
  const [options, setOptions] = useState<Array<{ label: React.ReactNode; value: string; raw?: TemplateRow }>>([]);
  const [loading, setLoading] = useState(false);

  const t = useCallback((key: string, opt?: Record<string, any>) => tWithNs(ctx, key, opt), [ctx]);

  const toOption = useCallback((tpl: TemplateRow) => {
    const name = tpl?.name || tpl?.uid || '';
    const desc = tpl?.description;
    return {
      label: (
        <span
          style={{
            display: 'inline-block',
            maxWidth: 480,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            verticalAlign: 'middle',
          }}
          title={desc ? `${name} - ${desc}` : name}
        >
          {name}
        </span>
      ),
      value: tpl.uid,
      raw: tpl,
    };
  }, []);

  const loadOptions = useCallback(
    async (keyword?: string) => {
      setLoading(true);
      try {
        const rows = await fetchPopupTemplates(ctx, keyword);
        setOptions(rows.map(toOption));
      } catch (e) {
        console.error('fetch popup template options failed', e);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [ctx, toOption],
  );

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const v = typeof value === 'string' ? value.trim() : '';
      if (!v) return;
      // Ensure current value is visible even if dropdown hasn't been opened yet.
      if (options.some((o) => o.value === v)) return;
      try {
        const tpl = await fetchTemplateByUid(ctx, v);
        if (!alive || !tpl?.uid) return;
        setOptions((prev) =>
          [toOption(tpl), ...prev].filter((it, idx, arr) => arr.findIndex((x) => x.value === it.value) === idx),
        );
      } catch (e) {
        // ignore
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [ctx, options, toOption, value]);

  const setOpenViewValue = useCallback(
    (k: string, v: any) => {
      if (typeof v === 'undefined') return;
      try {
        form.setValuesIn(k, v);
      } catch (_) {
        // ignore
      }
    },
    [form],
  );

  const handleSelect = useCallback(
    async (nextUid?: string) => {
      const next = typeof nextUid === 'string' ? nextUid.trim() : '';
      if (!next) {
        onChange?.(undefined);
        // keep uid as-is; only reset template mode
        setOpenViewValue('popupTemplateMode', 'reference');
        return;
      }
      onChange?.(next);
      try {
        field.loading = true;
        const tpl = await fetchTemplateByUid(ctx, next);
        const targetUid = tpl?.targetUid;
        if (targetUid) {
          setOpenViewValue('uid', targetUid);
        }
        // best-effort: backfill common openView params from template record
        const shouldApplyTemplateField = (v: any) => {
          if (v === undefined || v === null) return false;
          if (typeof v === 'string') return v.trim() !== '';
          return true;
        };
        (['dataSourceKey', 'collectionName', 'associationName', 'filterByTk', 'sourceId'] as const).forEach((k) => {
          const tv = (tpl as any)?.[k];
          if (shouldApplyTemplateField(tv)) {
            setOpenViewValue(k, tv);
          }
        });

        // Backfill defaults for important runtime params when template record doesn't carry them.
        if (!shouldApplyTemplateField((tpl as any)?.filterByTk) && !shouldApplyTemplateField(form.values?.filterByTk)) {
          const recordKeyPath = (ctx as any)?.collection?.filterTargetKey || 'id';
          setOpenViewValue('filterByTk', `{{ ctx.record.${recordKeyPath} }}`);
        }
        if (!shouldApplyTemplateField((tpl as any)?.sourceId) && !shouldApplyTemplateField(form.values?.sourceId)) {
          try {
            const sid = (ctx as any)?.resource?.getSourceId?.();
            if (sid !== undefined && sid !== null && String(sid) !== '') {
              setOpenViewValue('sourceId', `{{ ctx.resource.sourceId }}`);
            }
          } catch (_) {
            // ignore
          }
        }
        // default template mode
        if (!form.values?.popupTemplateMode) {
          setOpenViewValue('popupTemplateMode', 'reference');
        }
      } catch (e) {
        console.error('load popup template failed', e);
      } finally {
        field.loading = false;
      }
    },
    [ctx, field, form.values, onChange, setOpenViewValue],
  );

  const debouncedSearch = useMemo(() => debounce((kw: string) => loadOptions(kw), 300), [loadOptions]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <Select
      showSearch
      allowClear
      filterOption={false}
      optionLabelProp="label"
      placeholder={t('Select popup template')}
      loading={loading || field?.loading || field?.validating}
      options={options}
      value={value}
      onChange={handleSelect}
      onDropdownVisibleChange={(open) => {
        if (!open) return;
        loadOptions();
      }}
      onSearch={(v) => {
        const kw = typeof v === 'string' ? v.trim() : '';
        debouncedSearch(kw);
      }}
      dropdownMatchSelectWidth
      dropdownStyle={{ maxWidth: 560 }}
      getPopupContainer={() => document.body}
      optionRender={(option) => {
        const tpl = option?.data?.raw as TemplateRow | undefined;
        const name = tpl?.name || tpl?.uid || option.label;
        const desc = tpl?.description;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0', maxWidth: 520 }}>
            <Typography.Text
              strong
              style={{
                maxWidth: 480,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={typeof name === 'string' ? name : undefined}
            >
              {name}
            </Typography.Text>
            {desc && (
              <Typography.Text
                type="secondary"
                style={{ fontSize: 12, lineHeight: 1.4, whiteSpace: 'normal', wordBreak: 'break-word' }}
              >
                {desc}
              </Typography.Text>
            )}
          </div>
        );
      }}
    />
  );
}

const resolveTemplateToUid = async (ctx: FlowSettingsContext, params: any): Promise<void> => {
  const templateUid = typeof params?.popupTemplateUid === 'string' ? params.popupTemplateUid.trim() : '';
  if (!templateUid) return;
  const templateMode = params?.popupTemplateMode || 'reference';
  const tpl = await fetchTemplateByUid(ctx as any, templateUid);
  if (!tpl?.targetUid) {
    throw new Error(tWithNs(ctx, 'Popup template not found'));
  }
  if (templateMode === 'copy') {
    const duplicated = await (ctx as any)?.engine?.duplicateModel?.(tpl.targetUid);
    const newUid = duplicated?.uid;
    if (!newUid) {
      throw new Error(tWithNs(ctx, 'Failed to copy popup from template'));
    }
    params.uid = newUid;
    // copy means detach from template; clear to avoid accidental usage counting
    params.popupTemplateUid = undefined;
    params.popupTemplateMode = undefined;
    return;
  }
  params.uid = tpl.targetUid;
};

export function registerOpenViewPopupTemplateAction(flowEngine: FlowEngine) {
  const base = flowEngine.getAction('openView') as ActionDefinition | undefined;
  if (!base) return;

  const baseUiSchema: any = (base as any).uiSchema || {};
  const { mode, size, uid, ...rest } = baseUiSchema;

  const enhanced: ActionDefinition = {
    ...(base as any),
    uiSchema: {
      ...(mode ? { mode } : {}),
      ...(size ? { size } : {}),
      popupTemplateUid: {
        type: 'string',
        title: `{{t("Popup template", { ns: ['${NAMESPACE}', 'client'], nsMode: 'fallback' })}}`,
        'x-decorator': 'FormItem',
        'x-component': PopupTemplateSelect,
      },
      popupTemplateMode: {
        type: 'string',
        title: `{{t("Template mode", { ns: ['${NAMESPACE}', 'client'], nsMode: 'fallback' })}}`,
        default: 'reference',
        enum: [
          { label: `{{t("Reference", { ns: ['${NAMESPACE}', 'client'], nsMode: 'fallback' })}}`, value: 'reference' },
          { label: `{{t("Copy", { ns: ['${NAMESPACE}', 'client'], nsMode: 'fallback' })}}`, value: 'copy' },
        ],
        'x-decorator': 'FormItem',
        'x-component': 'Radio.Group',
        'x-reactions': {
          dependencies: ['popupTemplateUid'],
          fulfill: {
            state: {
              hidden: '{{$deps[0] ? false : true}}',
            },
          },
        },
      },
      ...(uid ? { uid } : {}),
      ...rest,
    },

    async beforeParamsSave(ctx: FlowSettingsContext, params: any, previousParams: any) {
      // 1) resolve template -> uid (in-place mutation so it will be persisted)
      await resolveTemplateToUid(ctx, params);
      // 2) delegate to original beforeParamsSave (strip template params to avoid leaking)
      const baseBefore = (base as any).beforeParamsSave;
      if (typeof baseBefore === 'function') {
        await baseBefore(ctx, stripTemplateParams(params), previousParams);
      }
    },

    async handler(ctx: any, params: any) {
      // runtime should never see template params, but be defensive
      const nextParams = stripTemplateParams(params);
      const baseHandler = (base as any).handler;
      if (typeof baseHandler === 'function') {
        return baseHandler(ctx, nextParams);
      }
    },
  };

  flowEngine.registerActions({ openView: enhanced });
}
