import association from './association';
import date from './date';
import array from './array';
import empty from './empty';
import string from './string';
import eq from './eq';
import ne from './ne';
import notIn from './notIn';
import boolean from './boolean';
import childCollection from './child-collection';

export default {
  ...association,
  ...date,
  ...array,
  ...empty,
  ...string,
  ...eq,
  ...ne,
  ...notIn,
  ...boolean,
  ...childCollection,
};
