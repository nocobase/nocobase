/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { useContext } from 'react';
import { useForm, useFieldSchema, useField } from '@formily/react';
import { useDataBlockResource, useCollectValuesToSubmit, useFormBlockContext } from '@nocobase/client';
import { PublicFormMessageContext } from '../components/PublicFormPage';

export const usePublicSubmitActionProps = () => {
  const form = useForm();
  const resource = useDataBlockResource();
  const actionField = useField();
  const collectValues = useCollectValuesToSubmit();
  const actionSchema = useFieldSchema();
  const { updateAssociationValues } = useFormBlockContext();
  const { setShowMessage } = useContext(PublicFormMessageContext);
  return {
    type: 'primary',
    async onClick() {
      const { skipValidator, triggerWorkflows } = actionSchema?.['x-action-settings'] ?? {};
      if (!skipValidator) {
        await form.submit();
      }
      const values = await collectValues();
      actionField.data = actionField.data || {};
      actionField.data.loading = true;
      try {
        await form.submit();
        await resource.publicSubmit({
          values,
          triggerWorkflows: triggerWorkflows?.length
            ? triggerWorkflows.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
            : undefined,
          updateAssociationValues,
        });
        await form.reset();
        actionField.data.loading = false;
        setShowMessage(true);
      } catch (error) {
        actionField.data.loading = false;
      }
    },
  };
};
