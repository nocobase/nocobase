interface IOpts {
  foo: boolean;
}

export default function foo(opts: IOpts): string {
  return opts.foo ? 'foo' : 'bar';
}
