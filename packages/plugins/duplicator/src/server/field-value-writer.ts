import { DataTypes, Field } from '@nocobase/database';
import lodash from 'lodash';

type WriterFunc = (val: any) => any;

export class FieldValueWriter {
  static writers = new Map<string, WriterFunc>();

  static write(field: Field, val) {
    if (val === null) return val;

    const fieldType = field.typeToString();
    const writer = FieldValueWriter.writers[fieldType];

    return writer ? writer(val) : val;
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

FieldValueWriter.registerWriter('Point', (val) => {
  return `(${val.x}, ${val.y})`;
});
