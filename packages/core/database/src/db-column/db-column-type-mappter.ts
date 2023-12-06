import { isArray } from 'mathjs';
import FieldTypeMap from './field-type-map';

export class DBColumnTypeMapper {
  static inferToFieldType(options: { name: string; type: string; dialect: string }) {
    const { dialect } = options;
    const fieldTypeMap = FieldTypeMap[dialect];

    if (!options.type) {
      return {
        possibleTypes: Object.keys(fieldTypeMap),
      };
    }

    const queryType = options.type.toLowerCase().replace(/\(\d+\)/, '');
    const mappedType = fieldTypeMap[queryType];

    if (isArray(mappedType)) {
      return {
        type: mappedType[0],
        possibleTypes: mappedType,
      };
    }

    return {
      type: mappedType,
    };
  }
}
