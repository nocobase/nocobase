import Topo from '@hapi/topo';
import { filterPackages } from '@lerna/filter-packages';
import { getPackagesSync } from '@lerna/project';
import { QueryGraph } from '@lerna/query-graph';

export interface Options {
  /** 指定包含的包 */
  include?: string[];
  /** 指定排除的包 */
  exclude?: string[];
  /**
   * 跳过私有的包
   * @default false
   * */
  skipPrivate?: boolean;
}

/**
 * 获取lerna项目包集合
 * @param cwd
 */
export async function getLernaPackages(cwd: string, ops: Options = {}): Promise<any[]> {
  const { include = [], exclude = [], skipPrivate = false } = ops;

  const sorter = new Topo.Sorter();

  const allPkgs = getPackagesSync(cwd) ?? [];

  const pkgs = filterPackages(allPkgs, include, exclude, !skipPrivate, true);

  // const packages = await getStreamPackages(pkgs);

  for (const pkg of pkgs) {
    const pkgJson = require(`${pkg.name}/package.json`);
    const after = Object.keys({ ...pkgJson.dependencies, ...pkgJson.devDependencies, ...pkgJson.peerDependencies });
    sorter.add(pkg, { after, group: pkg.name });
  }

  return sorter.nodes;
}

export function getStreamPackages(pkgs: any[]): Promise<any[]> {
  const graph = new QueryGraph(pkgs, 'allDependencies', true);

  return new Promise((resolve) => {
    const returnValues: any[] = [];

    const queueNextAvailablePackages = () =>
      graph
        .getAvailablePackages()
        // @ts-ignore
        .forEach(({ pkg, name }) => {
          graph.markAsTaken(name);

          Promise.resolve(pkg)
            .then((value) => returnValues.push(value))
            .then(() => graph.markAsDone(pkg))
            .then(() => queueNextAvailablePackages());
        });

    queueNextAvailablePackages();

    setTimeout(() => {
      resolve(returnValues);
    }, 0);
  });
}
