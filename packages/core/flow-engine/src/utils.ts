/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type { ISchema } from '@formily/json-schema';
import type { FlowModel } from './models';
import { ActionDefinition, DeepPartial, FlowContext, FlowDefinition, ModelConstructor, ParamsContext } from './types';

export function generateUid(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * 合并两个流程定义
 * 用于处理流程的部分覆盖（patch）场景
 *
 * @param originalFlow 原始流程定义
 * @param patchFlow 覆盖流程定义
 * @returns 合并后的流程定义
 */
export function mergeFlowDefinitions(
  originalFlow: FlowDefinition,
  patchFlow: DeepPartial<FlowDefinition>,
): FlowDefinition {
  // 创建新的流程定义，合并原始流程和覆盖配置
  const flow = _.cloneDeep(originalFlow);
  const mergedFlow = {
    ...flow,
    title: patchFlow.title ?? flow.title,
    ...(patchFlow.on && { on: patchFlow.on as { eventName: string } }),
    ...flow.steps,
  } as FlowDefinition;

  // 覆盖特定步骤
  if (patchFlow.steps) {
    Object.entries(patchFlow.steps).forEach(([stepKey, stepDefinition]) => {
      mergedFlow.steps[stepKey] = _.merge(flow.steps[stepKey], stepDefinition);
    });
  }

  return mergedFlow;
}

/**
 * 检查一个类是否继承自指定的父类（支持多层继承）
 * @param {ModelConstructor} childClass 要检查的子类
 * @param {ModelConstructor} parentClass 父类
 * @returns {boolean} 如果子类继承自父类则返回 true
 */
export function isInheritedFrom(childClass: ModelConstructor, parentClass: ModelConstructor): boolean {
  // 如果是同一个类，返回 false（不包括自身）
  if (childClass === parentClass) {
    return false;
  }

  // 检查直接继承
  if (childClass.prototype instanceof parentClass) {
    return true;
  }

  // 递归检查原型链
  let currentProto = Object.getPrototypeOf(childClass.prototype);
  while (currentProto && currentProto !== Object.prototype) {
    if (currentProto.constructor === parentClass) {
      return true;
    }
    currentProto = Object.getPrototypeOf(currentProto);
  }

  return false;
}

/**
 * 解析 defaultParams，支持静态值和函数形式
 * 函数可以接收 ParamsContext（在 settings 中）或 FlowContext（在 applyFlow 中）
 * @param {Record<string, any> | ((ctx: any) => Record<string, any> | Promise<Record<string, any>>)} defaultParams 默认参数
 * @param {ParamsContext<TModel>} ctx 上下文
 * @returns {Promise<Record<string, any>>} 解析后的参数对象
 */
export async function resolveDefaultParams<TModel extends FlowModel = FlowModel>(
  defaultParams: Record<string, any> | ((ctx: any) => Record<string, any> | Promise<Record<string, any>>) | undefined,
  ctx: ParamsContext<TModel>,
): Promise<Record<string, any>> {
  if (!defaultParams) {
    return {};
  }

  if (typeof defaultParams === 'function') {
    try {
      const result = await defaultParams(ctx);
      return result || {};
    } catch (error) {
      console.error('Error resolving defaultParams function:', error);
      return {};
    }
  }

  return defaultParams;
}

/**
 * 解析 uiSchema，支持静态值和函数形式
 * 函数可以接收 ParamsContext（在 settings 中）
 * @param {Record<string, ISchema> | ((ctx: ParamsContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)} uiSchema UI Schema 定义
 * @param {ParamsContext<TModel>} ctx 上下文
 * @returns {Promise<Record<string, ISchema>>} 解析后的 UI Schema 对象
 */
export async function resolveUiSchema<TModel extends FlowModel = FlowModel>(
  uiSchema:
    | Record<string, ISchema>
    | ((ctx: ParamsContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)
    | undefined,
  ctx: ParamsContext<TModel>,
): Promise<Record<string, ISchema>> {
  if (!uiSchema) {
    return {};
  }

  if (typeof uiSchema === 'function') {
    try {
      const result = await uiSchema(ctx);
      return result || {};
    } catch (error) {
      console.error('Error resolving uiSchema function:', error);
      return {};
    }
  }

  return uiSchema;
}

/**
 * 流程正常退出异常类
 * 用于标识通过 ctx.exit() 正常退出的情况
 */
export class FlowExitException extends Error {
  public readonly flowKey: string;
  public readonly modelUid: string;

  constructor(flowKey: string, modelUid: string, message?: string) {
    super(message || `Flow '${flowKey}' on model '${modelUid}' exited via ctx.exit().`);
    this.name = 'FlowExitException';
    this.flowKey = flowKey;
    this.modelUid = modelUid;
  }
}

export function defineAction(options: ActionDefinition) {
  return options;
}

/**
 * 翻译工具类，负责模板编译和缓存管理
 */
export class TranslationUtil {
  /** @private Simple template cache - template string -> compiled result */
  private _templateCache = new Map<string, string>();

  /**
   * 翻译函数，支持简单翻译和模板编译
   * @param keyOrTemplate 翻译键或包含 {{t('key', options)}} 的模板字符串
   * @param translator 翻译函数，通常是 i18n.t
   * @param options 翻译选项（如命名空间、参数等）
   * @returns 翻译后的文本
   */
  public translate(keyOrTemplate: string, translator: (key: string, options?: any) => string, options?: any): string {
    if (!keyOrTemplate || typeof keyOrTemplate !== 'string') {
      return keyOrTemplate;
    }

    // 检查是否包含模板语法 {{t('...')}}
    const hasTemplate = this.isTemplate(keyOrTemplate);

    if (hasTemplate) {
      // 模板编译模式 - 简单缓存
      if (this._templateCache.has(keyOrTemplate)) {
        return this._templateCache.get(keyOrTemplate)!;
      }

      // 解析模板
      const result = this.compileTemplate(keyOrTemplate, translator);

      // 简单缓存：直接存储
      this._templateCache.set(keyOrTemplate, result);
      return result;
    } else {
      // 简单翻译模式 - 直接调用翻译函数
      return translator(keyOrTemplate, options);
    }
  }

  /**
   * 检查字符串是否包含模板语法
   * @private
   */
  private isTemplate(str: string): boolean {
    return /\{\{\s*t\s*\(\s*["'`].*?["'`]\s*(?:,\s*.*?)?\s*\)\s*\}\}/g.test(str);
  }

  /**
   * 编译模板字符串
   * @private
   */
  private compileTemplate(template: string, translator: (key: string, options?: any) => string): string {
    return template.replace(
      /\{\{\s*t\s*\(\s*["'`](.*?)["'`]\s*(?:,\s*((?:[^{}]|\{[^}]*\})*))?\s*\)\s*\}\}/g,
      (match, key, optionsStr) => {
        try {
          let templateOptions = {};
          if (optionsStr) {
            optionsStr = optionsStr.trim();
            if (optionsStr.startsWith('{') && optionsStr.endsWith('}')) {
              try {
                templateOptions = JSON.parse(optionsStr);
              } catch (jsonError) {
                // JSON 解析失败，返回原始匹配字符串
                return match;
              }
            }
          }
          return translator(key, templateOptions);
        } catch (error) {
          console.warn(`TranslationUtil: Failed to compile template "${match}":`, error);
          return match;
        }
      },
    );
  }

  /**
   * 清空模板缓存
   */
  public clearCache(): void {
    this._templateCache.clear();
  }

  /**
   * 获取缓存大小
   */
  public getCacheSize(): number {
    return this._templateCache.size;
  }
}
