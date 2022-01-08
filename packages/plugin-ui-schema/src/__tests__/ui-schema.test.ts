import { ISchema } from '@formily/json-schema';

describe('ui-schema', () => {
  type SchemaProperties = Record<string, ISchema>;
  // properties、patternProperties、definitions 都是这种类型的
  describe('SchemaProperties', () => {
    it('properties is plain object', () => {
      const items = [
        {
          properties: {}, // 有效
        },
        {
          properties: null, // 跳过
        },
        {
          properties: 'aaa', // 无效，跳过并警告
        },
        {
          properties: [],  // 无效，跳过并警告
        },
        {
          properties: 1,  // 无效，跳过并警告
        },
        {
          properties: true,  // 无效，跳过并警告
        },
      ];
    });
    it('properties node is plain object', () => {
      const schema = {
        properties: {
          a: {}, // 有效 {name: 'a'}
          b: null, // 跳过，不警告
          c: 'aaa', // 无效，跳过并警告
          d: true, // 无效，跳过并警告
          e: 1, // 无效，跳过并警告
          f: [], // 无效，跳过并警告
        },
      };
    });
    it('nested', () => {
      const schema = {
        properties: {
          a: {
            properties: {
              b: {},
            },
          },
        },
      };
    });
  });

  type SchemaItems = ISchema | ISchema[];
  describe('items', () => {
    it('items is array or plain object', () => {
      const examples = [
        {
          items: {}, // 有效，等同于 [{}]
        },
        {
          items: [{}], // 有效
        },
        {
          items: [], // 有效，但无节点
        },
        {
          items: 'str', // 无效，跳过并警告
        },
      ];
    });
    it('items node is plain object', () => {
      const schema = {
        items: [
          {},
          [], // 无效，跳过并警告
          null, // 无效，跳过并警告
          'aa', // 无效，跳过并警告
        ],
      }
    });
  });
  describe('additionalProperties & additionalItems', () => {
    it('additionalProperties and additionalItems are plain object', () => {
      const schema = {
        additionalProperties: {},
        additionalItems: {
          properties: {},
        },
      };
    });
    it('null', () => {
      const schema = {
        additionalProperties: null,
        additionalItems: null,
      };
    });
    it('null', () => {
      const schema = {
        additionalProperties: 1, // 跳过并警告
        additionalItems: 'str', // 跳过并警告
      };
    });
  });

  it('all props', () => {
    const schema = {
      definitions: {
        address: {
          type: 'object',
          properties: {
            street_address: {
              type: 'string',
            },
            city: {
              type: 'string',
            },
            state: {
              type: 'string',
            },
          },
          required: ['street_address', 'city', 'state'],
        },
      },
      type: 'object',
      title: 'title',
      description: 'description',
      patternProperties: {
        '^[a-zA-Z0-9]*$': {
          properties: {
            model: { type: 'string' },
            made: { type: 'string' },
            year: { type: 'string' },
          },
        },
      },
      additionalProperties: {
        type: 'string',
      },
      properties: {
        string: {
          type: 'string',
          default: 'default',
          required: true,
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'placeholder',
          },
          'x-decorator': 'FormItem',
          'x-decorator-props': {
            labelCol: 3,
          },
          'x-disabled': true,
          'x-display': 'visible',
          'x-editable': false,
          'x-hidden': false,
          'x-pattern': 'readPretty',
          'x-read-only': true,
          'x-validator': ['phone'],
          'x-reactions': [
            {
              target: 'xxx',
              when: '{{aa > bb}}',
            },
          ],
        },
        boolean: {
          type: 'boolean',
          default: false,
        },
        number: {
          type: 'number',
          default: 100,
        },
        date: {
          type: 'date',
          default: '2020-12-23',
        },
        datetime: {
          type: 'datetime',
          default: '2020-12-23 23:00:00',
        },
        array: {
          type: 'array',
          items: {
            type: 'string',
          },
          additionalItems: {
            type: 'number',
          },
        },
        array2: {
          type: 'array',
          items: [
            {
              type: 'string',
            },
            {
              type: 'object',
            },
          ],
        },
        void: {
          type: 'void',
        },
      },
    }
  });
});
