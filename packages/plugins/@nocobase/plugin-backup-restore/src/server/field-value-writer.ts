/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, DataTypes, Field } from '@nocobase/database';
import lodash from 'lodash';
import moment from 'moment/moment';

type WriterFunc = (val: any, database: Database) => any;

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

  static write(field: Field, val, database) {
    if (val === null) return val;

    if (field.type == 'point' || field.type == 'lineString' || field.type == 'circle' || field.type === 'polygon') {
      return getMapFieldWriter(field)(lodash.isString(val) ? JSON.parse(val) : val);
    }

    const fieldType = field.typeToString();

    const writer = FieldValueWriter.writers[fieldType];

    if (writer) {
      val = writer(val, database);
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

FieldValueWriter.registerWriter('DatetimeNoTzTypeMySQL', (val, database) => {
  // @ts-ignore
  const timezone = database.options.rawTimezone || '+00:00';

  if (typeof val === 'string' && isIso8601(val)) {
    const momentVal = moment(val).utcOffset(timezone);
    val = momentVal.format('YYYY-MM-DD HH:mm:ss');
  }

  return val;
});

FieldValueWriter.registerWriter(DataTypes.BOOLEAN.toString(), (val) => Boolean(val));

function isIso8601(str) {
  const iso8601StrictRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  return iso8601StrictRegex.test(str);
}
