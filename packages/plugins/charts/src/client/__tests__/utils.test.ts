import { Schema } from '@formily/react';
import { compileWithKeys } from '../utils';

describe('utils', () => {
  describe('compileWithKeys', () => {
    it('should compile normal schema', () => {
      const compiledSchema = compileWithKeys(Schema.compile)({
        xField: '{{metric}}',
        yField: '{{dimension}}'
      }, {
        metric: 'year',
        dimension: 'value',
      });
      expect(compiledSchema).toEqual({
        xField: 'year',
        yField: 'value',
      });
    });

    it('should compile schema when key is an expression', () => {
      const compiledSchema = compileWithKeys(Schema.compile)({
        xField: '{{metric}}',
        yField: '{{dimension}}',
        meta: {
          "{{metric}}": {
            type: 'cat'
          }
        }
      }, {
        metric: 'year',
        dimension: 'value',
      });
      expect(compiledSchema).toEqual({
        xField: 'year',
        yField: 'value',
        meta: {
          year: {
            type: 'cat'
          }
        }
      });
    })

    it('should compile schema when key is an expression nested in array', () => {
      const compiledSchema = compileWithKeys(Schema.compile)({
        xField: '{{metric}}',
        yField: '{{dimension}}',
        meta: {
          "{{metric}}": {
            type: 'cat'
          }
        },
        anyConfig: [
          {
            "{{metric}}": {
              type: 'cat'
            }
          },
          {
            "{{dimension}}": {
              type: 'linear'
            }
          }
        ]
      }, {
        metric: 'year',
        dimension: 'value',
      });
      expect(compiledSchema).toEqual({
        xField: 'year',
        yField: 'value',
        meta: {
          year: {
            type: 'cat'
          }
        },
        anyConfig: [
          {
            year: {
              type: 'cat'
            }
          },
          {
            value: {
              type: 'linear'
            }
          }
        ]
      });
    })
  });
});
