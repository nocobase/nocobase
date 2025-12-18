/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type { ActionDefinition, FlowEngine, FlowSettingsContext } from '@nocobase/flow-engine';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { useForm } from '@formily/react';
import { Select } from 'antd';
import type { BaseSelectRef } from 'rc-select';
import debounce from 'lodash/debounce';
import { NAMESPACE } from './locale';
import { renderTemplateSelectLabel, renderTemplateSelectOption } from './components/TemplateSelectOption';
import {
  TEMPLATE_LIST_PAGE_SIZE,
  calcHasMore,
  getTemplateAvailabilityDisabledReason,
  inferPopupTemplateContextFlags,
  normalizeStr,
  parseResourceListResponse,
  resolveActionScene,
  resolveBaseResourceByAssociation,
  resolveExpectedResourceInfoByModelChain,
  resolveTargetResourceByAssociation,
  tWithNs,
  type PopupTemplateContextFlags,
} from './utils/templateCompatibility';
import { mergeSelectOptions } from './utils/infiniteSelect';

type TemplateRow = {
  uid: string;
  name?: string;
  description?: string;
  targetUid?: string;
  useModel?: string;
  type?: string;
  dataSourceKey?: string;
  collectionName?: string;
  associationName?: string;
  filterByTk?: string;
  sourceId?: string;
};

type ExpectedResourceInfo = { dataSourceKey?: string; collectionName?: string; associationName?: string };

const isAssociationField = (field: any): boolean => !!field?.isAssociationField?.();

const inferPopupTemplateMeta = (ctx: any, tpl: TemplateRow): PopupTemplateContextFlags => {
  const engine = (ctx as any)?.engine;
  const getModelClass = engine?.getModelClass?.bind(engine);
  const scene = resolveActionScene(getModelClass, tpl?.useModel);
  return inferPopupTemplateContextFlags(scene, tpl?.filterByTk, tpl?.sourceId);
};

const resolveAssociationFieldFromCtx = (ctx: any): any | undefined => {
  const field = (ctx as any)?.collectionField;
  const associationPathName = (ctx as any)?.model?.parent?.['associationPathName'];
  const blockModel = (ctx as any)?.blockModel;
  const fieldCollection = (ctx as any)?.collection || blockModel?.collection;
  const associationField =
    !isAssociationField(field) && associationPathName && typeof fieldCollection?.getFieldByPath === 'function'
      ? fieldCollection.getFieldByPath(associationPathName)
      : undefined;
  const assocField = isAssociationField(field) ? field : associationField;
  return isAssociationField(assocField) ? assocField : undefined;
};

const buildAssociationName = (collectionName: string, fieldName: string): string =>
  collectionName && fieldName ? `${collectionName}.${fieldName}` : '';

type AssociationInfoType = 'target' | 'source';

const resolveExpectedAssociationInfoFromCtx = (
  ctx: any,
  type: AssociationInfoType,
): ExpectedResourceInfo | undefined => {
  const assocField = resolveAssociationFieldFromCtx(ctx);
  if (!assocField) return undefined;

  const collection =
    type === 'target'
      ? assocField?.targetCollection
      : assocField?.collection || (ctx as any)?.blockModel?.collection || (ctx as any)?.collection;

  const dataSourceKey = normalizeStr(collection?.dataSourceKey);
  const collectionName = normalizeStr(collection?.name);
  if (!dataSourceKey || !collectionName) return undefined;

  const associationName =
    normalizeStr(assocField?.resourceName) ||
    buildAssociationName(
      normalizeStr(type === 'target' ? assocField?.collection?.name : collection?.name),
      normalizeStr(assocField?.name),
    );
  return associationName ? { dataSourceKey, collectionName, associationName } : { dataSourceKey, collectionName };
};

type AssociationResolveMode = 'target' | 'base';

