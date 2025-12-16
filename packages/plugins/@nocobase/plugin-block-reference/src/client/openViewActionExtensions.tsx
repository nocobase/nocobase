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
import { Select, Tooltip, Typography } from 'antd';
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

type ExpectedResourceInfo = { dataSourceKey?: string; collectionName?: string; associationName?: string };

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

const resolveTargetResourceByAssociation = (
  ctx: any,
  init: { dataSourceKey?: unknown; collectionName?: unknown; associationName?: unknown },
): { dataSourceKey: string; collectionName: string } | undefined => {
  const dataSourceKey = typeof init?.dataSourceKey === 'string' ? init.dataSourceKey.trim() : '';
  const collectionName = typeof init?.collectionName === 'string' ? init.collectionName.trim() : '';
  const associationName = typeof init?.associationName === 'string' ? init.associationName.trim() : '';
  if (!dataSourceKey || !associationName) return undefined;

  const parts = associationName.split('.').filter(Boolean);
  const inferredBaseCollectionName = parts.length > 1 ? parts[0] : '';
  const baseCollectionName = inferredBaseCollectionName || collectionName;
  const fieldPath = parts.length > 1 ? parts.slice(1).join('.') : associationName;
  if (!baseCollectionName || !fieldPath) return undefined;

  const dsManager = ctx?.dataSourceManager || ctx?.model?.context?.dataSourceManager;
  const baseCollection = dsManager?.getCollection?.(dataSourceKey, baseCollectionName);
  const field = baseCollection?.getFieldByPath?.(fieldPath) || baseCollection?.getField?.(fieldPath);
  const targetCollection = field?.targetCollection;
  const targetDataSourceKey =
    typeof targetCollection?.dataSourceKey === 'string' ? targetCollection.dataSourceKey.trim() : '';
  const targetCollectionName = typeof targetCollection?.name === 'string' ? targetCollection.name.trim() : '';
  if (!targetDataSourceKey || !targetCollectionName) return undefined;
  return { dataSourceKey: targetDataSourceKey, collectionName: targetCollectionName };
};

const resolveExpectedResourceInfoFromActionParams = (ctx: any, params: any): ExpectedResourceInfo | undefined => {
  if (!params || typeof params !== 'object') return undefined;
  const rawDataSourceKey = typeof params?.dataSourceKey === 'string' ? params.dataSourceKey.trim() : '';
  const rawCollectionName = typeof params?.collectionName === 'string' ? params.collectionName.trim() : '';
  const rawAssociationName = typeof params?.associationName === 'string' ? params.associationName.trim() : '';

  if (!rawDataSourceKey && !rawCollectionName && !rawAssociationName) return undefined;

  let fallbackDataSourceKey = '';
  let fallbackCollectionName = '';
  try {
    const ctxCollection = (ctx as any)?.collection;
    fallbackDataSourceKey = typeof ctxCollection?.dataSourceKey === 'string' ? ctxCollection.dataSourceKey.trim() : '';
    fallbackCollectionName = typeof ctxCollection?.name === 'string' ? ctxCollection.name.trim() : '';
  } catch {
    // ignore
  }

  const init = {
    dataSourceKey: rawDataSourceKey || fallbackDataSourceKey,
    collectionName: rawCollectionName || fallbackCollectionName,
    associationName: rawAssociationName,
  };

  const assocResolved = resolveTargetResourceByAssociation(ctx, init);
  if (assocResolved) {
    return { ...assocResolved, ...(rawAssociationName ? { associationName: rawAssociationName } : {}) };
  }

  if (init.dataSourceKey && init.collectionName) {
    return {
      dataSourceKey: init.dataSourceKey,
      collectionName: init.collectionName,
      ...(rawAssociationName ? { associationName: rawAssociationName } : {}),
    };
  }

  return undefined;
};

const resolveExpectedResourceInfo = (ctx: any, actionParams?: any): ExpectedResourceInfo => {
  const fromParams = resolveExpectedResourceInfoFromActionParams(ctx, actionParams);
  if (fromParams) return fromParams;

  let cur: any = ctx?.model;
  let depth = 0;
  while (cur && depth < 8) {
    const init = cur?.getStepParams?.('resourceSettings', 'init') || {};
    const expectedAssociationName = typeof init?.associationName === 'string' ? init.associationName.trim() : '';
    // 若存在 associationName，优先解析其目标集合（collectionName 可能缺失/不准）
    const assocResolved = resolveTargetResourceByAssociation(ctx, init);
    if (assocResolved) {
      return { ...assocResolved, ...(expectedAssociationName ? { associationName: expectedAssociationName } : {}) };
    }

    // 次优先：读取运行时注入的 collection（更贴近“当前上下文集合”）
    try {
      const c = (cur as any)?.collection || (ctx as any)?.collection;
      const dataSourceKey = typeof c?.dataSourceKey === 'string' ? c.dataSourceKey.trim() : '';
      const collectionName = typeof c?.name === 'string' ? c.name.trim() : '';
      if (dataSourceKey && collectionName) {
        return {
          dataSourceKey,
          collectionName,
          ...(expectedAssociationName ? { associationName: expectedAssociationName } : {}),
        };
      }
    } catch {
      // ignore
    }

    const dataSourceKey = typeof init?.dataSourceKey === 'string' ? init.dataSourceKey.trim() : '';
    const collectionName = typeof init?.collectionName === 'string' ? init.collectionName.trim() : '';
    if (dataSourceKey && collectionName) {
      return {
        dataSourceKey,
        collectionName,
        ...(expectedAssociationName ? { associationName: expectedAssociationName } : {}),
      };
    }
    cur = cur?.parent;
    depth++;
  }
  return {};
};

