/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { processData } from '../utils';

describe('utils', () => {
  describe('process data', () => {
    it('should process select field', () => {
      expect(
        processData(
          [
            {
              name: 'tag',
              type: 'bigInt',
              interface: 'select',
              uiSchema: {
                type: 'string',
                enum: [
                  {
                    value: '1',
                    label: 'Yes',
                  },
                  {
                    value: '2',
                    label: 'No',
                  },
                ],
              },
              label: 'Tag',
              value: 'tag',
              key: 'tag',
            },
          ],
          [{ tag: 1 }],
          {},
        ),
      ).toEqual([{ tag: 'Yes' }]);
    });
    it('should not process when aggregating', () => {
      expect(
        processData(
          [
            {
              name: 'tag',
              type: 'bigInt',
              interface: 'select',
              uiSchema: {
                type: 'string',
                enum: [
                  {
                    value: '1',
                    label: 'Yes',
                  },
                  {
                    value: '2',
                    label: 'No',
                  },
                ],
              },
              label: 'Tag',
              value: 'tag',
              key: 'tag',
              query: {
                field: 'tag',
                aggregation: 'count',
              },
            },
          ],
          [{ tag: 1 }],
          {},
        ),
      ).toEqual([{ tag: 1 }]);
    });
  });
});
