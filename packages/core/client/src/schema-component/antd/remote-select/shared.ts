import { castArray } from 'lodash';

export const getValues = (values, fieldNames) => {
  return castArray(values)
    .filter((item) => item != null)
    .map((val) => (typeof val === 'object' ? val[fieldNames.value] : val));
};
