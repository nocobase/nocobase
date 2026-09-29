import type { WorkflowParameterFormComponent } from '../types.js';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import * as jsxDevRuntime from 'react/jsx-dev-runtime';
import { resolveAppUrl } from '@nocobase/app-client';

export async function loadWorkflowParameterForm(
  artifactHash: string | null | undefined,
  id = 'workflow.parameterForm',
): Promise<WorkflowParameterFormComponent | null> {
  if (!artifactHash || !/^[a-f0-9]{64}$/.test(artifactHash))
    throw new Error('Workflow Artifact hash is missing');
  const globals = globalThis as typeof globalThis & {
    __nocobaseWorkflowReact?: typeof React;
    __nocobaseWorkflowJsxRuntime?: typeof jsxRuntime;
    __nocobaseWorkflowJsxDevRuntime?: typeof jsxDevRuntime;
  };
  globals.__nocobaseWorkflowReact = React;
  globals.__nocobaseWorkflowJsxRuntime = jsxRuntime;
  globals.__nocobaseWorkflowJsxDevRuntime = jsxDevRuntime;
  const url = resolveAppUrl(
    `/assets/workflow-artifacts/${artifactHash}/client/manifest.json`,
  );
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(
      `Workflow client manifest failed to load: ${response.status}`,
    );
  const manifest = (await response.json()) as {
    formatVersion: number;
    hostAbi: number;
    entries: Record<string, { js: string; css: string[] }>;
    files: string[];
  };
  if (manifest.formatVersion !== 1 || manifest.hostAbi !== 1)
    throw new Error(
      'Workflow client Artifact is incompatible with this application',
    );
  const entry = manifest.entries[id];
  if (!entry)
    throw new Error(
      `Workflow client entry ${id} is missing from Artifact ${artifactHash}`,
    );
  const resolve = (name: string): string => {
    if (
      !/^client\/[a-zA-Z0-9._/-]+$/.test(name) ||
      name.split('/').includes('..') ||
      !manifest.files.includes(name)
    )
      throw new Error(`Invalid workflow client file: ${name}`);
    return resolveAppUrl(`/assets/workflow-artifacts/${artifactHash}/${name}`);
  };
  await Promise.all(
    entry.css.map(async (css) => {
      const href = resolve(css);
      if (
        !document.querySelector(`link[data-workflow-css="${CSS.escape(href)}"]`)
      ) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.workflowCss = href;
        await new Promise<void>((resolveLoad, reject) => {
          link.onload = () => resolveLoad();
          link.onerror = () =>
            reject(
              new Error(`Workflow client stylesheet failed to load: ${href}`),
            );
          document.head.append(link);
        });
      }
    }),
  );
  const module = (await import(/* @vite-ignore */ resolve(entry.js))) as {
    default?: WorkflowParameterFormComponent;
  };
  if (typeof module.default !== 'function')
    throw new Error(
      `Workflow client entry ${id} has no component default export`,
    );
  return module.default;
}
