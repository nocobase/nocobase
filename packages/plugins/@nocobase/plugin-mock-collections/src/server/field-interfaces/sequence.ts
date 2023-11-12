import { randomInt } from 'crypto';

export const sequence = {
  options: (options) => {
    const defaults = {
      type: 'sequence',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        'x-component-props': {},
      },
      patterns: [
        {
          type: 'integer',
          options: {
            digits: 1,
            start: 0,
            key: randomInt(1 << 16),
            cycle: '0 0 * * *',
          },
        },
      ],
    };
    if (options.patterns) {
      defaults.patterns = options.patterns.map((p) => {
        if (p.type === 'integer') {
          p.options.key = randomInt(1 << 16);
        }
        return p;
      });
      delete options.patterns;
    }
    return defaults;
  },
};
