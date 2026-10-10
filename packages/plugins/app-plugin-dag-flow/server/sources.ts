import path from 'node:path';

/**
 * Workflow packages a plugin ships, offered to the application next to its own
 * `workflows` directory.
 *
 * A plugin registers one with `workflowSourcesToken` from a provider's
 * `register()`, so it is in place before this plugin synchronizes deployment
 * Artifacts at boot. The plugin must therefore be listed after this one.
 */
export interface WorkflowSourceContribution {
  /** The contributing package, named when two sources offer the same workflow key. */
  readonly owner: string;
  /**
   * Workflow source packages, read outside production when the directory
   * exists. Omit it for a plugin that ships built Artifacts only.
   */
  readonly sourceRoot?: string;
  /** Built Artifacts, as `buildApplicationWorkflows` writes them. */
  readonly distRoot: string;
}

export interface WorkflowSourceRegistry {
  add(source: WorkflowSourceContribution): void;
  list(): readonly WorkflowSourceContribution[];
}

export class WorkflowSourceList implements WorkflowSourceRegistry {
  private readonly sources: WorkflowSourceContribution[] = [];

  add(source: WorkflowSourceContribution): void {
    if (this.sources.some((existing) => existing.owner === source.owner))
      throw new Error(
        `Workflow sources of "${source.owner}" are already registered.`,
      );
    this.sources.push(source);
  }

  list(): readonly WorkflowSourceContribution[] {
    return [...this.sources];
  }
}

export interface PluginWorkflowSourceOptions {
  /** The contributing package name. */
  readonly owner: string;
  /**
   * The plugin's `baseDir`: the package root in a source checkout, or the
   * `dist` directory a published plugin runs from.
   */
  readonly baseDir: string;
  /** The directory holding the workflow packages, relative to the package root. Defaults to `workflows`. */
  readonly directory?: string;
}

/**
 * The contribution of a plugin laid out the way an application is: sources in
 * `<directory>` and Artifacts in `dist/<directory>`, which is also where the
 * Artifacts sit relative to a published plugin's `dist` base directory. A
 * published plugin ships no sources, so only a source checkout offers them.
 */
export function pluginWorkflowSources(
  options: PluginWorkflowSourceOptions,
): WorkflowSourceContribution {
  const directory = options.directory ?? 'workflows';
  if (path.basename(options.baseDir) === 'dist')
    return {
      owner: options.owner,
      distRoot: path.join(options.baseDir, directory),
    };
  return {
    owner: options.owner,
    sourceRoot: path.join(options.baseDir, directory),
    distRoot: path.join(options.baseDir, 'dist', directory),
  };
}