const resolveResourceInfoFromActionParams = (
  ctx: any,
  params: any,
  mode: AssociationResolveMode,
): ExpectedResourceInfo | undefined => {
  if (!params || typeof params !== 'object') return undefined;
  const rawDataSourceKey = normalizeStr(params?.dataSourceKey);
  const rawCollectionName = normalizeStr(params?.collectionName);
  const rawAssociationName = normalizeStr(params?.associationName);

  if (!rawDataSourceKey && !rawCollectionName && !rawAssociationName) return undefined;

  let fallbackDataSourceKey = '';
  let fallbackCollectionName = '';
  try {
    const ctxCollection = (ctx as any)?.collection;
    fallbackDataSourceKey = normalizeStr(ctxCollection?.dataSourceKey);
    fallbackCollectionName = normalizeStr(ctxCollection?.name);
  } catch {
    // ignore
  }

  const init = {
    dataSourceKey: rawDataSourceKey || fallbackDataSourceKey,
    collectionName: rawCollectionName || fallbackCollectionName,
    associationName: rawAssociationName,
  };

  const resolved =
    mode === 'target'
      ? resolveTargetResourceByAssociation(ctx, init)
      : rawAssociationName
        ? resolveBaseResourceByAssociation(init)
        : undefined;
  if (resolved) {
    return { ...resolved, ...(rawAssociationName ? { associationName: rawAssociationName } : {}) };
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
  const rawAssociationName =
    actionParams && typeof actionParams === 'object' ? normalizeStr((actionParams as any)?.associationName) : '';
  const fromParams = resolveResourceInfoFromActionParams(ctx, actionParams, 'target');
  if (rawAssociationName && fromParams) return fromParams;

  const fromCtxAssociation = resolveExpectedAssociationInfoFromCtx(ctx, 'target');
  if (fromCtxAssociation?.associationName) return fromCtxAssociation;

  const fromModelChain = resolveExpectedResourceInfoByModelChain(ctx, ctx?.model, {
    includeAssociationName: true,
    fallbackCollectionFromCtx: true,
  });
  if (fromModelChain?.associationName) return fromModelChain;
  return fromParams || fromModelChain || {};
};

const resolveExpectedSourceResourceInfo = (ctx: any, actionParams?: any): ExpectedResourceInfo => {
  const rawAssociationName =
    actionParams && typeof actionParams === 'object' ? normalizeStr((actionParams as any)?.associationName) : '';
  const fromParams = resolveResourceInfoFromActionParams(ctx, actionParams, 'base');
  if (rawAssociationName && fromParams) return fromParams;

  const fromCtxAssociation = resolveExpectedAssociationInfoFromCtx(ctx, 'source');
  if (fromCtxAssociation) return fromCtxAssociation;
  if (fromParams) return fromParams;

  let cur: any = ctx?.model;
  let depth = 0;
  while (cur && depth < 8) {
    const init = cur?.getStepParams?.('resourceSettings', 'init') || {};
    const associationName = normalizeStr(init?.associationName);

    let dataSourceKey = normalizeStr(init?.dataSourceKey);
    let collectionName = normalizeStr(init?.collectionName);

    // 次优先：读取运行时注入的 collection（更贴近“当前上下文集合”）
    try {
      const c = (cur as any)?.collection || (ctx as any)?.collection;
      dataSourceKey = dataSourceKey || normalizeStr(c?.dataSourceKey);
      collectionName = collectionName || normalizeStr(c?.name);
    } catch {
      // ignore
    }

    if (associationName && dataSourceKey) {
      const baseResolved = resolveBaseResourceByAssociation({ dataSourceKey, collectionName, associationName });
      if (baseResolved) return { ...baseResolved, associationName };
    }

    if (dataSourceKey && collectionName) {
      return { dataSourceKey, collectionName, ...(associationName ? { associationName } : {}) };
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
  _expectedSource: ExpectedResourceInfo,
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
  return getTemplateAvailabilityDisabledReason(ctx, tpl, expected, {
    associationMatch: 'exactIfTemplateHasAssociationName',
  });
};

/** 预览/配置态下无法获取真实 record 时使用的占位符 */
const POPUP_TEMPLATE_FILTER_BY_TK_PLACEHOLDER = '__popupTemplateFilterByTk__';

const stripTemplateParams = (params: any) => {
  if (!params || typeof params !== 'object') return params;
  const next = { ...params };
  delete next.popupTemplateUid;
  delete (next as any).popupTemplateContext;
  delete (next as any).popupTemplateHasFilterByTk;
  delete (next as any).popupTemplateHasSourceId;
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

const buildPopupTemplateShadowCtx = (ctx: any, params: Record<string, any>) => {
  const baseInputArgs = ctx.inputArgs || {};
  const nextInputArgs: Record<string, any> = { ...(baseInputArgs as any) };

  // 资源三元组（dataSourceKey/collectionName/associationName）以模板为准：通过覆盖 ctx.inputArgs，让 base openView 按原规则生效。
  if (typeof params?.dataSourceKey !== 'undefined') {
    nextInputArgs.dataSourceKey =
      typeof params.dataSourceKey === 'string' ? params.dataSourceKey.trim() : params.dataSourceKey;
  }
  if (typeof params?.collectionName !== 'undefined') {
    nextInputArgs.collectionName =
      typeof params.collectionName === 'string' ? params.collectionName.trim() : params.collectionName;
  }
  const tplAssociationName = typeof params?.associationName === 'string' ? params.associationName.trim() : '';
  if (tplAssociationName) {
    nextInputArgs.associationName = tplAssociationName;
  } else {
    delete nextInputArgs.associationName;
  }

  // 模板是否显式携带 filterByTk/sourceId：用于避免从 actionDefaults "透传"到模板弹窗（尤其是 Record action 复用 Collection 模板）。
  // 注意：运行时 params 可能已被解析（缺少 ctx.record 时会解析为空/undefined），因此优先使用保存时写入的布尔标记兜底。
  const hasTemplateFilterByTk =
    typeof params.popupTemplateHasFilterByTk === 'boolean'
      ? params.popupTemplateHasFilterByTk
      : normalizeStr(params.filterByTk) !== '';
  const hasTemplateSourceId =
    typeof params.popupTemplateHasSourceId === 'boolean'
      ? params.popupTemplateHasSourceId
      : normalizeStr(params.sourceId) !== '';

  let didOverrideFilterByTk = false;
  let didOverrideSourceId = false;
  if (!tplAssociationName && !hasTemplateFilterByTk) {
    // 防止 openView 回落到 actionDefaults.filterByTk（如 Record action 默认 {{ctx.record.id}}）
    nextInputArgs.filterByTk = null;
    didOverrideFilterByTk = true;
  }

  // 预览/配置态下可能拿不到真实 record，导致 filterByTk 被解析为 undefined；但模板若明确需要 record 上下文，
  // 仍需提供一个 truthy 值以保证区块菜单按 record 场景展示（否则只能添加 new 场景区块）。
  if (!tplAssociationName && hasTemplateFilterByTk && !didOverrideFilterByTk) {
    const existing = (nextInputArgs as any).filterByTk;
    if (!normalizeStr(existing)) {
      nextInputArgs.filterByTk =
        normalizeStr((ctx as any)?.view?.inputArgs?.filterByTk) || POPUP_TEMPLATE_FILTER_BY_TK_PLACEHOLDER;
      didOverrideFilterByTk = true;
    }
  }

  if (!tplAssociationName && !hasTemplateSourceId) {
    // 同上：避免 actionDefaults/source 上下文污染到“纯 collection 弹窗模板”
    nextInputArgs.sourceId = null;
    didOverrideSourceId = true;
  }

  // 覆盖 filterByTk/sourceId 时，确保它们不再被视作 defaultInputKeys（否则可能被误判为“默认值”透传）。
  if (Array.isArray(nextInputArgs.defaultInputKeys) && (didOverrideFilterByTk || didOverrideSourceId)) {
    const remove = new Set<string>([
      ...(didOverrideFilterByTk ? ['filterByTk'] : []),
      ...(didOverrideSourceId ? ['sourceId'] : []),
    ]);
    const nextKeys = nextInputArgs.defaultInputKeys.filter((k: any) => !remove.has(String(k)));
    if (nextKeys.length > 0) {
      nextInputArgs.defaultInputKeys = nextKeys;
    } else {
      delete nextInputArgs.defaultInputKeys;
    }
  }

  const shadowCtx = Object.create(ctx);
  // FlowRuntimeContext.inputArgs 通常只有 getter（不可直接赋值），这里通过定义同名自有属性覆盖即可。
  Object.defineProperty(shadowCtx, 'inputArgs', {
    value: nextInputArgs,
    configurable: true,
    enumerable: true,
  });
  return shadowCtx;
};

const fetchPopupTemplates = async (
  ctx: any,
  keyword?: string,
  pagination?: { page?: number; pageSize?: number },
): Promise<{ rows: TemplateRow[]; count?: number }> => {
  const api = ctx?.api;
  if (!api?.resource) return { rows: [] };
  const page = Math.max(1, Number(pagination?.page || 1));
  const pageSize = Math.max(1, Number(pagination?.pageSize || TEMPLATE_LIST_PAGE_SIZE));
  const res = await api.resource('flowModelTemplates').list({
    page,
    pageSize,
    search: keyword || undefined,
    filter: {
      type: 'popup',
    },
  });
  const parsed = parseResourceListResponse<TemplateRow>(res);
  return { rows: parsed.rows, count: parsed.count };
};

const fetchTemplateByUid = async (ctx: any, templateUid: string): Promise<TemplateRow | null> => {
  const api = ctx?.api;
  if (!api?.resource) return null;
  const res = await api.resource('flowModelTemplates').get({ filterByTk: templateUid });
  const body = res.data?.data;
  if (!body) return null;
  return body as TemplateRow;
};

type PopupTemplateMeta = PopupTemplateContextFlags;

const popupTemplateMetaCacheByEngine = new WeakMap<object, Map<string, Promise<PopupTemplateMeta | null>>>();
const popupTemplateMetaCacheFallback = new Map<string, Promise<PopupTemplateMeta | null>>();

const getPopupTemplateMetaCache = (ctx: any): Map<string, Promise<PopupTemplateMeta | null>> => {
  const engine = (ctx as any)?.engine;
  if (engine && typeof engine === 'object') {
    let cache = popupTemplateMetaCacheByEngine.get(engine);
    if (!cache) {
      cache = new Map<string, Promise<PopupTemplateMeta | null>>();
      popupTemplateMetaCacheByEngine.set(engine, cache);
    }
    return cache;
  }
  return popupTemplateMetaCacheFallback;
};

const getPopupTemplateMeta = async (ctx: any, templateUid: string): Promise<PopupTemplateMeta | null> => {
  const uid = typeof templateUid === 'string' ? templateUid.trim() : '';
  if (!uid) return null;
  const cache = getPopupTemplateMetaCache(ctx);
  if (cache.has(uid)) return cache.get(uid)!;
  const p = (async () => {
    try {
      const tpl = await fetchTemplateByUid(ctx, uid);
      if (!tpl) return null;
      return inferPopupTemplateMeta(ctx, tpl);
    } catch (e) {
      console.error('[block-reference] getPopupTemplateMeta failed:', e);
      return null;
    }
  })();
  cache.set(uid, p);
  return p;
};

function PopupTemplateSelect(props: any) {
  const { value, onChange } = props as { value?: string; onChange?: (v: string | undefined) => void };
  const ctx = useFlowSettingsContext();
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
  const expectedSourceResource = useMemo(
    () => resolveExpectedSourceResourceInfo(ctx as any, form?.values),
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
  const [selectLoading, setSelectLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const selectRef = useRef<BaseSelectRef | null>(null);
  const isComposingRef = useRef(false);
  const listVersionRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const t = useCallback((key: string, opt?: Record<string, any>) => tWithNs(ctx, key, opt), [ctx]);

  const toOption = useCallback(
    async (tpl: TemplateRow) => {
      const name = tpl?.name || tpl?.uid || '';
      const desc = tpl?.description;
      const disabledReason = await getPopupTemplateDisabledReason(
        ctx as any,
        tpl,
        expectedResource,
        expectedSourceResource,
      );
      return {
        label: renderTemplateSelectLabel(name),
        value: tpl.uid,
        raw: tpl,
        description: desc,
        disabled: !!disabledReason,
        disabledReason,
        rawName: name,
      };
    },
    [ctx, expectedResource, expectedSourceResource],
  );

  const resetAndLoad = useCallback(
    async (nextKeyword?: string) => {
      const v = (typeof nextKeyword === 'string' ? nextKeyword : '').trim();
      const nextVersion = listVersionRef.current + 1;
      listVersionRef.current = nextVersion;
      loadingMoreRef.current = false;
      setKeyword(v);
      setPage(0);
      setHasMore(true);
      setLoading(true);
      try {
        const { rows, count } = await fetchPopupTemplates(ctx, v, { page: 1, pageSize: TEMPLATE_LIST_PAGE_SIZE });
        const rawLength = rows.length;
        const withIndex = await Promise.all(rows.map(async (r, idx) => ({ ...(await toOption(r)), __idx: idx })));
        if (listVersionRef.current !== nextVersion) return;
        setOptions(mergeSelectOptions([], withIndex));
        setPage(1);
        setHasMore(calcHasMore({ page: 1, pageSize: TEMPLATE_LIST_PAGE_SIZE, rowsLength: rawLength, count }));
      } catch (e) {
        console.error('fetch popup template options failed', e);
        if (listVersionRef.current !== nextVersion) return;
        setOptions([]);
        setPage(1);
        setHasMore(false);
      } finally {
        if (listVersionRef.current === nextVersion) {
          setLoading(false);
        }
      }
    },
    [ctx, toOption],
  );

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || loading || !hasMore) return;
    const version = listVersionRef.current;
    const nextPage = Math.max(1, page || 1) + 1;
    loadingMoreRef.current = true;
    setLoading(true);
    try {
      const { rows, count } = await fetchPopupTemplates(ctx, keyword, {
        page: nextPage,
        pageSize: TEMPLATE_LIST_PAGE_SIZE,
      });
      const rawLength = rows.length;
      const withIndex = await Promise.all(
        rows.map(async (r, idx) => ({ ...(await toOption(r)), __idx: (nextPage - 1) * TEMPLATE_LIST_PAGE_SIZE + idx })),
      );
      if (listVersionRef.current !== version) return;
      setOptions((prev) => mergeSelectOptions(prev || [], withIndex));
      setPage(nextPage);
      setHasMore(calcHasMore({ page: nextPage, pageSize: TEMPLATE_LIST_PAGE_SIZE, rowsLength: rawLength, count }));
    } catch (e) {
      console.error('fetch more popup templates failed', e);
      if (listVersionRef.current !== version) return;
      setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
      if (listVersionRef.current === version) {
        setLoading(false);
      }
    }
  }, [ctx, hasMore, keyword, loading, page, toOption]);

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
        setOptions((prev) => mergeSelectOptions(prev || [], [{ ...(opt as any), __idx: -1 }]));
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
        setSelectLoading(true);
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
        // associationName 允许被"清空"，以支持关系字段复用非关系弹窗模板
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
        setSelectLoading(false);
      }
    },
    [ctx, form.values, onChange, setOpenViewValue],
  );

  const debouncedSearch = useMemo(() => debounce((kw: string) => resetAndLoad(kw), 300), [resetAndLoad]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // 使用 useEffect 来绑定 composition 事件
  useEffect(() => {
    let inputNode: HTMLInputElement | null = null;
    const handleCompositionStart = () => {
      isComposingRef.current = true;
    };
    const handleCompositionEnd = () => {
      isComposingRef.current = false;
      setTimeout(() => {
        const value = inputNode?.value;
        const kw = typeof value === 'string' ? value.trim() : '';
        if (kw) {
          debouncedSearch(kw);
        }
      }, 0);
    };

    const timer = setTimeout(() => {
      const root = selectRef.current?.nativeElement;
      const node = root?.querySelector?.('input.ant-select-selection-search-input');
      if (!(node instanceof HTMLInputElement)) return;
      inputNode = node;

      inputNode.addEventListener('compositionstart', handleCompositionStart);
      inputNode.addEventListener('compositionend', handleCompositionEnd);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (!inputNode) return;
      inputNode.removeEventListener('compositionstart', handleCompositionStart);
      inputNode.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, [debouncedSearch]);

  return (
    <Select
      ref={selectRef}
      showSearch
      allowClear
      filterOption={false}
      optionLabelProp="label"
      placeholder={t('Select popup template')}
      loading={loading || selectLoading}
      options={options}
      value={value}
      onChange={handleSelect}
      onDropdownVisibleChange={(open) => {
        if (!open) return;
        resetAndLoad('');
      }}
      onSearch={(v) => {
        // 如果正在使用中文输入法，不触发搜索
        if (isComposingRef.current) return;
        const kw = typeof v === 'string' ? v.trim() : '';
        debouncedSearch(kw);
      }}
      onPopupScroll={(e) => {
        const target = e?.target as HTMLElement | undefined;
        if (!target) return;
        if (target.scrollTop + target.clientHeight < target.scrollHeight - 24) return;
        loadMore();
      }}
      dropdownMatchSelectWidth
      dropdownStyle={{ maxWidth: 560 }}
      getPopupContainer={() => document.body}
      optionRender={renderTemplateSelectOption}
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
  const expectedSource = resolveExpectedSourceResourceInfo(ctx as any, params);
  const disabledReason = await getPopupTemplateDisabledReason(ctx as any, tpl, expected, expectedSource);
  if (disabledReason) {
    throw new Error(disabledReason);
  }

  params.uid = tpl.targetUid;
  // collectionName / associationName / dataSourceKey 以模板为准（associationName 允许为空表示"非关系弹窗"）
  const tplDataSourceKey = normalizeStr(tpl?.dataSourceKey);
  const tplCollectionName = normalizeStr(tpl?.collectionName);
  const tplAssociationName = normalizeStr(tpl?.associationName);
  if (tplDataSourceKey) {
    params.dataSourceKey = tplDataSourceKey;
  }
  if (tplCollectionName) {
    params.collectionName = tplCollectionName;
  }
  if (tplAssociationName) {
    params.associationName = tplAssociationName;
  } else if (params && typeof params === 'object' && 'associationName' in params) {
    delete params.associationName;
  }

  // filterByTk/sourceId 也以模板为准：模板未提供时需要清理，避免从 Record action 默认值透传到 Collection 模板。
  const inferred = inferPopupTemplateMeta(ctx as any, tpl);
  (params as any).popupTemplateHasFilterByTk = inferred.hasFilterByTk;
  (params as any).popupTemplateHasSourceId = inferred.hasSourceId;
  const applyTemplateParam = (key: 'filterByTk' | 'sourceId', hasInTemplate: boolean) => {
    if (!hasInTemplate) {
      if (params && typeof params === 'object' && key in params) {
        delete (params as any)[key];
      }
      return;
    }
    const tvStr = normalizeStr((tpl as any)?.[key]);
    if (tvStr) {
      (params as any)[key] = tvStr;
    }
  };
  applyTemplateParam('filterByTk', inferred.hasFilterByTk);
  applyTemplateParam('sourceId', inferred.hasSourceId);
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
      await base.beforeParamsSave(ctx, stripTemplateParams(params), previousParams);
    },

    async handler(ctx, params) {
      // 模板信息（uid、dataSourceKey、collectionName、associationName）在配置保存时已填充到 params，
      const templateUid = params.popupTemplateUid;
      const hydratedMeta =
        typeof templateUid === 'string' && templateUid.trim()
          ? await getPopupTemplateMeta(ctx as any, templateUid.trim())
          : null;

      // 根据模板元数据补充运行时标志
      const runtimeParams = { ...params };
      if (hydratedMeta) {
        if (hydratedMeta.confidentFilterByTk) {
          runtimeParams.popupTemplateHasFilterByTk = hydratedMeta.hasFilterByTk;
        }
        if (hydratedMeta.confidentSourceId) {
          runtimeParams.popupTemplateHasSourceId = hydratedMeta.hasSourceId;
        }
      }

      const shouldUseTemplateCtx =
        (typeof templateUid === 'string' && templateUid.trim()) || !!(runtimeParams as any)?.popupTemplateContext;
      const nextParams = stripTemplateParams(runtimeParams);
      const runtimeCtx = shouldUseTemplateCtx ? buildPopupTemplateShadowCtx(ctx, runtimeParams) : ctx;
      return base.handler(runtimeCtx, nextParams);
    },
  };

  flowEngine.registerActions({ openView: enhanced });
}
