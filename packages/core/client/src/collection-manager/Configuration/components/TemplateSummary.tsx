/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager_deprecated } from '../../hooks';
import Summary from './Summary';

export const TemplateSummary = (props: { schemaKey: string }) => {
  const { t } = useTranslation();
  const { getTemplate } = useCollectionManager_deprecated();
  const schema = useMemo(() => {
    return getTemplate(props.schemaKey);
  }, [getTemplate, props.schemaKey]);

  return <Summary label={t('Collection template')} schema={schema} />;
};

TemplateSummary.displayName = 'TemplateSummary';
