
import { defineConfig } from 'father';
import fs from 'fs';
import { builtinModules } from 'module';
import path from 'path';
import { dependencies, devDependencies, name } from './package.json';

export default getFatherBuildConfig({
  clientExtraExternals: [],
  serverExtraExternals: [],
  sourcemap: true,
})

interface BuildOptions {
  /**
   * When client build, **exclude** these packages.
   *
   * devDependencies in package.json will be excluded automatically.
   */
  clientExtraExternals?: string[];
  /**
   * When server build, **exclude** these packages.
   *
   * devDependencies in package.json will be excluded automatically.
   */
  serverExtraExternals?: string[];
  /**
   * Whether to generate source map
   * @default  true
   */
  sourcemap?: boolean;
}

function getFatherBuildConfig(options: BuildOptions) {

  function isBuiltinModule(packageName: string) {
    return builtinModules.includes(packageName);
  }

  function getSrcPackages(sourceDir: string): string[] {
    const importedPackages = new Set<string>();
    const exts = ['.js', '.ts', '.jsx', '.tsx'];

    const importRegex = /import\s+.*?\s+from\s+['"]([^'"\s.].+?)['"];?/g;
    const requireRegex = /require\s*\(\s*[`'"]([^`'"\s.].+?)[`'"]\s*\)/g;
    function setPackagesFromContent(reg: RegExp, content: string) {
      let match: RegExpExecArray | null;
      while ((match = reg.exec(content))) {
        let importedPackage = match[1];
        if (importedPackage.startsWith('@')) {
          // @aa/bb/ccFile => @aa/bb
          importedPackage = importedPackage.split('/').slice(0, 2).join('/');
        } else {
          // aa/bbFile => aa
          importedPackage = importedPackage.split('/')[0];
        }

        if (!isBuiltinModule(importedPackage)) {
          importedPackages.add(importedPackage);
        }
      }
    }

    function traverseDirectory(directory: string) {
      const files = fs.readdirSync(directory);

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // recursive
          traverseDirectory(filePath);
        } else if (stat.isFile() && !filePath.includes('__tests__')) {
          if (exts.includes(path.extname(filePath).toLowerCase())) {
            const content = fs.readFileSync(filePath, 'utf-8');

            setPackagesFromContent(importRegex, content);
            setPackagesFromContent(requireRegex, content);
          }
        }
      }
    }

    traverseDirectory(sourceDir);

    return [...importedPackages];
  }

  function getPackageJsonPackages(): string[] {
    return [...Object.keys(devDependencies || {}), ...Object.keys(dependencies || {})];
  }

  function checkPackages(srcPackages: string[], packageJsonPackages: string[]) {
    const missingPackages = srcPackages.filter((packageName) => !packageJsonPackages.includes(packageName));
    if (missingPackages.length) {
      console.error(
        `[Plugin Build Error]: Missing packages \`\x1b[31m%s\x1b[0m\` \nPlease add them to "devDependencies" or "dependencies" in package.json\n`, missingPackages.join(', ')
      );
      process.exit(-1);
    }
  }

  function getServerIncludePackages(srcServerPackages: string[], serverExtraExternals: string[] = []) {
    const serverExcludePackages = [...serverExtraExternals, ...(devDependencies ? Object.keys(devDependencies) : [])];
    const serverIncludePackages = srcServerPackages.filter((packageName) => !serverExcludePackages.includes(packageName));
    return serverIncludePackages;
  }

  function getClientExcludePackages(clientExtraExternals: string[] = []) {
    return [...clientExtraExternals, ...(devDependencies ? Object.keys(devDependencies) : [])];
  }


  function baseFatherBuildConfig(options: BuildOptions = {}) {
    const SRC = 'src'
    const DIST = 'lib'
    const SERVER = 'server'
    const CLIENT = 'client'
    const srcDir = path.join(__dirname, SRC);
    const distDir = path.join(__dirname, DIST);
    const srcClientDir = path.join(srcDir, CLIENT);
    const srcServerDir = path.join(srcDir, SERVER);
    if (!fs.existsSync(srcClientDir)) {
      console.error(`[Plugin Build Error]: Missing \`\x1b[31m%s\x1b[0m\`. Please create it\n`, `${SRC}/${CLIENT}`);
      process.exit(-1);
    }

    if (!fs.existsSync(srcServerDir)) {
      console.error(`[Plugin Build Error]: Missing \`\x1b[31m%s\x1b[0m\`. Please create it\n`, `${SRC}/${SERVER}`);
      process.exit(-1);
    }

    const srcClientPackages = getSrcPackages(srcClientDir);
    const srcServerPackages = getSrcPackages(srcServerDir);

    const packageJsonPackages = getPackageJsonPackages();
    checkPackages([...srcClientPackages, ...srcServerPackages], packageJsonPackages);

    const serverIncludePackages = getServerIncludePackages(srcServerPackages, options?.serverExtraExternals);
    const clientExcludePackages = getClientExcludePackages(options?.clientExtraExternals);
    return defineConfig({
      umd: {
        name,
        entry: `${SRC}/${CLIENT}`,
        platform: 'browser',
        sourcemap: options.sourcemap ?? true,
        output: `${DIST}/${CLIENT}`,
        chainWebpack: (memo) => {
          memo.optimization.minimize(false);
          memo.output.filename('index.js');
          memo.output.libraryTarget('amd');
          return memo;
        },
        externals: {
          ...clientExcludePackages.reduce<Record<string, string>>((prev, curr) => {
            prev[`${curr}/${CLIENT}`] = curr;
            prev[curr] = curr;
            return prev;
          }, {}),
        },
      },
      cjs: {
        input: `${SRC}/${SERVER}`,
        output: `${DIST}/${SERVER}`,
      },
      prebundle: {
        output: `${DIST}/node_modules`,
        deps: {
          ...serverIncludePackages.reduce<Record<string, { minify: boolean; dts: boolean }>>((prev, curr) => {
            prev[curr] = { minify: false, dts: false };
            return prev;
          }, {}),
        },
      },
    });
  }

  return baseFatherBuildConfig(options)
}
