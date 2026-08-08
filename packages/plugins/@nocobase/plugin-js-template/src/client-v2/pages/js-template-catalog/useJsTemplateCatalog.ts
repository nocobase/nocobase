/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../../constants';
import type { JsTemplateCatalogEntry } from '../../../shared/types';
import { deleteJsTemplate, listJsTemplateCatalog, type ApiClientLike } from '../../api/jsTemplatesRequests';

export interface JsTemplateCatalogNotice {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

export function useJsTemplateCatalog(api: ApiClientLike) {
  const { t } = useTranslation(NAMESPACE);
  const [entries, setEntries] = useState<JsTemplateCatalogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<JsTemplateCatalogNotice | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await listJsTemplateCatalog(api));
      return true;
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to load templates') });
      return false;
    } finally {
      setLoading(false);
    }
  }, [api, t]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const removeTemplate = useCallback(
    async (entry: JsTemplateCatalogEntry) => {
      setDeletingTemplateId(entry.id);
      setNotice(null);
      try {
        await deleteJsTemplate(api, entry.id);
        setNotice({
          type: 'success',
          message: t('JS Template deleted: {{name}}').replace('{{name}}', entry.title || entry.templateName),
        });
        await loadCatalog();
      } catch (error) {
        setNotice({ type: 'error', message: getDeleteErrorMessage(error, t) });
      } finally {
        setDeletingTemplateId(null);
      }
    },
    [api, loadCatalog, t],
  );

  return {
    deletingTemplateId,
    entries,
    loadCatalog,
    loading,
    notice,
    removeTemplate,
    setNotice,
  };
}

function getDeleteErrorMessage(error: unknown, t: (key: string) => string): string {
  const response = isRecord(error) && isRecord(error.response) ? error.response : null;
  const data = response && isRecord(response.data) ? response.data : null;
  const errors = data && Array.isArray(data.errors) ? data.errors : [];
  const serverError = errors.find(isRecord);
  if (serverError?.code === 'JS_TEMPLATE_USAGE_EXISTS') {
    const details = isRecord(serverError.details) ? serverError.details : null;
    const usageCount = typeof details?.usageCount === 'number' ? details.usageCount : null;
    if (usageCount !== null) {
      return t(
        'This JS Template is still used in {{count}} locations. Detach those usages before deleting it.',
      ).replace('{{count}}', String(usageCount));
    }
    return t('Detach all effective usages before deleting this JS Template.');
  }
  if (serverError?.code === 'JS_TEMPLATE_PROJECT_ARCHIVED') {
    return t('Archived JS Templates cannot be deleted.');
  }
  return t('Failed to delete JS Template');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
