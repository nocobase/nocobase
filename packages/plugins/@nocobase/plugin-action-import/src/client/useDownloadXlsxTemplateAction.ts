/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  useAPIClient,
  useRecord,
  useBlockRequestContext,
  useCollection_deprecated,
  useCompile,
} from '@nocobase/client';
import { saveAs } from 'file-saver';

export const useDownloadXlsxTemplateAction = () => {
  const { resource } = useBlockRequestContext();
  const compile = useCompile();
  const record = useRecord();
  const { title } = useCollection_deprecated();

  return {
    async run() {
      const { explain, importColumns } = record;
      const { data } = await resource.downloadXlsxTemplate(
        {
          values: {
            title: compile(title),
            explain,
            columns: compile(importColumns),
          },
        },
        {
          method: 'post',
          responseType: 'blob',
        },
      );

      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${compile(title)}.xlsx`);
    },
  };
};
