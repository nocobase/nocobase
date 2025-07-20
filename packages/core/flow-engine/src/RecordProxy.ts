/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SingleRecordResource, MultiRecordResource } from './resources';
import type { Collection } from './data-source';
import type { FlowModelContext } from './flowContext';

/**
 * 创建一个支持链式属性访问的 Promise 代理。
 *
 * **存在原因**:
 * 标准 Promise 不支持 `await promise.prop1.prop2` 这样的语法，因为在 promise 解析完成前，访问 `.prop1` 会立即得到 `undefined`。
 *
 * **实现原理**:
 * 此函数返回一个特殊的 Proxy 对象，它同时具备两种能力：
 * 1. **Thenable**: 它可以被 `await`。当 `await` 作用于它时，Proxy 会返回原始 Promise 的 `.then` 方法，从而兼容异步等待。
 * 2. **Chainable**: 当访问任意其他属性（如 `.prop1`）时，它会返回一个新的、同样被包装的 Promise。这个新的 Promise 会等待上一个 Promise 解析完成，然后在其结果上访问 `prop1` 属性。
 *
 * @param {Promise} promise 原始的 Promise 对象。
 * @returns 一个可链式调用的 Promise 代理。
 */
function createChainablePromise(promise) {
  // 代理原始 promise 的 then, catch, finally 方法，使其行为与普通 Promise 一致。
  const then = promise.then.bind(promise);
  const catchFn = promise.catch.bind(promise);
  const finallyFn = promise.finally.bind(promise);

  return new Proxy(
    {},
    {
      get(target, prop: string) {
        // 当 await 操作（访问 then）或 .catch/.finally 时，返回原始 Promise 的相应方法。
        if (prop === 'then') return then;
        if (prop === 'catch') return catchFn;
        if (prop === 'finally') return finallyFn;

        // 对于其他属性访问（如 .author, .profile），创建一个新的 Promise 链。
        const newPromise = promise.then((resolved) => {
          if (resolved === null || resolved === undefined) {
            // 如果上层 promise 的结果是 null 或 undefined（例如，文章没有作者），
            // 那么继续访问任何属性都应该安全地返回 undefined，而不是抛出错误。
            return undefined;
          }
          // 在上层 promise 解析后的结果上，访问当前属性。
          // `resolved` 本身也可能是一个 RecordProxy，因此 `resolved[prop]` 会触发下一轮的异步加载。
          return resolved[prop];
        });

        // 递归调用，将新生成的 Promise 也包装成可链式调用的代理，以支持更深层级的访问。
        return createChainablePromise(newPromise);
      },
    },
  );
}

/**
 * 一个代理类，它增强了一个普通的记录对象，使其能够延迟加载其关联关系。
 * 当首次访问关联属性时，它会触发一个 API 请求来获取数据。
 * 后续的访问将返回缓存的数据。
 *
 * @example
 * // 在流程步骤的处理函数中
 * const handler = async (ctx) => {
 *   const proxyRecord = new RecordProxy(ctx.record, ctx.collection, ctx);
 *   const author = await proxyRecord.author; // 首次访问时获取作者信息
 *   console.log(author.name);
 * };
 */
export class RecordProxy {
  /** 原始的普通记录对象。 */
  #target: any;
  #collection: Collection;
  #ctx: FlowModelContext;
  /** 缓存已经加载的关联数据。 */
  #associationCache: Map<string, any> = new Map();
  /** 存储正在进行中的关联请求的 Promise，以防止重复请求。 */
  #pendingPromises: Map<string, Promise<any>> = new Map();
  [key: string]: any; // 允许动态属性访问

  /**
   * 创建 RecordProxy 的实例。
   * @param {any} record 要被代理的普通记录对象。
   * @param {Collection} collection 记录所属的集合。
   * @param {FlowModelContext} ctx 上下文，提供对 API 客户端和其他服务的访问。
   */
  constructor(record: any, collection: Collection, ctx: FlowModelContext) {
    this.#target = record;
    this.#collection = collection;
    this.#ctx = ctx;

    return new Proxy(this.#target, {
      get: (target, prop: string, receiver) => {
        // 1. 优先返回目标对象上已有的属性
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }

        // 2. 检查是否是关联字段
        const field = this.#collection.getField(prop);
        if (!field || !field.isAssociationField()) {
          return undefined;
        }

        // 3. 是关联字段。必须返回一个可链式调用的 promise。
        // 这个 promise 将从缓存或新的请求中解析数据。

        // 首先检查缓存。
        if (this.#associationCache.has(prop)) {
          const cachedData = this.#associationCache.get(prop);
          return createChainablePromise(Promise.resolve(cachedData));
        }

        // 检查正在进行的请求。
        if (this.#pendingPromises.has(prop)) {
          return createChainablePromise(this.#pendingPromises.get(prop));
        }

        // 没有缓存，也没有正在进行的请求。创建一个新的 fetch promise。
        const promise = new Promise((resolve, reject) => {
          (async () => {
            try {
              const isToMany = ['hasMany', 'belongsToMany', 'belongsToArray'].includes(field.type);
              const resource = isToMany ? new MultiRecordResource() : new SingleRecordResource();

              resource.setAPIClient(this.#ctx.api);
              resource.setResourceName(`${this.#collection.name}.${prop}`);
              resource.setSourceId(target[this.#collection.filterTargetKey || 'id']);

              await resource.refresh();
              const data = resource.getData();

              let result;
              const associationCollection = field.targetCollection; // 获取关联记录的集合

              if (associationCollection) {
                if (Array.isArray(data)) {
                  // 如果结果是数组，将每个项目包装在新的 RecordProxy 中
                  result = data.map((item) => new RecordProxy(item, associationCollection, this.#ctx));
                } else if (data) {
                  // 如果是单个对象，包装它
                  result = new RecordProxy(data, associationCollection, this.#ctx);
                } else {
                  // 如果数据是 null 或 undefined，则原样返回
                  result = data;
                }
              } else {
                // 如果无法确定目标集合，则回退
                result = data;
              }

              this.#associationCache.set(prop, result); // 缓存最终解析的 RecordProxy
              this.#pendingPromises.delete(prop);
              resolve(result);
            } catch (error) {
              this.#pendingPromises.delete(prop);
              reject(error);
            }
          })();
        });

        this.#pendingPromises.set(prop, promise);
        return createChainablePromise(promise);
      },
    });
  }
}
