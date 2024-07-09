/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { useRecord, useCollectionManager_deprecated } from '@nocobase/client';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

export const useMBMFields = () => {
  const { collectionName, name } = useRecord();
  const { name: dataSourceKey } = useParams();
  const { getCollection } = useCollectionManager_deprecated();
  const form = useForm();
  const { target } = form.values || {};

  const collectionFields = useMemo(() => {
    return getCollection(collectionName || name, dataSourceKey)?.fields;
  }, [collectionName, dataSourceKey]);
  const targetFields = useMemo(() => {
    return getCollection(target, dataSourceKey)?.fields;
  }, [target, dataSourceKey]);

  const targetKeys = useMemo(
    () =>
      targetFields?.filter((f) => {
        const isTarget = (f.primaryKey || f.unique) && f.interface;
        return isTarget;
      }),
    [targetFields],
  );

  const foreignKeys = useMemo(() => {
    return collectionFields?.filter((f) => {
      const isArray = ['set', 'array'].includes(f.type) && f.interface === 'json';
      return isArray;
    });
  }, [collectionFields]);

  return { targetKeys, foreignKeys };
};
