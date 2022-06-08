import prettyFormat from 'pretty-format';

global['prettyFormat'] = prettyFormat;

jest.setTimeout(300000);

(() => {
  const spy = jest.spyOn(console, 'error');
  afterAll(() => {
    spy.mockRestore();
  });
})();
