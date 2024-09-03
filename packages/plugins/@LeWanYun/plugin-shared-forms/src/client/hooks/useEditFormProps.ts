import { createForm } from '@formily/core';
import { useCollectionRecordData } from '@nocobase/client';
import { useMemo } from 'react';

export const useEditFormProps = () => {
  const recordData = useCollectionRecordData();
  const form = useMemo(
    () =>
      createForm({
        initialValues: recordData,
      }),
    [recordData],
  );

  return {
    form,
  };
};
