import { getPackagesSync } from '@lerna/project';
import { QueryGraph } from '@lerna/query-graph';
import { filterPackages } from '@lerna/filter-packages';

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
  const {
    include = [],
    exclude = [],
    skipPrivate = false,
  } = ops;

  const allPkgs = getPackagesSync(cwd) ?? [];

  const pkgs = filterPackages(allPkgs, include, exclude, !skipPrivate, true);

  return await getStreamPackages(pkgs);
}

export function getStreamPackages(pkgs: any[]): Promise<any[]> {
  const graph = new QueryGraph(pkgs, 'allDependencies', true);

  return new Promise((resolve) => {
    const returnValues: any[] = [];

    const queueNextAvailablePackages = () =>
      graph.getAvailablePackages()
        // @ts-ignore
        .forEach(({ pkg, name }) => {
          graph.markAsTaken(name);

          Promise.resolve(pkg)
            .then((value) => returnValues.push(value))
            .then(() => graph.markAsDone(pkg))
            .then(() => queueNextAvailablePackages())
        });

    queueNextAvailablePackages();

    setTimeout(() => { resolve(returnValues); }, 0);
  });
}
