import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useActionContext, useRecord } from '@nocobase/client';
import { getWorkflowDetailPath } from './constant';

export const WorkflowLink = () => {
  const { t } = useTranslation();
  const { id } = useRecord();
  const { setVisible } = useActionContext();
  return (
    <Link to={getWorkflowDetailPath(id)} onClick={() => setVisible(false)}>
      {t('View')}
    </Link>
  );
};
