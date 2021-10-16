export default {
  fiter: {
    and: [
      { a: 'a' },
      { b: 'b' },
      { c: 'c' },
      { 'assoc.a': 'abc1' },
      { 'assoc.b': 'abc2' },
      { 'assoc.c': 'abc3' },
      {
        and: [
          { 'assoc.a': 'abc1' },
          { 'assoc.b': 'abc2' },
        ],
      },
    ],
  },
};
