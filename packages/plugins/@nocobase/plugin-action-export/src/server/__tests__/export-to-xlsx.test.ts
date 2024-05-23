/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import XlsxExporter from '../xlsx-exporter';
import XLSX from 'xlsx';
import fs from 'fs';

XLSX.set_fs(fs);
import path from 'path';

describe('export to xlsx', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['action-export'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should export data to xlsx', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
      ],
    });

    await app.db.sync();

    const values = Array.from({ length: 22 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const exporter = new XlsxExporter({
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
      ],
    });

    const wb = await exporter.run();

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    try {
      await new Promise((resolve, reject) => {
        XLSX.writeFileAsync(
          xlsxFilePath,
          wb,
          {
            type: 'array',
          },
          () => {
            resolve(123);
          },
        );
      });

      // read xlsx file
      const workbook = XLSX.readFile(xlsxFilePath);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      expect(sheetData.length).toBe(23); // 22 users + 1 header

      const header = sheetData[0];
      expect(header).toEqual(['Name', 'Age']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual(['user0', 0]);
    } finally {
      fs.unlinkSync(xlsxFilePath);
    }
  });
});
