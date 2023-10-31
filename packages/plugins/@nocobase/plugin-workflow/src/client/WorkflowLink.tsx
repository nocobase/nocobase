import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useActionContext, useGetAriaLabelOfAction, useRecord } from '@nocobase/client';

export const WorkflowLink = () => {
  const { t } = useTranslation();
  const { id } = useRecord();
  const { setVisible } = useActionContext();
  const { getAriaLabel } = useGetAriaLabelOfAction('Configure');

  return (
    <Link aria-label={getAriaLabel()} to={`/admin/settings/workflow/workflows/${id}`} onClick={() => setVisible(false)}>
      {t('Configure')}
    </Link>
  );
};
