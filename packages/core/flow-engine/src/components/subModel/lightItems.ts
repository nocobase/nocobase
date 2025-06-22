/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SubModelItem } from './AddSubModelButton';

interface LightComponentData {
  key: string;
  title: string;
  description?: string;
  template?: string;
  flows?: string[];
}

/**
 * 创建轻量组件的菜单项，用于 AddBlockButton 的 appendItems
 *
 * 返回二级菜单结构：
 * - 一级：轻量组件 (group)
 * - 二级：具体的轻量组件列表
 */
export const createLightComponentItems = async (ctx: any): Promise<SubModelItem[]> => {
  try {
    // 1. 请求轻量组件的 API
    const apiClient = ctx.globals?.api;
    if (!apiClient) {
      console.warn('API client not available');
      return [];
    }

    const response = await apiClient.resource('lightComponents').list({
      pageSize: 100, // 获取前100个组件
      sort: ['title'], // 按标题排序
    });

    const lightComponents: LightComponentData[] = response.data?.data || [];

    if (lightComponents.length === 0) {
      return [];
    }

    // 2. 创建二级菜单结构
    const lightComponentChildren: SubModelItem[] = lightComponents.map((component) => ({
      key: `light-component-${component.key}`,
      label: component.title,
      icon: '📦', // 轻量组件图标
      createModelOptions: () => {
        // 3. 先执行 flows 代码收集 flow definitions
        const flowDefinitions: any[] = [];
        if (component.flows && component.flows.length > 0) {
          component.flows.forEach((flowCode) => {
            if (flowCode.trim()) {
              try {
                const func = new Function(flowCode);
                const result = func();
                if (result) {
                  flowDefinitions.push(result);
                }
              } catch (error) {
                console.error('Flow code execution error:', error);
              }
            }
          });
        }

        // 4. 动态注册扩展的模型
        const modelName = `LightComponent_${component.key}`;

        // 延迟注册模型（在实际创建时进行）
        // 检查是否已经注册过
        if (!ctx.model.flowEngine.getModelClass(modelName)) {
          // 获取 LightModel 类
          const LightModel = ctx.model.flowEngine.getModelClass('LightModel');
          if (LightModel) {
            // 使用 extends 方法创建扩展模型
            const ExtendedLightModel = (LightModel as any).extends(flowDefinitions);
            ExtendedLightModel.name = modelName;

            // 注册到 flowEngine
            ctx.model.flowEngine.registerModels({
              [modelName]: ExtendedLightModel,
            });
          }
        }

        // 5. 返回创建配置
        return {
          use: modelName, // 使用扩展后的模型
          props: {
            // 传递组件数据作为 stepParams
            lightComponentKey: component.key,
            lightComponentData: component,
            componentKey: component.key,
            template: component.template || '',
            title: component.title || 'Light Component',
          },
        };
      },
    }));

    // 4. 返回多级菜单："轻量组件" -> 具体组件列表
    return [
      {
        key: 'light-components-menu',
        label: '轻量组件',
        icon: '⚡',
        children: lightComponentChildren, // 直接作为子菜单，不使用 group
      },
    ];
  } catch (error) {
    console.error('Failed to load light components:', error);
    return [
      {
        key: 'light-components-error',
        label: '轻量组件加载失败',
        disabled: true,
      },
    ];
  }
};

/**
 * 创建增强版的轻量组件菜单项，使用动态扩展的 PreviewLightModel
 *
 * 这个版本会执行组件的 flows 代码并创建扩展的模型
 */
export const createEnhancedLightComponentItems = async (ctx: any): Promise<SubModelItem[]> => {
  try {
    const apiClient = ctx.globals?.api;
    if (!apiClient) {
      console.warn('API client not available');
      return [];
    }

    const response = await apiClient.resource('lightComponents').list({
      pageSize: 100,
      sort: ['title'],
    });

    const lightComponents: LightComponentData[] = response.data?.data || [];

    if (lightComponents.length === 0) {
      return [];
    }

    const lightComponentChildren: SubModelItem[] = lightComponents.map((component) => ({
      key: `light-component-enhanced-${component.key}`,
      label: component.title,
      icon: '🔥', // 增强版使用不同图标
      createModelOptions: () => {
        // 增强版：执行完整的扩展逻辑
        const flowDefinitions: any[] = [];
        if (component.flows && component.flows.length > 0) {
          component.flows.forEach((flowCode) => {
            if (flowCode.trim()) {
              try {
                const func = new Function(flowCode);
                const result = func();
                if (result) {
                  flowDefinitions.push(result);
                }
              } catch (error) {
                console.error('Enhanced flow code execution error:', error);
              }
            }
          });
        }

        const modelName = `EnhancedLightComponent_${component.key}`;

        setTimeout(() => {
          if (!ctx.model.flowEngine.getModelClass(modelName)) {
            const LightModel = ctx.model.flowEngine.getModelClass('LightModel');
            if (LightModel) {
              const ExtendedLightModel = (LightModel as any).extends(flowDefinitions);
              ExtendedLightModel.name = modelName;

              ctx.model.flowEngine.registerModels({
                [modelName]: ExtendedLightModel,
              });
            }
          }
        }, 0);

        return {
          use: modelName,
          stepParams: {
            lightComponentKey: component.key,
            lightComponentData: component,
            componentKey: component.key,
            template: component.template || '',
            title: component.title || 'Light Component',
            enhanced: true, // 标记为增强版
          },
        };
      },
    }));

    return [
      {
        type: 'divider',
      },
      {
        key: 'enhanced-light-components-menu',
        label: '轻量组件 (增强版)',
        icon: '⚡',
        children: lightComponentChildren, // 直接作为子菜单，不使用 group
      },
    ];
  } catch (error) {
    console.error('Failed to load enhanced light components:', error);
    return [
      {
        key: 'enhanced-light-components-error',
        label: '增强轻量组件加载失败',
        disabled: true,
      },
    ];
  }
};
