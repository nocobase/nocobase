import _ from 'lodash';

export const isFieldValueEmpty = (value) => {
  value = _.isArray(value) ? _.filter(value, (v) => !_.isEmpty(v)) : value;
  return _.isEmpty(value);
};

export const isDisplayField = (schemaName: string) => {
  return schemaName.includes('.');
};
