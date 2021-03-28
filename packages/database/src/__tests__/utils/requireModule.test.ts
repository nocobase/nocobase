import path from "path";

import { requireModule } from "../../utils";



describe('utils.requireModule', () => {
  test('toBeTruthy', () => {
    const r = requireModule(true);
    expect(r).toBeTruthy();
  });

  test('toBeInstanceOf Function', () => {
    const r = requireModule(() => { });
    expect(r).toBeInstanceOf(Function);
  });

  test('toBeInstanceOf Function', () => {
    const r = requireModule(path.resolve(__dirname, './modules/fn'));
    expect(r).toBeInstanceOf(Function);
  });

  test('toBeInstanceOf Function', () => {
    const r = requireModule(path.resolve(__dirname, './modules/fnts'));
    expect(r).toBeInstanceOf(Function);
  });

  test('object', () => {
    const r = requireModule(path.resolve(__dirname, './modules/obj'));
    expect(r).toEqual({
      'foo': 'bar',
    });
  });

  test('object', () => {
    const r = requireModule(path.resolve(__dirname, './modules/objts'));
    expect(r).toEqual({
      'foo': 'bar',
    });
  });

  test('json', () => {
    const r = requireModule(path.resolve(__dirname, './modules/json'));
    expect(r).toEqual({
      'foo': 'bar',
    });
  });
});
