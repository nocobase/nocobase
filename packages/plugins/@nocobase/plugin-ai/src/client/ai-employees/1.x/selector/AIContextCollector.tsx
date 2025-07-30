/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect } from 'react';
import { useAISelectionContext } from './AISelectorProvider';
import { useForm } from '@formily/react';
import { useResourceActionContext } from '@nocobase/client';

export const AIFormContextCollector: React.FC<{
  uid: string;
}> = (props) => {
  const { uid } = props;
  const { collect } = useAISelectionContext();
  const form = useForm();

  useEffect(() => {
    collect(uid, 'form', form);
  }, [form, uid, collect]);

  return null;
};

export const AIResourceContextCollector: React.FC<{
  uid: string;
}> = (props) => {
  const { uid } = props;
  const { collect } = useAISelectionContext();
  const service = useResourceActionContext();

  useEffect(() => {
    collect(uid, 'service', service);
  }, [uid, service, collect]);

  return null;
};
