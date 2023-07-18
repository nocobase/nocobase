import fs from 'fs';
import chalk from 'chalk';
import { builtinModules } from 'module';
import path from 'path';

const requireRegex = /require\((["'])(.*?)\1\)/g;
const packageJsonRequireRegex = /require\((['"])\.\.\/+(\.\.\/)*package\.json\1\)/;
const importRegex = /import\s+.*?\s+from\s+['"]([^'"\s.].+?)['"];?/g;

type Log = (msg: string, ...args: any) => void;

export function isNotBuiltinModule(packageName: string) {
  return !builtinModules.includes(packageName);
}

/**
 * get package name from string
 * @example
 * getPackageNameFromString('lodash') => lodash
 * getPackageNameFromString('lodash/xx') => lodash
 * getPackageNameFromString('@aa/bb') => @aa/bb
 * getPackageNameFromString('aa/${lang}') => aa
 *
 * getPackageNameFromString('./xx') => null
 * getPackageNameFromString('../xx') => null
 * getPackageNameFromString($file) => null
 * getPackageNameFromString(`${file}`) => null
 * getPackageNameFromString($file + './xx') => null
 */
function getPackageNameFromString(str: string) {
  // ./xx or ../xx
  if (str.startsWith('.')) return null;

  const arr = str.split('/');
  let packageName: string;
  if (arr[0].startsWith('@')) {
    // @aa/bb/ccFile => @aa/bb
    packageName = arr.slice(0, 2).join('/');
  } else {
    // aa/bbFile => aa
    packageName = arr[0];
  }

  try {
    require.resolve(packageName, { paths: [process.cwd()] });
    return packageName;
  } catch {
    return null;
  }
}

export function getSourcePackages(sourceFiles: string[]): string[] {
  const packages = sourceFiles
    .map(item => fs.readFileSync(item, 'utf-8'))
    .map(item => {
      return [
        ...Array.from(item.matchAll(importRegex)).map(item => item[1]),
        ...Array.from(item.matchAll(requireRegex)).map(item => item[2]),
      ]
    })
    .flat()
    .filter(isNotBuiltinModule)
    .map(getPackageNameFromString)
    .filter(Boolean)
  return [...new Set(packages)];
}

export function getPackageJson(cwd: string) {
  return JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'));
}

export function getPackageJsonPackages(packageJson: Record<string, any>): string[] {
  return [...Object.keys(packageJson.devDependencies || {}), ...Object.keys(packageJson.dependencies || {})];
}

export function checkSourcePackages(srcPackages: string[], packageJsonPackages: string[], shouldDevDependencies: string[], log: Log) {
  const missingPackages = srcPackages
    .filter((packageName) => !packageJsonPackages.includes(packageName))
    .filter((packageName) => !shouldDevDependencies.includes(packageName));

  if (missingPackages.length) {
    log("Missing packages %s in package.json. If you want it to be bundled into the output, put it in %s; otherwise, put it in %s.", chalk.red(missingPackages.join(', ')), chalk.bold('dependencies'), chalk.bold('devDependencies'));
    process.exit(-1);
  }
}

export function checkRequirePackageJson(sourceFiles: string[], packageJson: Record<string, any>, log: Log) {
  if (!packageJson.dependencies) return;
  sourceFiles.forEach(item => {
    const code = fs.readFileSync(item, 'utf-8');
    const match = code.match(packageJsonRequireRegex)

    if (match) {
      log('%s in %s is not allowed. Please use %s instead.', chalk.red(match[0]), chalk.red(item), chalk.red('import'));
      process.exit(-1);
    }
  })
}

export function checkEntryExists(cwd: string, entry: 'server' | 'client', log: Log) {
  const srcDir = path.join(cwd, 'src', entry);
  if (!fs.existsSync(srcDir)) {
    log('Missing %s. Please create it.', chalk.red(`src/${entry}`));
    process.exit(-1);
  }

  return srcDir;
}

export function checkDependencies(packageJson: Record<string, any>, shouldDevDependencies: string[], log: Log) {
  if (!packageJson.dependencies) return;
  const shouldDevDependenciesList = shouldDevDependencies.filter(item => packageJson.dependencies[item]);
  if (shouldDevDependenciesList.length) {
    log('%s should not be placed in %s, but rather in %s. For more information, please refer to: %s.', chalk.yellow(shouldDevDependenciesList.join(', ')), chalk.yellow('dependencies'), chalk.yellow('devDependencies'), chalk.blue(chalk.blue('https://docs.nocobase.com/development/deps')));
  }
}

type CheckOptions = {
  cwd: string;
  log: Log;
  entry: 'server' | 'client';
  files: string[];
  shouldDevDependencies: string[];
  packageJson: Record<string, any>;
}

export function getFileSize(filePath: string) {
  const stat = fs.statSync(filePath);
  return stat.size;
}

export function formatFileSize(fileSize: number) {
  const kb = fileSize / 1024;
  return kb.toFixed(2) + ' KB';
}


export function buildCheck(options: CheckOptions) {
  const { cwd, log, entry, files, packageJson, shouldDevDependencies } = options;
  checkEntryExists(cwd, entry, log)

  const sourcePackages = getSourcePackages(files);

  checkSourcePackages(sourcePackages, getPackageJsonPackages(packageJson), shouldDevDependencies, log);
  checkRequirePackageJson(files, packageJson, log);
  checkDependencies(packageJson, shouldDevDependencies, log);
}
