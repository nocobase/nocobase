/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Set runtime context data for AI skills.
 * Call this when triggering AI employee from a block context.
 *
 * @param api - APIClient instance
 * @param ctx - FlowContext with getInfos method
 */
export async function setRuntimeContext(api: any, ctx: any): Promise<boolean> {
  try {
    if (typeof ctx?.getInfos !== 'function') {
      return false;
    }

    const contextData = await ctx.getInfos();
    if (!contextData) {
      return false;
    }

    await api.request({
      url: 'ai:setRuntimeContext',
      method: 'post',
      data: {
        apis: contextData.apis,
        envs: contextData.envs,
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to set runtime context:', error);
    return false;
  }
}
