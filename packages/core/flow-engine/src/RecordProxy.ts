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
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        if (this.#associationCache.has(prop)) {
          return this.#associationCache.get(prop);
        }
        if (this.#pendingPromises.has(prop)) {
          return this.#pendingPromises.get(prop);
        }

        const field = this.#collection.getField(prop);
        if (!field || !field.isAssociationField()) {
          return undefined;
        }

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

              this.#associationCache.set(prop, data);
              this.#pendingPromises.delete(prop);
              resolve(data);
            } catch (error) {
              this.#pendingPromises.delete(prop);
              reject(error);
            }
          })();
        });

        this.#pendingPromises.set(prop, promise);
        return promise;
      },
    });
  }
}
