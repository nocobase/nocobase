/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
