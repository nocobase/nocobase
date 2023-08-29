import indexHtml from './sandbox-template/index.html.tpl';
import mainTsx from './sandbox-template/main.tsx.tpl';
import packageJson from './sandbox-template/package.json.tpl';
import sandboxConfigJson from './sandbox-template/sandbox.config.json.tpl';
import tsConfigJson from './sandbox-template/tsconfig.json.tpl';
import viteConfigTs from './sandbox-template/vite.config.ts.tpl';

function removeModuleExports(content) {
  return JSON.parse(content.replace('module.exports = ', '').replace(';', ''));
}

export default {
  modifyCodeSandboxData: (memo, props) => {
    const AppTsx = memo.files['App.tsx'];
    let pkg = JSON.parse(removeModuleExports(packageJson));
    try {
      const { dependencies, devDependencies } = removeModuleExports(memo.files['package.json'].content);
      const deps = { ...dependencies, ...devDependencies };
      for (let key in deps) {
        if (!pkg['devDependencies'][key]) {
          pkg.dependencies[key] = deps[key];
        }
      }
    } catch (e) {
      console.log(e);
    }

    memo.files = {};
    memo.files['src/App.tsx'] = AppTsx;
    memo.files['index.html'] = { content: removeModuleExports(indexHtml), isBinary: false };
    memo.files['src/main.tsx'] = { content: removeModuleExports(mainTsx), isBinary: false };
    memo.files['package.json'] = { content: JSON.stringify(pkg, null, 2), isBinary: false };
    memo.files['sandbox.config.json'] = { content: removeModuleExports(sandboxConfigJson), isBinary: false };
    memo.files['tsconfig.json'] = { content: removeModuleExports(tsConfigJson), isBinary: false };
    memo.files['vite.config.ts'] = { content: removeModuleExports(viteConfigTs), isBinary: false };
    return memo;
  },
};
