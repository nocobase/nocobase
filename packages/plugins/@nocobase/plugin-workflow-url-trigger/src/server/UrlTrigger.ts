/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import WorkflowPlugin, { Trigger, WorkflowModel, EXECUTION_STATUS } from '@nocobase/plugin-workflow';
import { compilePattern } from '../common/matchUrl';

export default class UrlTrigger extends Trigger {
  static TYPE = 'url';

  // Pre-compiled regex cache: workflowId → RegExp
  private regexCache = new Map<number, RegExp>();

  constructor(workflow: WorkflowPlugin) {
    super(workflow);

    const self = this;

    workflow.app.use(async function urlTriggerMiddleware(ctx: Context, next) {
      try {
        const matched = self.getMatchingWorkflows(ctx.path, ctx.method);
        if (!matched.length) {
          return next();
        }

        const syncWorkflows: Array<[WorkflowModel, any]> = [];
        const asyncWorkflows: Array<[WorkflowModel, any]> = [];

        const triggerContext = self.buildContext(ctx);

        for (const wf of matched) {
          if (self.workflow.isWorkflowSync(wf)) {
            syncWorkflows.push([wf, triggerContext]);
          } else {
            asyncWorkflows.push([wf, triggerContext]);
          }
        }

        for (const [wf, context] of syncWorkflows) {
          const processor = await self.workflow.trigger(wf, context, {
            httpContext: ctx,
          });

          if (!processor) {
            ctx.status = 500;
            ctx.body = { error: 'Workflow trigger failed' };
            return;
          }

          const { execution, lastSavedJob } = processor;

          if (execution.status === EXECUTION_STATUS.RESOLVED) {
            // If a response instruction (url-response) already set the response, stop here
            if (ctx.headerSent || ctx.status !== 404) {
              return;
            }
            // Fallback: check execution.output / lastSavedJob.result for backward compat with Output node
            const output = execution.output ?? lastSavedJob?.result;
            if (output) {
              if (typeof output === 'string') {
                ctx.redirect(output);
                return;
              }
              if (typeof output === 'object' && output.url) {
                ctx.redirect(output.url);
                return;
              }
              if (typeof output === 'object' && output.status) {
                ctx.status = output.status;
                ctx.body = output.body ?? '';
                return;
              }
            }
            continue;
          }

          if (execution.status < EXECUTION_STATUS.STARTED) {
            ctx.status = 403;
            ctx.body = { error: 'Access denied by workflow' };
            return;
          }

          ctx.status = 500;
          ctx.body = { error: 'Workflow execution did not complete' };
          return;
        }

        await next();

        for (const [wf, context] of asyncWorkflows) {
          self.workflow.trigger(wf, context);
        }
      } catch (err) {
        ctx.log?.error?.('[workflow-url-trigger] middleware error:', err);
        return next();
      }
    });
  }

  on(workflow: WorkflowModel) {
    const { url: pattern, matchMode = 'glob' } = workflow.config ?? {};
    if (pattern) {
      const regex = compilePattern(pattern, matchMode);
      if (regex) {
        this.regexCache.set(workflow.id, regex);
      }
    }
  }

  off(workflow: WorkflowModel) {
    this.regexCache.delete(workflow.id);
  }

  /**
   * Return all enabled URL trigger configs for client-side pre-matching.
   */
  getConfigs(): Array<{ url: string; matchMode: string; sync: boolean }> {
    const configs: Array<{ url: string; matchMode: string; sync: boolean }> = [];
    for (const wf of this.workflow.enabledCache.values()) {
      if (wf.type !== UrlTrigger.TYPE) {
        continue;
      }
      const { url, matchMode = 'glob' } = wf.config ?? {};
      if (url) {
        configs.push({ url, matchMode, sync: this.workflow.isWorkflowSync(wf) });
      }
    }
    return configs;
  }

  private getMatchingWorkflows(path: string, method: string): WorkflowModel[] {
    const results: WorkflowModel[] = [];

    for (const wf of this.workflow.enabledCache.values()) {
      if (wf.type !== UrlTrigger.TYPE) {
        continue;
      }

      const { url: pattern, matchMode = 'glob', methods = [] } = wf.config ?? {};
      if (!pattern) {
        continue;
      }

      if (methods.length && !methods.includes(method.toUpperCase())) {
        continue;
      }

      let regex = this.regexCache.get(wf.id);
      if (!regex) {
        regex = compilePattern(pattern, matchMode);
        if (!regex) {
          continue;
        }
        this.regexCache.set(wf.id, regex);
      }

      if (regex.test(path)) {
        results.push(wf);
      }
    }

    return results;
  }

  private buildContext(ctx: Context) {
    const { currentUser, currentRole } = ctx.state ?? {};
    let user = null;
    if (currentUser) {
      try {
        user = typeof currentUser.toJSON === 'function' ? currentUser.toJSON() : currentUser;
      } catch {
        user = currentUser;
      }
    }
    const { authorization, cookie, ...headers } = ctx.headers ?? {};

    return {
      url: ctx.path,
      query: ctx.query ?? {},
      method: ctx.method,
      headers,
      body: ctx.request.body ?? null,
      user,
      roleName: currentRole ?? null,
    };
  }

  async evaluateUrl(
    path: string,
    method: string,
    ctx: Context,
  ): Promise<{ action: string; url?: string; status?: number; body?: any }> {
    const matched = this.getMatchingWorkflows(path, method);
    const syncWorkflows = matched.filter((wf) => this.workflow.isWorkflowSync(wf));
    const asyncWorkflows = matched.filter((wf) => !this.workflow.isWorkflowSync(wf));

    const triggerContext = this.buildContext(ctx);
    triggerContext.url = path;

    for (const wf of syncWorkflows) {
      const processor = await this.workflow.trigger(wf, triggerContext, { httpContext: ctx });
      if (!processor) {
        return { action: 'block', status: 500, body: 'Workflow trigger failed' };
      }

      const { execution, lastSavedJob } = processor;

      if (execution.status === EXECUTION_STATUS.RESOLVED) {
        const output = execution.output ?? lastSavedJob?.result;
        if (output) {
          if (typeof output === 'string') {
            return { action: 'redirect', url: output };
          }
          if (typeof output === 'object' && output.url) {
            return { action: 'redirect', url: output.url };
          }
          if (typeof output === 'object' && output.status) {
            return { action: 'block', status: output.status, body: output.body };
          }
        }
        continue;
      }

      if (execution.status < EXECUTION_STATUS.STARTED) {
        return { action: 'block', status: 403, body: 'Access denied by workflow' };
      }

      return { action: 'block', status: 500, body: 'Workflow execution did not complete' };
    }

    for (const wf of asyncWorkflows) {
      this.workflow.trigger(wf, triggerContext);
    }

    return { action: 'passthrough' };
  }

  async execute(workflow: WorkflowModel, values: any, options: any) {
    return this.workflow.trigger(workflow, values, options);
  }

  validateContext(values: any) {
    if (!values?.url) {
      return { url: 'URL is required' };
    }
    return null;
  }
}
