import { Parser } from 'hot-formula-parser';
import _ from 'lodash';
/**
 * Gets a parser loaded with the variables and any helper functions
 * @param scope 
 * @returns 
 */
export const getHotExcelParser = (scope: object) => {
  let parser = new Parser();
  Object.keys(scope).forEach((key: string) => {
    parser.setVariable(`${key}`, scope[key]);
  });
  parser.setFunction('GET_DEEP', params => {
    return _.get(params[0], params[1])
  });
  return parser;
};
