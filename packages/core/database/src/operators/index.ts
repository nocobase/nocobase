import array from './array';
import association from './association';
import boolean from './boolean';
import childCollection from './child-collection';
import date from './date';
import empty from './empty';
import eq from './eq';
import ne from './ne';
import notIn from './notIn';
import string from './string';

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
