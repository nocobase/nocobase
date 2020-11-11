import { extname } from 'path';
import { ModuleFormat } from 'rollup';

interface IGetBabelConfigOpts {
  target: 'browser' | 'node';
  type?: ModuleFormat;
  typescript?: boolean;
  runtimeHelpers?: boolean;
  filePath?: string;
  browserFiles?: {
    [value: string]: any;
  };
  nodeVersion?: number;
  nodeFiles?: {
    [value: string]: any;
  };
  lazy?: boolean;
  lessInBabelMode?: boolean|{
    paths?: any[];
    plugins?: any[];
  };
}

function transformImportLess2Css() {
  return {
      name: 'transform-import-less-to-css',
      visitor: {
          ImportDeclaration(path, source) {
              const re = /\.less$/;
              if(re.test(path.node.source.value)){
                path.node.source.value = path.node.source.value.replace(re, '.css');
              }
          }
      }
  }
}

export default function(opts: IGetBabelConfigOpts) {
  const { target, typescript, type, runtimeHelpers, filePath, browserFiles, nodeFiles, nodeVersion, lazy, lessInBabelMode } = opts;
  let isBrowser = target === 'browser';
  // rollup 场景下不会传入 filePath
  if (filePath) {
    if (extname(filePath) === '.tsx' || extname(filePath) === '.jsx') {
      isBrowser = true;
    } else {
      if (isBrowser) {
        if (nodeFiles.includes(filePath)) isBrowser = false;
      } else {
        if (browserFiles.includes(filePath)) isBrowser = true;
      }
    }
  }
  const targets = isBrowser ? { browsers: ['last 2 versions', 'IE 10'] } : { node: nodeVersion || 6 };

  return {
    opts: {
      presets: [
        ...(typescript ? [require.resolve('@babel/preset-typescript')] : []),
        [require.resolve('@babel/preset-env'), {
          targets,
          modules: type === 'esm' ? false : 'auto'
        }],
        ...(isBrowser ? [require.resolve('@babel/preset-react')] : []),
      ],
      plugins: [
        ...((type === 'cjs' && lazy && !isBrowser)
          ? [[require.resolve('@babel/plugin-transform-modules-commonjs'), {
            lazy: true,
          }]]
          : []),
        ...(lessInBabelMode ? [transformImportLess2Css] : []),
        ...(isBrowser ? [require.resolve('babel-plugin-react-require')] : []),
        require.resolve('@babel/plugin-syntax-dynamic-import'),
        require.resolve('@babel/plugin-proposal-export-default-from'),
        require.resolve('@babel/plugin-proposal-export-namespace-from'),
        require.resolve('@babel/plugin-proposal-do-expressions'),
        require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
        require.resolve('@babel/plugin-proposal-optional-chaining'),
        [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
        [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
        ...(runtimeHelpers
          ? [[require.resolve('@babel/plugin-transform-runtime'), {
            useESModules: isBrowser && (type === 'esm'),
            version: require('@babel/runtime/package.json').version,
          }]]
          : []),
        ...(process.env.COVERAGE
            ? [require.resolve('babel-plugin-istanbul')]
            : []
        )
      ],
    },
    isBrowser,
  };
}
