import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useActionContext, useRecord } from '@nocobase/client';


export const WorkflowLink = () => {
  const { t } = useTranslation();
  const { id } = useRecord();
  const { setVisible } = useActionContext();
  return (
    <Link to={`/admin/plugins/workflows/${id}`} onClick={() => setVisible(false)}>{t('View')}</Link>
  );
}
