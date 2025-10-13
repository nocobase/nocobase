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
 * Create a meta factory for ctx.view that includes:
 * - buildVariablesParams: { record } via inferRecordRef
 * - properties.record: full collection meta via buildRecordMeta
 * - type/preventClose/inputArgs/navigation fields for better variable selection UX
 */
export function createViewMeta(ctx: FlowContext): PropertyMetaFactory {
  const viewTitle = ctx.t('当前视图');
  const factory: PropertyMetaFactory = async () => {
    const view = ctx.view;
    return {
      type: 'object',
      title: ctx.t('当前视图'),
      buildVariablesParams: (c) => {
        const params = inferViewRecordRef(c);
        if (params) {
          return {
            record: params,
          };
        }
        return undefined;
      },
      properties: async () => {
        const props: Record<string, any> = {};
        // 仅当能推断到当前记录引用时，才暴露“当前视图记录”，避免出现空子菜单
        const refNow = inferViewRecordRef(ctx);
        if (refNow && refNow.collection) {
          const recordFactory: PropertyMetaFactory = async () => {
            try {
              const ref = inferViewRecordRef(ctx);
              if (!ref?.collection) return null;
              const dsKey = ref.dataSourceKey || 'main';
              const ds = ctx.dataSourceManager?.getDataSource?.(dsKey);
              const col = ds?.collectionManager?.getCollection?.(ref.collection);
              if (!col) return null;
              return (await buildRecordMeta(
                () => col,
                ctx.t('当前视图记录'),
                (c) => inferViewRecordRef(c),
              )) as PropertyMeta;
            } catch (e) {
              return null;
            }
          };
          recordFactory.title = ctx.t('当前视图记录');
          recordFactory.hasChildren = true;
          props.record = recordFactory;
        }
        props.type = { type: 'string', title: ctx.t?.('类型') || '类型' };
        props.preventClose = { type: 'boolean', title: ctx.t?.('是否允许关闭') || '是否允许关闭' };
        props.inputArgs = makeMetaFromValue(view?.inputArgs, ctx.t?.('输入参数') || '输入参数');
        return props;
      },
    } as PropertyMeta;
  };
  // 设置工厂函数的 title，让未加载前的占位标题就是“当前视图”
  factory.title = viewTitle;
  return factory;
}

/**
 * 为 ctx.popup 构建元信息：
 * - popup.record：当前弹窗记录（服务端解析）
 * - popup.resource：数据源信息（前端解析）
 * - popup.parent：上级弹窗（无限级，前端解析；不存在则禁用/为空）
 */
export function createPopupMeta(ctx: FlowContext): PropertyMetaFactory {
  const t = (k: string) => ctx.t(k);

  const getCurrentCollection = (): Collection | null => {
    try {
      const ref = inferViewRecordRef(ctx);
      if (!ref?.filterByTk) return null;
      const ds = ctx.dataSourceManager?.getDataSource?.(ref.dataSourceKey || 'main');
      return ds?.collectionManager?.getCollection?.(ref.collection) || null;
    } catch (_) {
      return null;
    }
  };

  // 从视图堆栈推断 level 级父弹窗（level=1 上一层）
  const getParentRecordRef = async (level: number): Promise<RecordRef | undefined> => {
    try {
      const nav = ctx.view?.navigation;
      const stack = Array.isArray(nav?.viewStack) ? nav.viewStack : [];
      if (stack.length < 2 || level < 1) return undefined;
      const idx = stack.length - 1 - level;
      if (idx < 0) return undefined;
      const parent = stack[idx];
      if (!parent?.viewUid) return undefined;

      let model: any = ctx.engine?.getModel?.(parent.viewUid);
      if (!model && typeof ctx.engine?.loadModel === 'function') {
        try {
          model = await ctx.engine.loadModel({ uid: parent.viewUid });
        } catch (e) {
          console.warn('[FlowEngine] popup.getParentRecordRef loadModel failed:', e);
        }
      }
      const params = model?.getStepParams?.('popupSettings', 'openView') || {};
      const collection = params?.collectionName;
      const dataSourceKey = params?.dataSourceKey || 'main';
      const filterByTk = parent?.filterByTk ?? parent?.sourceId;
      if (!collection || typeof filterByTk === 'undefined' || filterByTk === null) return undefined;
      return { collection, dataSourceKey, filterByTk };
    } catch (e) {
      console.warn('[FlowEngine] popup.getParentRecordRef failed:', e);
      return undefined;
    }
  };

  const hasParentNow = (level: number): boolean => {
    try {
      const nav = ctx.view?.navigation;
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
        properties: async () => {
          const parentRef = await getParentRecordRef(level);
          const props: Record<string, any> = {};

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
      buildVariablesParams: (c) => {
        const ref = inferViewRecordRef(c);
        return { record: ref };
      },
      properties: async () => {
        const props: Record<string, any> = {};
        const base = await buildRecordMeta(getCurrentCollection, t('Current popup record'), (c) =>
          inferViewRecordRef(c),
        );
        if (base) props.record = base;
        const resourceMeta: PropertyMeta = {
          type: 'object',
          title: t('Data source'),
          properties: async () => ({
            dataSourceKey: { type: 'string', title: t('Data source key') },
            collectionName: { type: 'string', title: t('Collection name') },
            filterByTk: { type: 'string', title: t('filterByTk') },
            sourceId: { type: 'string', title: t('sourceId') },
          }),
        };
        props.resource = resourceMeta;
        // 配置态弹窗不展示“上级弹窗”；
        // 仅在上一层确为弹窗（可推断 RecordRef）时显示
        const isSettings = !!ctx.view?.inputArgs?.__isSettingsPopup;
        const parentRef1 = isSettings ? undefined : await getParentRecordRef(1);
        if (!isSettings && parentRef1) {
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
  filterByTk?: any;
  sourceId?: any;
}

interface PopupNode {
  resource: PopupNodeResource;
  parent?: PopupNode;
}

export async function buildPopupRuntime(ctx: FlowContext, view: FlowView): Promise<PopupNode> {
  const nav = view?.navigation;
  const stack = Array.isArray(nav?.viewStack) ? nav.viewStack : [];
  const buildNode = async (idx: number): Promise<PopupNode | undefined> => {
    if (idx < 0 || !stack[idx]?.viewUid) return undefined;
    const viewUid = stack[idx].viewUid;
    let model: any = ctx.engine?.getModel?.(viewUid);
    if (!model && typeof ctx.engine?.loadModel === 'function') {
      model = await ctx.engine?.loadModel({ uid: viewUid });
    }
    const p = model?.getStepParams?.('popupSettings', 'openView') || {};
    const collectionName = p?.collectionName;
    const dataSourceKey = p?.dataSourceKey || 'main';
    const node: PopupNode = {
      resource: {
        dataSourceKey,
        collectionName,
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
  // 仅在当前视图可推断到记录引用（确为弹窗上下文或由 openView 打开的 embed）时注册
  const refNow = inferViewRecordRef(ctx);
  if (!refNow) return;
  ctx.defineProperty('popup', {
    get: async () => buildPopupRuntime(ctx, view),
    meta: createPopupMeta(ctx),
    resolveOnServer: (p: string) => p === 'record' || p?.startsWith('record.'),
  });
}
