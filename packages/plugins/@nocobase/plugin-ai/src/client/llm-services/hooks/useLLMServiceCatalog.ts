/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect } from 'react';
import { useAIConfigRepository } from '../../repositories/hooks/useAIConfigRepository';
import { getAllModelsWithLabel } from '../utils';

export const useLLMServiceCatalog = () => {
  const repo = useAIConfigRepository();

  useEffect(() => {
    repo.getLLMServices();
  }, [repo]);

  const services = repo.llmServices;
  const loading = repo.llmServicesLoading;

  const allModelsWithLabel = getAllModelsWithLabel(services);
  const allModels = allModelsWithLabel.map(({ llmService, model }) => ({ llmService, model }));

  return {
    repo,
    services,
    loading,
    allModelsWithLabel,
    allModels,
  };
};
