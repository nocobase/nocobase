/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CircleInterface, LineStringInterface, PointInterface, PolygonInterface } from '../interfaces';

describe('interfaces', () => {
  describe('point', () => {
    it('should toString', async () => {
      const interfaceInstance = new PointInterface();
      expect(await interfaceInstance.toString([1, 2])).toBe('1,2');
    });

    it('should toValue', async () => {
      const interfaceInstance = new PointInterface();
      expect(await interfaceInstance.toValue('1,2')).toMatchObject([1, 2]);
    });
  });

  describe('lineString', () => {
    it('should toString', async () => {
      const interfaceInstance = new LineStringInterface();
      expect(
        interfaceInstance.toString([
          [1, 2],
          [3, 4],
        ]),
      ).toBe('(1,2),(3,4)');
    });

    it('should toValue', async () => {
      const interfaceInstance = new LineStringInterface();
      expect(await interfaceInstance.toValue('(1,2),(3,4)')).toMatchObject([
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe('polygon', () => {
    it('should toString', async () => {
      const interfaceInstance = new PolygonInterface();
      expect(
        interfaceInstance.toString([
          [1, 2],
          [3, 4],
          [5, 6],
        ]),
      ).toBe('(1,2),(3,4),(5,6)');
    });

    it('should toValue', async () => {
      const interfaceInstance = new PolygonInterface();
      expect(await interfaceInstance.toValue('(1,2),(3,4),(5,6)')).toMatchObject([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });
  });

  describe('circle', () => {
    it('should toString', async () => {
      const interfaceInstance = new CircleInterface();
      expect(interfaceInstance.toString([1, 2, 0.5])).toBe('1,2,0.5');
    });

    it('should toValue', async () => {
      const interfaceInstance = new CircleInterface();
      expect(await interfaceInstance.toValue('1,2,0.5')).toMatchObject([1, 2, 0.5]);
    });
  });
});
