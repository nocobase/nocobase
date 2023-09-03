import chalk from 'chalk';
import path from 'path';

let previousColor = '';
function randomColor() {
  const colors = [
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'gray',
    'redBright',
    'greenBright',
    'yellowBright',
    'blueBright',
    'magentaBright',
    'cyanBright',
  ];

  let color = previousColor;
  while (color === previousColor) {
    const randomIndex = Math.floor(Math.random() * colors.length);
    color = colors[randomIndex];
  }

  previousColor = color;
  return chalk[color];
}

export type PkgLog = (msg: string, ...args: any[]) => void;
export const getPkgLog = (pkgName: string) => {
  const pkgColor = randomColor();
  const pkgStr = chalk.bold(pkgColor(pkgName));
  const pkgLog: PkgLog = (msg: string, ...optionalParams: any[]) => console.log(`${pkgStr}: ${msg}`, ...optionalParams);
  return pkgLog;
};

export function toUnixPath(filepath: string) {
  return filepath.replace(/\\/g, '/');
}

export function getPackageJson(cwd: string) {
  return require(path.join(cwd, 'package.json'));
}