const getPopupTemplateDisabledReason = async (
  ctx: any,
  tpl: TemplateRow,
  expected: ExpectedResourceInfo,
): Promise<string | undefined> => {
  /**
   * 弹窗模版的兼容性判断说明：
   *
   * openView 弹窗通常在某个「当前记录/资源」上下文中触发（ctx.record / ctx.resource）。
   * 弹窗模版在创建时会把 dataSourceKey/collectionName（以及 associationName）固化到模板记录，
   * 模板内部的区块/变量表达式也往往默认依赖这些信息（例如默认 filterByTk 会引用 ctx.record.<pk>，
   * sourceId 可能引用 ctx.resource.sourceId）。
   *
   * 如果在另一个 dataSourceKey/collectionName 的上下文里引用该弹窗模版：
   * - 弹窗里获取数据会落到错误的数据源/数据表，或由于上下文不一致导致变量无法解析；
   * - 即使 openView 参数被“回填”为模板侧的 dataSourceKey/collectionName，也会让当前触发点
   *   的 ctx.record 与弹窗目标集合不一致，从而形成「配置上看似可用、运行时必坏」的问题。
   *
   * 因此这里将 dataSourceKey/collectionName 不匹配视为“模板不兼容”，在选择器里禁用并给出原因，
   * 同时在 beforeParamsSave 做硬校验防止绕过 UI。
   *
   * 额外：collectionName 有时并不可靠（例如资源是由 associationName 推导而来），所以会优先
   * 尝试根据 associationName 解析真实 targetCollection 再比较（best-effort，解析失败则回退）。
   */
  const expectedDataSourceKey = String(expected?.dataSourceKey || '').trim();
  const expectedCollectionName = String(expected?.collectionName || '').trim();
  const expectedAssociationName = String(expected?.associationName || '').trim();
  if (!expectedDataSourceKey || !expectedCollectionName) return undefined;

  const baseTplDataSourceKey = String(tpl?.dataSourceKey || '').trim();
  const baseTplCollectionName = String(tpl?.collectionName || '').trim();
  const tplAssociationName = String(tpl?.associationName || '').trim();
  const tplResolved = tplAssociationName
    ? resolveTargetResourceByAssociation(ctx, {
        dataSourceKey: baseTplDataSourceKey,
        collectionName: baseTplCollectionName,
        associationName: tplAssociationName,
      })
    : undefined;
  const tplDataSourceKey = tplResolved?.dataSourceKey || baseTplDataSourceKey;
  const tplCollectionName = tplResolved?.collectionName || baseTplCollectionName;

  if (!tplDataSourceKey || !tplCollectionName) {
    return tWithNs(ctx, 'Template missing data source/collection info');
  }

  if (tplDataSourceKey === expectedDataSourceKey && tplCollectionName === expectedCollectionName) {
    // associationName 的兼容规则：
    // - 模板为「非关系弹窗」（tpl.associationName 为空）时，只要 collection 一致即可复用；
    // - 模板为「关系弹窗」（tpl.associationName 非空）时，必须与当前上下文 associationName 一致。
    if (tplAssociationName) {
      if (expectedAssociationName !== tplAssociationName) {
        const none = tWithNs(ctx, 'No association');
        return tWithNs(ctx, 'Template association mismatch', {
          expected: expectedAssociationName || none,
          actual: tplAssociationName || none,
        });
      }
    }
    return;
  }

  const isSameDataSource = tplDataSourceKey === expectedDataSourceKey;
  if (isSameDataSource) {
    return tWithNs(ctx, 'Template collection mismatch', {
      expected: expectedCollectionName,
      actual: tplCollectionName,
    });
  }
  return tWithNs(ctx, 'Template data source mismatch', {
    expected: `${expectedDataSourceKey}/${expectedCollectionName}`,
    actual: `${tplDataSourceKey}/${tplCollectionName}`,
  });
};

