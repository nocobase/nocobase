/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useMemo } from 'react';
import { useLLMServicesRepository } from './useLLMServicesRepository';
import { getAllModelsWithLabel } from '../utils';

export const useLLMServiceCatalog = () => {
  const repo = useLLMServicesRepository();

  useEffect(() => {
    repo.load();
  }, [repo]);

  const services = repo.services;
  const loading = repo.loading;

  const allModelsWithLabel = useMemo(() => getAllModelsWithLabel(services), [services]);
  const allModels = useMemo(
    () => allModelsWithLabel.map(({ llmService, model }) => ({ llmService, model })),
    [allModelsWithLabel],
  );

  return {
    repo,
    services,
    loading,
    allModelsWithLabel,
    allModels,
  };
};
