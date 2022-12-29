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

    const fieldType = field.typeToString();
    const writer = FieldValueWriter.writers[fieldType];

    if (writer) {
      val = writer(val);
    }

    if (field.type == 'point' || field.type == 'lineString' || field.type == 'circle' || field.type === 'polygon') {
      return getMapFieldWriter(field)(JSON.parse(val));
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

FieldValueWriter.registerWriter([DataTypes.JSON.toString(), DataTypes.JSONB.toString()], (val) =>
  lodash.isString(val) ? JSON.parse(val) : val,
);

FieldValueWriter.registerWriter(DataTypes.BOOLEAN.toString(), (val) => Boolean(val));