const stripTemplateParams = (params: any) => {
  if (!params || typeof params !== 'object') return params;
  const next = { ...params };
  delete next.popupTemplateUid;
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
  const expectedResource = useMemo(
    () => resolveExpectedResourceInfo(ctx as any, form?.values),
    [
      ctx,
      (form as any)?.values?.dataSourceKey,
      (form as any)?.values?.collectionName,
      (form as any)?.values?.associationName,
    ],
  );
  const [options, setOptions] = useState<
    Array<{
      label: React.ReactNode;
      value: string;
      raw?: TemplateRow;
      description?: string;
      disabled?: boolean;
      disabledReason?: string;
      rawName?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);

  const t = useCallback((key: string, opt?: Record<string, any>) => tWithNs(ctx, key, opt), [ctx]);

  const toOption = useCallback(
    async (tpl: TemplateRow) => {
      const name = tpl?.name || tpl?.uid || '';
      const desc = tpl?.description;
      const disabledReason = await getPopupTemplateDisabledReason(ctx as any, tpl, expectedResource);
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
          >
            {name}
          </span>
        ),
        value: tpl.uid,
        raw: tpl,
        description: desc,
        disabled: !!disabledReason,
        disabledReason,
        rawName: name,
      };
    },
    [ctx, expectedResource],
  );

  const loadOptions = useCallback(
    async (keyword?: string) => {
      setLoading(true);
      try {
        const rows = await fetchPopupTemplates(ctx, keyword);
        const withIndex = await Promise.all(rows.map(async (r, idx) => ({ ...(await toOption(r)), __idx: idx })));
        withIndex.sort((a: any, b: any) => {
          const da = a.disabled ? 1 : 0;
          const db = b.disabled ? 1 : 0;
          if (da !== db) return da - db;
          return (a.__idx as number) - (b.__idx as number);
        });
        setOptions(withIndex.map(({ __idx, ...rest }) => rest));
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
        const opt = await toOption(tpl);
        setOptions((prev) =>
          [opt, ...prev].filter((it, idx, arr) => arr.findIndex((x) => x.value === it.value) === idx),
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
      try {
        form.setValuesIn(k, v);
      } catch (e) {
        console.error(e);
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
        (['dataSourceKey', 'collectionName', 'filterByTk', 'sourceId'] as const).forEach((k) => {
          const tv = (tpl as any)?.[k];
          if (shouldApplyTemplateField(tv)) {
            setOpenViewValue(k, tv);
          }
        });
        // associationName 允许被“清空”，以支持关系字段复用非关系弹窗模板
        const tplAssociationName =
          typeof (tpl as any)?.associationName === 'string' ? String((tpl as any).associationName) : '';
        if (shouldApplyTemplateField(tplAssociationName)) {
          setOpenViewValue('associationName', tplAssociationName);
        } else {
          setOpenViewValue('associationName', undefined);
        }

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
        const name = option?.data?.rawName || tpl?.name || tpl?.uid || option.label;
        const desc = option?.data?.description || tpl?.description;
        const disabledReason = option?.data?.disabledReason;
        const isDisabled = !!disabledReason;
        const content = (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              padding: '4px 0',
              maxWidth: 520,
              opacity: isDisabled ? 0.5 : 1,
              width: '100%',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            <Typography.Text
              strong
              style={{
                maxWidth: 480,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
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
        if (isDisabled && disabledReason) {
          return (
            <Tooltip
              title={disabledReason}
              placement="right"
              zIndex={9999}
              overlayStyle={{ maxWidth: 400 }}
              mouseEnterDelay={0.1}
            >
              <div style={{ width: '100%' }}>{content}</div>
            </Tooltip>
          );
        }
        return content;
      }}
    />
  );
}

const resolveTemplateToUid = async (ctx: FlowSettingsContext, params: any): Promise<void> => {
  const templateUid = typeof params?.popupTemplateUid === 'string' ? params.popupTemplateUid.trim() : '';
  if (!templateUid) return;
  const tpl = await fetchTemplateByUid(ctx as any, templateUid);
  if (!tpl?.targetUid) {
    throw new Error(tWithNs(ctx, 'Popup template not found'));
  }

  const expected = resolveExpectedResourceInfo(ctx as any, params);
  const disabledReason = await getPopupTemplateDisabledReason(ctx as any, tpl, expected);
  if (disabledReason) {
    throw new Error(disabledReason);
  }

  params.uid = tpl.targetUid;
  // collectionName / associationName / dataSourceKey 以模板为准（associationName 允许为空表示“非关系弹窗”）
  if (typeof tpl?.dataSourceKey === 'string' && tpl.dataSourceKey.trim()) {
    params.dataSourceKey = tpl.dataSourceKey.trim();
  }
  if (typeof tpl?.collectionName === 'string' && tpl.collectionName.trim()) {
    params.collectionName = tpl.collectionName.trim();
  }
  if (typeof tpl?.associationName === 'string' && tpl.associationName.trim()) {
    params.associationName = tpl.associationName.trim();
  } else if (params && typeof params === 'object' && 'associationName' in params) {
    delete params.associationName;
  }
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
      // 模板信息（uid、dataSourceKey、collectionName、associationName）在配置保存时已填充到 params，
      // 运行时直接使用即可，无需再次请求模板 API。
      const templateUid = typeof params?.popupTemplateUid === 'string' ? params.popupTemplateUid.trim() : '';

      const nextParams = stripTemplateParams({
        ...params,
        // 内部标记：用于 openView 运行时按"模板资源优先"合并参数
        ...(templateUid ? { __resourceFromPopupTemplate: true } : {}),
      });
      const baseHandler = (base as any).handler;
      if (typeof baseHandler === 'function') {
        return baseHandler(ctx, nextParams);
      }
    },
  };

  flowEngine.registerActions({ openView: enhanced });
}
