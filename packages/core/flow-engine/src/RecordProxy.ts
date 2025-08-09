/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection } from './data-source';
import type { FlowModelContext } from './flowContext';

/**
 * 路径收集器，用于收集属性访问路径并在 await 时执行请求
 */
class PathCollector {
  constructor(
    private recordProxy: RecordProxy,
    private path: string,
  ) {}

  // 支持 await - 实现 thenable 接口
  then(resolve?: any, reject?: any) {
    return this.recordProxy.executeRequest(this.path).then(resolve, reject);
  }

  catch(reject?: any) {
    return this.recordProxy.executeRequest(this.path).catch(reject);
  }

  finally(callback?: any) {
    return this.recordProxy.executeRequest(this.path).finally(callback);
  }
}

/**
 * RecordProxy 类
 *
 * 1. 使用 appends 参数批量获取关联数据，减少请求次数
 * 2. 延迟执行：在 await 时才发起请求
 * 3. 数据回填：将返回的数据合并到原始记录中
 * 4. 智能返回类型：根据关联链判断返回数组还是单个对象
 */
export class RecordProxy {
  /** 对多关系类型常量 */
  private static readonly TO_MANY_TYPES = ['hasMany', 'belongsToMany', 'belongsToArray'];

  /** Thenable 接口方法名 */
  private static readonly THENABLE_METHODS = ['then', 'catch', 'finally'];

  #recordOrFactory: any | (() => any);
  #collection: Collection;
  #ctx: FlowModelContext;
  #cache: Map<string, any> = new Map();
  #pendingPromises: Map<string, Promise<any>> = new Map();
  #resolvedTarget: any = null; // 缓存解析后的 target
  [key: string]: any;

  constructor(recordOrFactory: any | (() => any), collection: Collection, ctx: FlowModelContext) {
    this.#recordOrFactory = recordOrFactory;
    this.#collection = collection;
    this.#ctx = ctx;

    // 将方法绑定到实例，确保可以被访问
    const self = this;

    // 如果是静态值，立即创建代理；如果是函数，延迟到访问时处理
    const initialTarget = typeof recordOrFactory === 'function' ? {} : recordOrFactory;

    return new Proxy(initialTarget, {
      get: (target, prop: string, receiver) => {
        // constructor 直接返回proxy会导致 instance RecordProxy 失效
        // 因此添加 RecordProxy 标识符， 用于判断是否为 RcordProxy 实例
        if (prop === '__isRecordProxy__') {
          return true;
        }

        // 获取当前的实际 target
        const actualTarget = self.#getCurrentTarget();

        // 1. 检查是否是关联字段
        const field = self.#collection.getField(prop);
        if (field && field.isAssociationField()) {
          // 是关联字段，创建路径收集器，支持进一步的路径收集
          return self.#createPathCollector(prop);
        }

        // 2. 不是关联字段，返回目标对象上已有的属性
        if (prop in actualTarget) {
          return Reflect.get(actualTarget, prop, receiver);
        }

        // 3. 属性不存在
        return undefined;
      },
    });
  }

