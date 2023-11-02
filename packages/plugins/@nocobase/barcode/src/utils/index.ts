export const DataTypeTransformers = {
  boolean: Boolean,
  integer: {
    boolean(value: boolean) {
      return Number(value);
    },
    number(value: number) {
      return value >= 0 ? Math.floor(value) : Math.ceil(value);
    },
    bigint(value: bigint) {
      return Number(value);
    },
    string(value: string) {
      const result = Number.parseInt(value, 10);
      if (Number.isNaN(result) || !Number.isFinite(result)) {
        return null;
      }
      return result;
    },
    date(value: Date) {
      const result = value.valueOf();
      if (Number.isNaN(result)) {
        return null;
      }
      return result;
    },
  },
  bigInt: {
    boolean(value: boolean) {
      return Number(value);
    },
    number(value: number) {
      return Math.floor(value >= 0 ? Math.floor(value) : Math.ceil(value));
    },
    bigint(value: bigint) {
      return Number(value);
    },
    string(value: string) {
      const result = Number.parseInt(value, 10);
      if (Number.isNaN(result) || !Number.isFinite(result)) {
        return null;
      }
      return result;
    },
    date(value: Date) {
      const result = value.valueOf();
      if (Number.isNaN(result)) {
        return null;
      }
      return result;
    },
  },
  double: {
    boolean(value: boolean) {
      return Number(value);
    },
    number(value: number) {
      return value;
    },
    bigint(value: bigint) {
      return Number(value);
    },
    string(value: string) {
      const result = Number.parseFloat(value);
      if (Number.isNaN(result) || !Number.isFinite(result)) {
        return null;
      }
      return result;
    },
    date(value: Date) {
      const result = value.valueOf();
      if (Number.isNaN(result)) {
        return null;
      }
      return result;
    },
  },
  decimal: {
    boolean(value: boolean) {
      return Number(value);
    },
    number(value: number) {
      return value;
    },
    bigint(value: bigint) {
      return value;
    },
    date(value: Date) {
      const result = value.valueOf();
      if (Number.isNaN(result)) {
        return null;
      }
      return result;
    },
  },
  string: {
    boolean(value: boolean) {
      return value.toString();
    },
    number(value: number) {
      return value.toString();
    },
    bigint(value: bigint) {
      return value.toString();
    },
    string(value: string) {
      return value;
    },
    date(value: Date) {
      return value.toISOString();
    },
  },
  date: {
    boolean(value: boolean) {
      return null;
    },
    number(value: number) {
      const result = new Date(value);
      if (Number.isNaN(result.valueOf())) {
        return null;
      }
      return result;
    },
    bigint(value: bigint) {
      const result = new Date(Number(value));
      if (Number.isNaN(result.valueOf())) {
        return null;
      }
      return result;
    },
    string(value: string) {
      const ts = Date.parse(value);
      if (Number.isNaN(ts)) {
        return null;
      }
      return new Date(ts);
    },
    date(value: Date) {
      return new Date(value);
    },
  },
};

export function toDbType(value: any, type: string) {
  if (value == null) {
    return null;
  }

  let jsType: string = typeof value;
  if (jsType == 'object' && value instanceof Date) {
    jsType = 'date';
  }

  const transformers = DataTypeTransformers[type];

  if (!transformers) {
    return null;
  }

  if (typeof transformers === 'function') {
    return transformers(value);
  }

  const transformer = transformers[jsType];
  return transformer ? transformer(value) : null;
}
