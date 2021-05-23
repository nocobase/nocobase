type Foo = {
  test?: {
    abc?: string;
  }
}
const foo: Foo = {};

export const optionalChaining = foo?.test?.abc;

const bar = false;
export const nullishCoalescing = bar ?? 'default';
