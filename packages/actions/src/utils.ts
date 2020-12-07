import _ from 'lodash';

export function filterByFields(data: any, fields: any = {}): any {
  const {
    only = Array.isArray(fields) ? fields : null,
    except = []
  } = fields;

  return _.omit(only ? _.pick(data, only): data, except);
}
