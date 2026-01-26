/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Runtime context information structure from ctx.getInfos()
 */
export interface RuntimeContextInfo {
  apis?: Record<string, any>;
  envs?: Record<string, any>;
}

/**
 * Manages runtime context data for AI agents
 */
export class SkillManager {
  private contextData: RuntimeContextInfo | null = null;

  /**
   * Set runtime context data from frontend
   */
  setContextData(data: RuntimeContextInfo) {
    this.contextData = data;
  }

  /**
   * Get runtime context data
   */
  getContextData(): RuntimeContextInfo | null {
    return this.contextData;
  }

  /**
   * Clear context data
   */
  clearContextData() {
    this.contextData = null;
  }
}
