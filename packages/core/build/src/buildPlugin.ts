import fs from 'fs';
import { builtinModules } from 'module';
import path from 'path';
import react from '@vitejs/plugin-react'
import { build as tsupBuild } from 'tsup'
import { build as viteBuild, PluginOption } from 'vite'
import fg from 'fast-glob'

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

function getPackageJson(cwd: string) {
  return JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'));
}

function getPackageJsonPackages(packageJson: Record<string, any>): string[] {
  return [...Object.keys(packageJson.devDependencies || {}), ...Object.keys(packageJson.dependencies || {})];
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


function checkSrcExists(cwd: string, entry: 'server' | 'client') {
  const srcDir = path.join(cwd, 'src', entry);
  if (!fs.existsSync(srcDir)) {
    console.error(`[Plugin Build Error]: Missing \`\x1b[31m%s\x1b[0m\`. Please create it\n`, `src/${entry}`);
    process.exit(-1);
  }

  return srcDir;
}

function tipDeps(srcPackages: string[], packageJson: Record<string, any>, entry: 'server' | 'client') {
  if (!packageJson.dependencies) return;
  const includePackages = srcPackages.filter(item => packageJson.dependencies[item])
  if (!includePackages.length) return;
  console.log('\n[%s build tip]: Please note that \x1b[33m%s\x1b[0m will be bundled into dist.\n',
    entry,
    includePackages.join(', '),
  )
}

function check(cwd: string, packageJson: Record<string, any>, entry: 'server' | 'client') {
  const srcDir = checkSrcExists(cwd, entry)
  const srcPackages = getSrcPackages(srcDir);
  checkPackages(srcPackages, getPackageJsonPackages(packageJson));
  tipDeps(srcPackages, packageJson, entry)
}

function checkFileSizePlugin(filePath: string): PluginOption {
  return {
    name: 'check-file-size',
    closeBundle() {
      const fileSize = getFileSize(filePath);
      if (fileSize > 1024 * 1024) {
        console.warn('\n[client build]: The bundle file size exceeds 1MB \`\x1b[31m%s\x1b[0m\`. Please check for unnecessary \`\x1b[31mdependencies\x1b[0m\` and move them to \`\x1b[31mdevDependencies\x1b[0m\` if possible.\n', formatFileSize(fileSize));
      }
    },
  };
}

function getFileSize(filePath: string) {
  const stat = fs.statSync(filePath);
  return stat.size;
}

function formatFileSize(fileSize: number) {
  const kb = fileSize / 1024;
  return kb.toFixed(2) + ' KB';
}

export function buildPluginServer(cwd: string) {
  const packageJson = getPackageJson(cwd);
  check(cwd, packageJson, 'server')

  const entry = fg.globSync([
    'src/**',
    '!src/server/__tests__/**',
    '!src/client/**'
  ], {
    cwd,
    absolute: true,
  })
  return tsupBuild({
    entry,
    splitting: false,
    clean: false,
    bundle: false,
    silent: true,
    treeshake: true,
    outDir: path.join(cwd, 'lib'),
    format: 'cjs',
    external: Object.keys(packageJson.devDependencies || {}),
  })
}

export function buildPluginClient(cwd: string) {
  const packageJson = getPackageJson(cwd);
  check(cwd, packageJson, 'client')

  const outDir = path.join(cwd, 'lib/client');

  const externals = Object.keys(packageJson.devDependencies || {}).reduce<Record<string, string>>((prev, curr) => {
    prev[`${curr}/client`] = curr;
    prev[curr] = curr;
    return prev;
  }, {})

  return viteBuild({
    plugins: [react(), checkFileSizePlugin(path.join(outDir, 'index.js'))],
    mode: 'production',
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    logLevel: 'error',
    build: {
      minify: false,
      outDir,
      lib: {
        entry: path.join(cwd, 'src/client'),
        formats: ['umd'],
        name: packageJson.name,
        fileName: () => 'index.js',
      },
      rollupOptions: {
        external: [...Object.keys(externals), 'react/jsx-runtime'],
        output: {
          exports: 'named',
          globals: {
            ...externals,
            'react/jsx-runtime': 'jsxRuntime',
          }
        },
      }
    }
  })
}