  /**
   * 获取当前的实际 target，如果是函数则执行它
   */
  #getCurrentTarget(): any {
    if (this.#resolvedTarget === null) {
      if (typeof this.#recordOrFactory === 'function') {
        this.#resolvedTarget = this.#recordOrFactory();
      } else {
        this.#resolvedTarget = this.#recordOrFactory;
      }
    }
    return this.#resolvedTarget;
  }

  /**
   * 创建路径收集器
   */
  #createPathCollector(path: string): any {
    const collector = new PathCollector(this, path);

    // 检查数据是否已存在
    const actualTarget = this.#getCurrentTarget();
    const existingData = this.#getNestedValue(actualTarget, path.split('.'));

    // 创建一个代理，结合已存在的数据和路径收集功能
    const proxyTarget = existingData || collector;

    return new Proxy(proxyTarget, {
      get: (target, prop: string) => {
        // 如果是 thenable 相关方法，返回 collector 的方法
        if (RecordProxy.THENABLE_METHODS.includes(prop as string)) {
          return collector[prop].bind(collector);
        }

        // 如果是数组/对象的内置方法或属性，且数据已存在
        if (existingData && (prop in existingData || typeof existingData[prop] !== 'undefined')) {
          const value = existingData[prop];
          // 如果是方法，绑定正确的this
          if (typeof value === 'function') {
            return value.bind(existingData);
          }
          return value;
        }

        // 如果是其他属性访问，需要判断是否为关联字段
        // 如果不是关联字段，应该从当前路径获取数据后提取属性
        const pathParts = path.split('.');
        const { targetCollection } = this.#analyzePath(pathParts);
        const field = targetCollection?.getField(prop);

        if (field && field.isAssociationField()) {
          // 是关联字段，继续收集路径
          const newPath = `${path}.${prop}`;
          return this.#createPathCollector(newPath);
        } else {
          // 不是关联字段，从当前路径的数据中提取属性
          // 创建一个特殊的collector，它会请求当前路径，然后提取属性
          return this.#createPropertyExtractor(path, prop);
        }
      },

      // 支持数组的迭代等操作
      has: (target, prop) => {
        return existingData ? prop in existingData : false;
      },

      ownKeys: (target) => {
        return existingData ? Reflect.ownKeys(existingData) : [];
      },

      getOwnPropertyDescriptor: (target, prop) => {
        return existingData ? Reflect.getOwnPropertyDescriptor(existingData, prop) : undefined;
      },
    });
  }

  /**
   * 分析路径信息，一次遍历获取所有需要的信息
   */
  #analyzePath(pathParts: string[]) {
    const toManyPositions: number[] = [];
    let hasToManyRelation = false;
    let currentCollection = this.#collection;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const field = currentCollection.getField(part);

      if (!field || !field.isAssociationField()) {
        // 遇到非关联字段，返回当前collection
        return {
          targetCollection: currentCollection,
          hasToManyRelation,
          toManyPositions,
        };
      }

      // 检查是否为对多关系
      if (RecordProxy.TO_MANY_TYPES.includes(field.type)) {
        hasToManyRelation = true;
        toManyPositions.push(i);
      }

      // 移动到下一个collection
      currentCollection = field.targetCollection;
      if (!currentCollection) {
        return {
          targetCollection: null,
          hasToManyRelation,
          toManyPositions,
        };
      }
    }

    return {
      targetCollection: currentCollection,
      hasToManyRelation,
      toManyPositions,
    };
  }

  /**
   * 创建属性提取器，请求路径数据后提取指定属性
   */
  #createPropertyExtractor(path: string, property: string): any {
    const extractor = {
      then: (resolve?: any, reject?: any) => {
        return this.#executeRequest(path)
          .then((data) => {
            if (Array.isArray(data)) {
              // 如果是数组，首先检查是否为数组的内置属性
              if (property in data || typeof data[property] !== 'undefined') {
                // 数组的内置属性（如length）或方法，直接从数组对象获取
                resolve(data[property]);
              } else {
                // 否则从每个元素中提取属性，过滤掉undefined
                const result = data
                  .map((item) => item && item[property])
                  .filter((value) => value !== undefined && value !== null);
                resolve(result);
              }
            } else if (this.#isValidObject(data)) {
              // 如果是对象，直接提取属性
              resolve(data[property]);
            } else {
              resolve(undefined);
            }
          })
          .catch(reject);
      },
      catch: (reject?: any) => {
        return this.#executeRequest(path).catch(reject);
      },
      finally: (callback?: any) => {
        return this.#executeRequest(path).finally(callback);
      },
    };

    return extractor;
  }

  /**
   * 检查值是否为有效对象（非null、非数组的对象）
   */
  #isValidObject(value: any): boolean {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * 检查数组是否有主键字段
   */
  #arrayHasPrimaryKey(array: any[], primaryKey: string): boolean {
    return array.length > 0 && array.every((item) => item && typeof item === 'object' && primaryKey in item);
  }

  /**
   * 执行请求的公共接口，供PathCollector调用
   */
  executeRequest(path: string): Promise<any> {
    return this.#executeRequest(path);
  }

  /**
   * 执行请求获取关联数据
   */
  async #executeRequest(path: string): Promise<any> {
    // 检查缓存
    if (this.#cache.has(path)) {
      return this.#cache.get(path);
    }

    // 检查正在进行的请求
    if (this.#pendingPromises.has(path)) {
      return this.#pendingPromises.get(path);
    }

    // 创建新的请求
    const promise = this.#performRequest(path);
    this.#pendingPromises.set(path, promise);

    try {
      const result = await promise;
      this.#cache.set(path, result);
      this.#pendingPromises.delete(path);
      return result;
    } catch (error) {
      this.#pendingPromises.delete(path);
      throw error;
    }
  }

  /**
   * 执行实际的API请求
   */
  async #performRequest(path: string): Promise<any> {
    // 在发起请求前获取实际的 target（如果是函数则执行）
    const actualTarget = this.#getCurrentTarget();

    // 构建请求参数
    const requestParams = {
      filterByTk: actualTarget[this.#collection.filterTargetKey || 'id'],
      appends: [path],
    };

    // 发起请求
    const { data } = await this.#ctx.api.request({
      method: 'post',
      url: `${this.#collection.name}:get`,
      params: requestParams,
    });

    const responseData = data?.data;
    if (!responseData) {
      return null;
    }

    // 将返回的数据合并到实际的记录中
    this.#mergeData(responseData);

    // 根据路径提取并返回目标数据
    return this.#extractTargetData(responseData, path);
  }

  /**
   * 深度合并API返回的数据到原始记录中
   */
  #mergeData(responseData: any) {
    const actualTarget = this.#getCurrentTarget();
    this.#deepMerge(actualTarget, responseData);
  }

  /**
   * 深度合并对象，特别处理数组关联数据
   */
  #deepMerge(target: any, source: any, parentCollection?: Collection) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (sourceValue === null || sourceValue === undefined) {
          target[key] = sourceValue;
        } else if (Array.isArray(sourceValue)) {
          // 数组处理：获取关联字段的目标collection主键
          const currentCollection = parentCollection || this.#collection;
          const field = currentCollection.getField(key);
          const targetCollection = field?.targetCollection;
          const primaryKey = targetCollection?.filterTargetKey || 'id';

          if (Array.isArray(targetValue)) {
            target[key] = this.#mergeArrays(targetValue, sourceValue, primaryKey, targetCollection);
          } else {
            target[key] = sourceValue;
          }
        } else if (this.#isValidObject(sourceValue)) {
          // 对象处理：递归深度合并，传递当前字段的目标collection
          if (this.#isValidObject(targetValue)) {
            const currentCollection = parentCollection || this.#collection;
            const field = currentCollection.getField(key);
            const targetCollection = field?.targetCollection;
            this.#deepMerge(targetValue, sourceValue, targetCollection);
          } else {
            target[key] = sourceValue;
          }
        } else {
          // 基本类型：直接覆盖
          target[key] = sourceValue;
        }
      }
    }
  }

  /**
   * 合并数组，尽量保留已有数据
   */
  #mergeArrays(target: any[], source: any[], primaryKey = 'id', elementCollection?: Collection): any[] {
    if (!target.length || !source.length) {
      return source;
    }

    // 检查数组元素是否有主键字段
    const hasPrimaryKey = this.#arrayHasPrimaryKey(target, primaryKey) && this.#arrayHasPrimaryKey(source, primaryKey);

    if (hasPrimaryKey) {
      const merged = [...target];

      for (const sourceItem of source) {
        const existingIndex = merged.findIndex((item) => item[primaryKey] === sourceItem[primaryKey]);
        if (existingIndex >= 0) {
          // 存在相同主键，深度合并，传递数组元素对应的collection
          this.#deepMerge(merged[existingIndex], sourceItem, elementCollection);
        } else {
          // 新元素，直接添加
          merged.push(sourceItem);
        }
      }
      return merged;
    }

    // 没有主键或不是对象数组，直接替换
    return source;
  }

  /**
   * 根据路径提取目标数据，并判断返回类型
   */
  #extractTargetData(data: any, path: string): any {
    const pathParts = path.split('.');
    const { hasToManyRelation, toManyPositions } = this.#analyzePath(pathParts);

    // 根据是否有对多关系决定返回格式
    if (hasToManyRelation) {
      return this.#processToManyResult(data, pathParts, toManyPositions);
    } else {
      return this.#getNestedValue(data, pathParts);
    }
  }

  /**
   * 处理包含对多关系的结果
   */
  #processToManyResult(data: any, pathParts: string[], toManyPositions: number[]): any[] {
    // 从数据开始，逐步处理每个路径部分
    let currentData = data;
    const toManySet = new Set(toManyPositions);

    for (let i = 0; i < pathParts.length; i++) {
      const prop = pathParts[i];
      const isToMany = toManySet.has(i);

      if (!currentData) {
        return [];
      }

      if (isToMany) {
        // 对多关系
        if (Array.isArray(currentData)) {
          // 当前数据已经是数组，展开后提取属性
          currentData = currentData.map((item) => item && item[prop]).filter(Boolean);
          if (currentData.length > 0 && Array.isArray(currentData[0])) {
            currentData = currentData.flat();
          }
        } else {
          // 第一次遇到对多关系
          currentData = currentData[prop];
          if (!Array.isArray(currentData)) {
            currentData = currentData ? [currentData] : [];
          }
        }
      } else {
        // 对一关系
        if (Array.isArray(currentData)) {
          // 从数组中的每个元素提取属性
          currentData = currentData.map((item) => item && item[prop]).filter(Boolean);
        } else {
          currentData = currentData[prop];
        }
      }
    }

    return Array.isArray(currentData) ? currentData : currentData ? [currentData] : [];
  }

  /**
   * 获取嵌套路径的值
   */
  #getNestedValue(obj: any, pathParts: string[]): any {
    let current = obj;
    for (const part of pathParts) {
      if (this.#isValidObject(current) || Array.isArray(current)) {
        current = current[part];
      } else {
        return null;
      }
    }
    return current;
  }
}
