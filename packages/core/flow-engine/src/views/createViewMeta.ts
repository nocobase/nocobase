/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext, PropertyMeta, PropertyMetaFactory } from '../flowContext';
import { buildRecordMeta, inferViewRecordRef } from '../utils/variablesParams';
import type { RecordRef } from '../utils/serverContextParams';
import type { Collection } from '../data-source';
import type { FlowView } from './FlowView';

type PopupModelLike = { getStepParams?: (a: string, b: string) => any } | undefined;

// 判断是否为普通对象（Plain Object），避免对类实例/代理等进行深度遍历
function isPlainObject(val: any) {
  if (val === null || typeof val !== 'object') return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

// 懒加载元信息：仅在展开节点时计算子属性；并加入循环引用防护
function makeMetaFromValue(value: any, title?: string, seen?: WeakSet<any>): any {
  const t = typeof value;
  if (value === null || value === undefined) return { type: 'any', title };

  if (Array.isArray(value)) {
    return {
      type: 'array',
      title,
      properties: async () => {
        const max = Math.min(value.length || 0, 10);
        const children: Record<string, any> = {};
        const nextSeen = seen ?? new WeakSet<any>();
        for (let i = 0; i < max; i++) {
          children[String(i)] = makeMetaFromValue(value[i], `#${i}`, nextSeen);
        }
        return children;
      },
    };
  }

  if (t === 'string') return { type: 'string', title };
  if (t === 'number') return { type: 'number', title };
  if (t === 'boolean') return { type: 'boolean', title };

  // 仅对普通对象做懒递归；其它对象（如运行时实例）视为 any，防止进入复杂的循环引用
  if (t === 'object' && isPlainObject(value)) {
    return {
      type: 'object',
      title,
      properties: async () => {
        const nextSeen = seen ?? new WeakSet<any>();
        if (nextSeen.has(value)) {
          // 循环引用：不再展开子节点
          return {};
        }
        nextSeen.add(value);
        const props: Record<string, any> = {};
        Object.keys(value || {}).forEach((k) => {
          props[k] = makeMetaFromValue(value[k], k, nextSeen);
        });
        return props;
      },
    };
  }
  return { type: 'any', title };
}

/**
 * 为 ctx.popup 构建元信息：
 * - popup.record：当前弹窗记录（服务端解析）
 * - popup.resource：数据源信息（前端解析）
 * - popup.parent：上级弹窗（无限级，前端解析；不存在则禁用/为空）
 */
export function createPopupMeta(ctx: FlowContext, anchorView?: FlowView): PropertyMetaFactory {
  const t = (k: string) => ctx.t(k);

  const isPopupView = (view?: FlowView): boolean => {
    if (!view) return false;
    const stack = Array.isArray(view.navigation?.viewStack) ? view.navigation.viewStack : [];
    const openerUids = view?.inputArgs?.openerUids;
    const hasOpener = Array.isArray(openerUids) && openerUids.length > 0;
    return stack.length >= 2 || hasOpener;
  };

  const hasPopupNow = (): boolean => isPopupView(anchorView ?? ctx.view);

  // 统一解析锚定视图下的 RecordRef，避免在设置弹窗等二级视图中被误导
  const resolveRecordRef = async (flowCtx: FlowContext): Promise<RecordRef | undefined> => {
    const view = anchorView ?? flowCtx.view;
    if (!view || !isPopupView(view)) return undefined;

    const base = await buildPopupRuntime(flowCtx, view);
    const res = base?.resource;
    if (res?.collectionName && res.filterByTk != null) {
      return {
        collection: res.collectionName,
        dataSourceKey: res.dataSourceKey || 'main',
        filterByTk: res.filterByTk,
        associationName: res.associationName,
        sourceId: res.sourceId,
      };
    }
    return inferViewRecordRef(flowCtx);
  };

  const getCurrentCollection = async (): Promise<Collection | null> => {
    const ref = await resolveRecordRef(ctx);
    if (!ref?.collection) return null;
    const ds = ctx.dataSourceManager?.getDataSource?.(ref.dataSourceKey || 'main');
    return ds?.collectionManager?.getCollection?.(ref.collection) || null;
  };

  // 从视图堆栈推断 level 级父弹窗（level=1 上一层）
  const getParentRecordRef = async (level: number, flowCtx?: FlowContext): Promise<RecordRef | undefined> => {
    try {
      const useCtx = flowCtx || ctx;
      const nav = useCtx.view?.navigation;
      const stack = Array.isArray(nav?.viewStack) ? nav.viewStack : [];
      if (stack.length < 2 || level < 1) return undefined;
      const idx = stack.length - 1 - level;
      if (idx < 0) return undefined;
      const parent = stack[idx];
      if (!parent?.viewUid) return undefined;

      let model = useCtx.engine?.getModel(parent.viewUid, true) as PopupModelLike;
      if (!model) {
        try {
          model = (await useCtx.engine.loadModel({ uid: parent.viewUid })) as PopupModelLike;
        } catch (e) {
          (useCtx.logger || ctx.logger)?.warn?.({ err: e }, '[FlowEngine] popup.getParentRecordRef loadModel failed');
        }
      }
      const params = model?.getStepParams?.('popupSettings', 'openView') || {};
      const collection = params?.collectionName;
      const dataSourceKey = params?.dataSourceKey || 'main';
      const filterByTk = parent?.filterByTk ?? parent?.sourceId;
      if (!collection || typeof filterByTk === 'undefined' || filterByTk === null) return undefined;
      const ref: RecordRef = {
        collection,
        dataSourceKey,
        filterByTk,
        sourceId: parent?.sourceId,
        associationName: params?.associationName,
      };
      return ref;
    } catch (e) {
      (flowCtx?.logger || ctx.logger)?.warn?.({ err: e }, '[FlowEngine] popup.getParentRecordRef failed');
      return undefined;
    }
  };

  const hasParentNow = (level: number): boolean => {
    try {
      const nav = (anchorView ?? ctx.view)?.navigation;
      const stack = Array.isArray(nav?.viewStack) ? nav.viewStack : [];
      return stack.length >= level + 1; // level=1 需要至少2层
    } catch (_) {
      return false;
    }
  };

  const createParentFactory = (level: number): PropertyMetaFactory => {
    const factory: PropertyMetaFactory = () => {
      const meta: PropertyMeta = {
        type: 'object',
        title: t('Parent popup'),
        disabled: () => !hasParentNow(level),
        disabledReason: () => (!hasParentNow(level) ? t('No parent popup') : undefined),
        hidden: () => !hasParentNow(level),
        properties: async () => {
          const parentRef = await getParentRecordRef(level);
          const props: Record<string, any> = {};
          // 弹窗 UID（纯前端变量）
          props.uid = { type: 'string', title: t('Popup uid') };

          // 记录分组
          if (parentRef) {
            const parentCollection = (() => {
              try {
                const ds = ctx.dataSourceManager?.getDataSource?.(parentRef.dataSourceKey || 'main');
                return ds?.collectionManager?.getCollection?.(parentRef.collection || '') || null;
              } catch (_) {
                return null;
              }
            })();
            const base = await buildRecordMeta(
              () => parentCollection,
              t('Popup record'),
              () => parentRef,
            );
            props.record = base || { type: 'object', title: t('Popup record') };
          } else {
            props.record = { type: 'object', title: t('Popup record') };
          }

          // 数据源分组（前端显示用）
          const resourceMeta: PropertyMeta = {
            type: 'object',
            title: t('Data source'),
            properties: async () => ({
              dataSourceKey: { type: 'string', title: t('Data source key') },
              collectionName: { type: 'string', title: t('Collection name') },
              associationName: { type: 'string', title: t('Association name') },
              filterByTk: { type: 'string', title: t('filterByTk') },
              sourceId: { type: 'string', title: t('sourceId') },
            }),
          };
          props.resource = resourceMeta;

          // 不在 "上级弹窗" 节点内继续渲染下一层，以避免列表中出现重复的“上级弹窗”层级
          // 仍然保留运行时值中的 parent.parent... 链（buildPopupRuntime 会构建完整链），
          // 以便用户手动输入时可以访问更深层级。
          return props;
        },
      };
      return meta;
    };
    factory.title = t('Parent popup');
    return factory;
  };

  const factory: PropertyMetaFactory = () => {
    const meta: PropertyMeta = {
      type: 'object',
      title: t('Current popup'),
      disabled: () => !hasPopupNow(),
      hidden: () => !hasPopupNow(),
      buildVariablesParams: async (c) => {
        if (!hasPopupNow()) return undefined;
        const ref = await resolveRecordRef(c);
        const inputArgs = c.view?.inputArgs;
        type PopupVariableParams = {
          record?: RecordRef;
          sourceRecord?: RecordRef;
          parent?: PopupVariableParams;
        };
        const params: PopupVariableParams = {};
        if (ref) {
          const merged: RecordRef = { ...ref };
          if (!merged.associationName && inputArgs?.associationName) {
            merged.associationName = inputArgs.associationName;
          }
          if (typeof merged.sourceId === 'undefined' && typeof inputArgs?.sourceId !== 'undefined') {
            merged.sourceId = inputArgs?.sourceId;
          }
          params.record = merged;
        }

        // 构建 parent 链（用于服务端解析 ctx.popup.parent[.parent...].record.*）
        try {
          const nav = c.view?.navigation;
          const stack = Array.isArray(nav?.viewStack) ? nav.viewStack : [];
          if (stack.length >= 2) {
            let cur: Record<string, any> = params;
            let level = 1;
            let parentRef = await getParentRecordRef(level, c);
            while (parentRef) {
              if (!cur.parent) cur.parent = {};
              cur.parent.record = parentRef;
              cur = cur.parent;
              level += 1;
              parentRef = await getParentRecordRef(level, c);
            }
          }
        } catch (err) {
          c.logger?.debug?.({ err }, '[FlowEngine] buildVariablesParams: build parent-chain failed');
        }

        try {
          const srcId = inputArgs?.sourceId;
          const assoc: string | undefined = inputArgs?.associationName;
          const dsKey: string = inputArgs?.dataSourceKey || 'main';
          if (srcId != null && srcId !== '' && assoc && typeof assoc === 'string') {
            // associationName 形如 `posts.comments`，父级集合为 `posts`
            const parentCollectionName = String(assoc).split('.')[0];
            if (parentCollectionName) {
              params.sourceRecord = {
                collection: parentCollectionName,
                dataSourceKey: dsKey,
                filterByTk: srcId,
              };
            }
          }
        } catch (err) {
          c.logger?.debug?.({ err }, '[FlowEngine] buildVariablesParams: infer sourceRecord failed');
        }
        return params;
      },
      properties: async () => {
        const props: Record<string, any> = {};
        // 当前弹窗 UID（纯前端变量）
        props.uid = { type: 'string', title: t('Popup uid') };
        // 仅当存在 filterByTk（可推断具体记录）时才提供“当前弹窗记录”变量；
        // 对于新增/选择类弹窗（无 filterByTk），不应展示该变量以避免误导。
        const recordRef = await resolveRecordRef(ctx);
        if (recordRef) {
          // 基于锚定视图计算“当前弹窗记录”的集合与 RecordRef
          const recordFactory: PropertyMetaFactory = async () => {
            const col = await getCurrentCollection();
            if (!col) return null;
            return await buildRecordMeta(
              () => col,
              t('Current popup record'),
              (c) => resolveRecordRef(c),
            );
          };
          recordFactory.title = t('Current popup record');
          recordFactory.hasChildren = true;
          props.record = recordFactory;
        }
        // 当 view.inputArgs 带有 sourceId + associationName 时，提供“上级记录”变量（基于 sourceId 推断）
        try {
          const inputArgs = ctx.view?.inputArgs;
          const srcId = inputArgs?.sourceId;
          let assoc: string | undefined = inputArgs?.associationName;
          let dsKey: string = inputArgs?.dataSourceKey || 'main';

          // 兜底：若 associationName 缺失或不含“.”，尝试从当前视图模型的 openView 参数推断
          if (!assoc || typeof assoc !== 'string' || !assoc.includes('.')) {
            const nav = ctx.view?.navigation;
            const stack = Array.isArray(nav?.viewStack) ? nav.viewStack : [];
            const last = stack?.[stack.length - 1];
            if (last?.viewUid) {
              let model = ctx?.engine?.getModel(last.viewUid, true) as PopupModelLike;
              if (!model) {
                model = (await ctx.engine.loadModel({ uid: last.viewUid })) as PopupModelLike;
              }
              const p = model?.getStepParams?.('popupSettings', 'openView') || {};
              assoc = p?.associationName || assoc;
              dsKey = p?.dataSourceKey || dsKey;
            }
          }

          if (srcId != null && srcId !== '' && assoc && typeof assoc === 'string') {
            const parentCollectionName = String(assoc).includes('.') ? String(assoc).split('.')[0] : undefined;
            if (parentCollectionName) {
              const parentCollectionAccessor = () => {
                try {
                  const ds = ctx.dataSourceManager?.getDataSource?.(dsKey);
                  return ds?.collectionManager?.getCollection?.(parentCollectionName) || null;
                } catch (_) {
                  return null;
                }
              };
              const srcMeta = await buildRecordMeta(parentCollectionAccessor, t('Current popup parent record'), () => ({
                collection: parentCollectionName,
                dataSourceKey: dsKey,
                filterByTk: srcId,
              }));
              if (srcMeta) {
                props.sourceRecord = srcMeta;
              }
            }
          }
        } catch (err) {
          ctx.logger?.debug?.({ err }, '[FlowEngine] popup.properties: build sourceRecord failed');
        }
        const resourceMeta: PropertyMeta = {
          type: 'object',
          title: t('Data source'),
          properties: async () => ({
            dataSourceKey: { type: 'string', title: t('Data source key') },
            collectionName: { type: 'string', title: t('Collection name') },
            associationName: { type: 'string', title: t('Association name') },
            filterByTk: { type: 'string', title: t('filterByTk') },
            sourceId: { type: 'string', title: t('sourceId') },
          }),
        };
        props.resource = resourceMeta;
        // 是否展示“上级弹窗”应依据实际视图层级，而不是简单以配置态隐藏。
        // 当存在父级弹窗（不含当前配置弹窗自身）时，展示“上级弹窗”节点。
        const parentRef1 = await getParentRecordRef(1);
        if (parentRef1) {
          props.parent = createParentFactory(1);
        }
        return props;
      },
    };
    return meta;
  };
  factory.title = t('Current popup');
  factory.sort = 975;
  return factory;
}

/**
 * 根据视图堆栈构建 popup 运行时值（resource + parent 链）
 */
interface PopupNodeResource {
  dataSourceKey: string;
  collectionName?: string;
  associationName?: string;
  filterByTk?: any;
  sourceId?: any;
}

interface PopupNode {
  uid?: string;
  resource: PopupNodeResource;
  parent?: PopupNode;
}

export async function buildPopupRuntime(ctx: FlowContext, view: FlowView): Promise<PopupNode | undefined> {
  const nav = view?.navigation;
  const stack = Array.isArray(nav?.viewStack) ? nav.viewStack : [];

  const openerUids = view?.inputArgs?.openerUids;
  const hasOpener = Array.isArray(openerUids) && openerUids.length > 0;
  const hasStackPopup = stack.length >= 2;
  const isPopup = hasStackPopup || hasOpener;
  if (!isPopup) return undefined;

  // 当没有 navigation 堆栈时，退回当前视图的 inputArgs 作为单节点弹窗上下文
  if (!stack.length) {
    const args = view?.inputArgs || {};
    const hasAny =
      args.collectionName || args.filterByTk != null || args.sourceId != null || args.associationName || args.viewUid;
    if (!hasAny) return undefined;
    return {
      uid: args.viewUid,
      resource: {
        dataSourceKey: args.dataSourceKey || 'main',
        collectionName: args.collectionName,
        associationName: args.associationName,
        filterByTk: args.filterByTk,
        sourceId: args.sourceId,
      },
    };
  }

  const buildNode = async (idx: number): Promise<PopupNode | undefined> => {
    if (idx < 0 || !stack[idx]?.viewUid) return undefined;
    const viewUid = stack[idx].viewUid;
    let model = ctx.engine?.getModel(viewUid, true) as PopupModelLike;
    if (!model) {
      model = (await ctx.engine?.loadModel({ uid: viewUid })) as PopupModelLike;
    }
    const p = model?.getStepParams?.('popupSettings', 'openView') || {};
    const collectionName = p?.collectionName;
    const dataSourceKey = p?.dataSourceKey || 'main';
    const node: PopupNode = {
      uid: viewUid,
      resource: {
        dataSourceKey,
        collectionName,
        associationName: p?.associationName,
        filterByTk: stack[idx]?.filterByTk,
        sourceId: stack[idx]?.sourceId,
      },
    };
    const parentNode = await buildNode(idx - 1);
    if (parentNode) node.parent = parentNode;
    return node;
  };
  const currentNode = await buildNode((view?.navigation?.viewStack?.length || 1) - 1);
  return currentNode;
}

/**
 * 在视图上下文中注册 popup 变量（统一消除重复）
 */
export function registerPopupVariable(ctx: FlowContext, view: FlowView) {
  // - 顶层 record / sourceRecord 及其子字段
  // - 任意层级 parent.parent... 下的 record / sourceRecord 及其子字段
  const POPUP_SERVER_PATH_RE =
    /^(?:record|sourceRecord)(?:\.|$)|^parent(?:\.parent)*(?:\.(?:record|sourceRecord))(?:\.|$)/;
  // 始终注册 popup 变量：
  // - 若当前视图无可推断记录，仅在元信息中不呈现 record 字段；
  // - 但仍可依据 navigation 推断并展示上级弹窗信息。
  ctx.defineProperty('popup', {
    get: async () => buildPopupRuntime(ctx, view),
    meta: createPopupMeta(ctx, view),
    resolveOnServer: (p: string) => {
      try {
        return !!p && POPUP_SERVER_PATH_RE.test(p);
      } catch (_) {
        return false;
      }
    },
  });
}
