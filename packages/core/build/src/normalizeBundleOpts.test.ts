import normalizeBundleOpts from './normalizeBundleOpts';

test('normal', () => {
  expect(
    normalizeBundleOpts('a', {
      umd: { name: 'foo' },
      overridesByEntry: {
        a: { umd: { name: 'bar' } },
      },
    }),
  ).toEqual({
    umd: { name: 'bar' },
  });
});

test('ignore ./ prefix in entry', () => {
  expect(
    normalizeBundleOpts('./a', {
      umd: { name: 'foo' },
      overridesByEntry: {
        a: { umd: { name: 'bar' } },
      },
    }),
  ).toEqual({
    umd: { name: 'bar' },
  });
});

test('ignore ./ prefix in overridesByEntry', () => {
  expect(
    normalizeBundleOpts('a', {
      umd: { name: 'foo' },
      overridesByEntry: {
        './a': { umd: { name: 'bar' } },
      },
    }),
  ).toEqual({
    umd: { name: 'bar' },
  });
});

test('deep merge', () => {
  expect(
    normalizeBundleOpts('a', {
      umd: { minFile: false, name: 'foo' },
      overridesByEntry: {
        a: { umd: { name: 'bar' } },
      },
    }),
  ).toEqual({
    umd: { minFile: false, name: 'bar' },
  });
});
