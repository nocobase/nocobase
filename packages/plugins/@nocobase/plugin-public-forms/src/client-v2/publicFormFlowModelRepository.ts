/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel, IFlowModelRepository } from '@nocobase/flow-engine';

type PublicFormFlowModelRepositoryOptions = {
  app: {
    apiClient: {
      request: (options: any) => Promise<any>;
    };
  };
  formKey?: string;
  delegate?: IFlowModelRepository<FlowModel> | null;
};

function getResponseData(response: any) {
  return response?.data?.data ?? null;
}

function compactParams(params: Record<string, any>) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => typeof value !== 'undefined'));
}

function isPublicFormModelQuery(query: Record<string, any>) {
  return !!query?.uid || (!!query?.parentId && !!query?.subKey);
}

export class PublicFormFlowModelRepository implements IFlowModelRepository<FlowModel> {
  readonly __publicFormFlowModelRepository = true;
  private formKey = '';

  constructor(private options: PublicFormFlowModelRepositoryOptions) {
    this.formKey = options.formKey || '';
  }

  setFormKey(formKey?: string) {
    this.formKey = formKey || '';
  }

  async findOne(query: Record<string, any>) {
    if (this.formKey && isPublicFormModelQuery(query)) {
      const response = await this.options.app.apiClient.request({
        url: `publicForms:getFlowModel/${this.formKey}`,
        skipAuth: true,
        params: compactParams({
          uid: query.uid,
          parentId: query.parentId,
          subKey: query.subKey,
        }),
      } as any);
      return getResponseData(response);
    }

    return this.options.delegate?.findOne(query) ?? null;
  }

  async save(model: FlowModel, options?: { onlyStepParams?: boolean }) {
    return this.options.delegate?.save(model, options) ?? {};
  }

  async destroy(uid: string) {
    return this.options.delegate?.destroy(uid) ?? false;
  }

  async move(sourceId: string, targetId: string, position: 'before' | 'after') {
    await this.options.delegate?.move(sourceId, targetId, position);
  }

  async duplicate(uid: string) {
    return this.options.delegate?.duplicate(uid) ?? null;
  }
}

export function isPublicFormFlowModelRepository(repository: unknown): repository is PublicFormFlowModelRepository {
  return !!repository && !!(repository as any).__publicFormFlowModelRepository;
}
