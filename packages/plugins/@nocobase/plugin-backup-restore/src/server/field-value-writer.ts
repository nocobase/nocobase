import { DataTypes, Field } from '@nocobase/database';
import lodash from 'lodash';

type WriterFunc = (val: any) => any;

const getMapFieldWriter = (field: Field) => {
  return (val) => {
    const mockObj = {
      setDataValue: (name, newVal) => {
        val = newVal;
      },
    };

    field.options.set.call(mockObj, val);
    return val;
  };
};

export class FieldValueWriter {
  static writers = new Map<string, WriterFunc>();

  static write(field: Field, val) {
    if (val === null) return val;

    if (field.type == 'point' || field.type == 'lineString' || field.type == 'circle' || field.type === 'polygon') {
      return getMapFieldWriter(field)(lodash.isString(val) ? JSON.parse(val) : val);
    }

    const fieldType = field.typeToString();
    const writer = FieldValueWriter.writers[fieldType];

    if (writer) {
      val = writer(val);
    }

    return val;
  }

  static toDumpedValue(field: Field, val) {
    if (val === null) return val;

    if (field.type == 'point' || field.type == 'lineString' || field.type == 'circle' || field.type === 'polygon') {
      const mockObj = {
        getDataValue: () => val,
      };

      const newValue = field.options.get.call(mockObj);
      return newValue;
    }

    return val;
  }

  static registerWriter(types: string | string[], writer: WriterFunc) {
    for (const type of lodash.castArray(types)) {
      FieldValueWriter.writers[type] = writer;
    }
  }
}

function isJSONObjectOrArrayString(str) {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null;
  } catch (e) {
    return false;
  }
}

FieldValueWriter.registerWriter([DataTypes.JSON.toString(), DataTypes.JSONB.toString()], (val) => {
  try {
    return isJSONObjectOrArrayString(val) ? JSON.parse(val) : val;
  } catch (err) {
    if (err instanceof SyntaxError && err.message.includes('Unexpected')) {
      return val;
    }

    throw err;
  }
});

FieldValueWriter.registerWriter(DataTypes.BOOLEAN.toString(), (val) => Boolean(val));
