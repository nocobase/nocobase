import path from 'path';
import fs from 'fs-extra';
import { getLernaPackages } from './';

export const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

export function getDirs() {
  return fs
		.readdirSync(FIXTURES_DIR)
		.filter(fixturePath =>
			fs.statSync(path.resolve(FIXTURES_DIR, fixturePath)).isDirectory(),
		);
}

export function fixture(...args: string[]) {
  return path.join(FIXTURES_DIR, ...args)
}

describe('default', () => {
  const fixturePath = fixture('default');

  it('获取所有的包', async () => {
    expect.assertions(1);

    const pkgs = await getLernaPackages(fixturePath);

    const pkgNames = ['bar', 'foo'];

    expect(pkgNames).toEqual(pkgs.map(item => item.name));
  })
});

describe('customize', () => {
  const fixturePath = fixture('customize');

  it('获取所有的包', async () => {
    expect.assertions(1);

    const pkgs = await getLernaPackages(fixturePath, {});

    const pkgNames = ['core2', 'bar', 'foo', 'core1'];

    expect(pkgNames).toEqual(pkgs.map(item => item.name));
  });

  it('过滤私有的包', async () => {
    expect.assertions(1);

    const pkgs = await getLernaPackages(fixturePath, {
      skipPrivate: true,
    });

    const pkgNames = ['bar', 'foo', 'core1'];

    expect(pkgNames).toEqual(pkgs.map(item => item.name));
  });

  it('设置包含部分包', async () => {
    expect.assertions(1);

    const pkgs = await getLernaPackages(fixturePath, {
      include: [
        'core*'
      ]
    });
    const pkgNames = ['core1', 'core2'];

    expect(pkgNames).toEqual(pkgs.map(item => item.name));
  })

  it('设置包含部分包', async () => {
    expect.assertions(1);

    const pkgs = await getLernaPackages(fixturePath, {
      exclude: [
        'core1'
      ]
    });
    const pkgNames = ['core2', 'bar', 'foo'];

    expect(pkgNames).toEqual(pkgs.map(item => item.name));
  })
});
