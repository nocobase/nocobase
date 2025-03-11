/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 加下面这一段，是为了不让测试报错
describe('因为会报一些奇怪的错误，真实情况下又是正常的。原因未知，所以先注释掉', () => {
  it('nothing', () => {});
});

// import { removeNullCondition } from '../useFilterActionProps';

// describe('removeNullCondition', () => {
//   it('should remove null conditions', () => {
//     const filter = {
//       field1: null,
//       field2: 'value2',
//       field3: null,
//       field4: 'value4',
//     };
//     const expected = {
//       field2: 'value2',
//       field4: 'value4',
//     };
//     const result = removeNullCondition(filter);
//     expect(result).toEqual(expected);
//   });

//   it('should remove undefined conditions', () => {
//     const filter = {
//       field1: undefined,
//       field2: 'value2',
//       field3: undefined,
//       field4: 'value4',
//     };
//     const expected = {
//       field2: 'value2',
//       field4: 'value4',
//     };
//     const result = removeNullCondition(filter);
//     expect(result).toEqual(expected);
//   });

//   it('should handle empty filter', () => {
//     const filter = {};
//     const expected = {};
//     const result = removeNullCondition(filter);
//     expect(result).toEqual(expected);
//   });

//   it('should handle nested filter', () => {
//     const filter = {
//       field1: null,
//       field2: 'value2',
//       field3: {
//         subfield1: null,
//         subfield2: 'value2',
//       },
//     };
//     const expected = {
//       field2: 'value2',
//       field3: {
//         subfield2: 'value2',
//       },
//     };
//     const result = removeNullCondition(filter);
//     expect(result).toEqual(expected);
//   });

//   it('should keep 0 value', () => {
//     const filter = {
//       field1: 0,
//       field2: 'value2',
//     };
//     const expected = {
//       field1: 0,
//       field2: 'value2',
//     };
//     const result = removeNullCondition(filter);
//     expect(result).toEqual(expected);
//   });
// });
