/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext, useFlowSettingsContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Select } from 'antd';
import React, { useMemo } from 'react';

import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiUrl } from '../../shared/apiContract';
import { useT } from '../locale';
import { CollectionContextLike, getCollectionNameFromContext } from '../utils/collectionContext';

export interface DispatchBindingRecord {
  id: string;
  bindingKey: string;
  collectionName?: string;
  sourceCollection?: string;
  enabled?: boolean;
  status?: string;
}

interface AgentGatewayApiResponse<T> {
  data?: {
    data?: T;
  };
}

interface AgentGatewayApi {
  request<T>(config: { url: string; method: 'get' }): Promise<AgentGatewayApiResponse<T>>;
}

interface AgentGatewayContext {
  api: AgentGatewayApi;
}

export interface AgentGatewayDispatchBindingSelectProps {
  value?: string;
  disabled?: boolean;
  onChange?: (value?: string) => void;
}

function getResponseData<T>(response: AgentGatewayApiResponse<T>, fallback: T) {
  return response.data?.data ?? fallback;
}

export function getDispatchBindingOptions(bindings: DispatchBindingRecord[], collectionName?: string) {
  if (!collectionName) {
    return [];
  }
  return bindings
    .filter((binding) => binding.enabled !== false && (binding.status || 'active') === 'active')
    .filter((binding) => (binding.collectionName || binding.sourceCollection) === collectionName)
    .map((binding) => {
      const bindingCollectionName = binding.collectionName || binding.sourceCollection || '-';
      return {
        label: `${binding.bindingKey} (${bindingCollectionName})`,
        value: binding.bindingKey,
      };
    });
}

export function AgentGatewayDispatchBindingSelect(props: AgentGatewayDispatchBindingSelectProps) {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayContext;
  const flowSettingsCtx = useFlowSettingsContext() as unknown as CollectionContextLike | undefined;
  const collectionName = getCollectionNameFromContext(flowSettingsCtx);
  const bindingsRequest = useRequest(async () => {
    const response = await ctx.api.request<DispatchBindingRecord[]>({
      url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.listDispatchBindings),
      method: 'get',
    });
    return getResponseData(response, []);
  });

  const options = useMemo(
    () => getDispatchBindingOptions(bindingsRequest.data || [], collectionName),
    [bindingsRequest.data, collectionName],
  );

  return (
    <Select
      aria-label={t('Dispatch binding')}
      disabled={props.disabled}
      loading={bindingsRequest.loading}
      options={options}
      placeholder={t('Select dispatch binding')}
      showSearch
      value={props.value}
      optionFilterProp="label"
      onChange={props.onChange}
      allowClear
    />
  );
}

export default AgentGatewayDispatchBindingSelect;
