
// babel-plugin-react-require
export const Foo = () => <div />;

// Don't support multiple chunks for now
// @babel/plugin-syntax-dynamic-import
// import('./a');

// object-rest-spread
const { foo, ...z } = bar;
console.log(z);

// @babel/plugin-proposal-decorators + class
@foo
export class A {}

// export default from
export a from './a';

// do expression
let a = do {
  if(x > 10) {
    'big';
  } else {
    'small';
  }
};
console.log(a);

// export namespace from
export * as b from './b';

