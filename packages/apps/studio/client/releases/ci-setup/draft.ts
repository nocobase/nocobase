/**
 * A "Configure CI" run while it is being chosen, in the New project wizard (`deploy-step.tsx`) and in the settings'
 * dialog (`configure-dialog.tsx`): one application (its directory and App ID) and one target (the trigger, its branch
 * or tag pattern, and the environment), the way, the agent of `agent`, and the file of `template` as edited.
 *
 * The environment follows the trigger (`defaultEnvironment`) until someone picks one; the App ID follows the
 * directory, trigger and environment (`initialAppId`: the base for pull requests, `<base>-<environment>` otherwise)
 * until someone edits it, which is how an existing App is named. The standard file is generated as soon as a way shows
 * it; it names no repository, which the CLI reads from CI's environment, so it is the same before the repository is
 * added.
 */
import { useState } from 'react';

import {
  CI_DEFAULT_TAG_PATTERN,
  isStudioCiMethod,
  normalizeDirectory,
  type CiApp,
  type CiEnvironment,
  type CiMethod,
  type CiRunRequest,
  type CiTarget,
  type CiTrigger,
  type CiWorkflowFile,
} from '../../../shared/ci-modes.js';
import { useCiEnvironments, useGeneratedWorkflow } from './api.js';
import {
  availableMethod,
  ciRunProblems,
  defaultEnvironment,
  initialAppId,
  initialMethod,
  methodNeedsFiles,
} from './model.js';

export interface CiDraftInput {
  /** Names the application until someone edits its App ID. */
  readonly repoName: string | null;
  /** Whether the repository is reached through a Git connection: Studio's ways need it. */
  readonly connected: boolean;
  readonly defaultBranch: string;
}

export function useCiDraft(input: CiDraftInput) {
  const [chosen, setChosen] = useState<CiMethod | null>(null);
  const [trigger, setTrigger] = useState<CiTrigger>('pullRequest');
  const [branch, setBranch] = useState<string | null>(null);
  const [tagPattern, setTagPattern] = useState<string>(CI_DEFAULT_TAG_PATTERN);
  const [pickedEnvironment, setPickedEnvironment] = useState<string | null>(
    null,
  );
  const [directory, setDirectory] = useState('.');
  const [editedAppId, setEditedAppId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState('');
  const [edited, setEdited] = useState<CiWorkflowFile | null>(null);
  const environments = useCiEnvironments();
  const list: readonly CiEnvironment[] = environments.data ?? [];
  // A way no longer possible (the connection went away) falls back to the first that is.
  const method = availableMethod(
    chosen ?? initialMethod(input.connected),
    input.connected,
  );
  const environmentId =
    (pickedEnvironment &&
    list.some((environment) => environment.id === pickedEnvironment)
      ? pickedEnvironment
      : null) ?? defaultEnvironment(trigger, list);
  const ref =
    trigger === 'branch'
      ? (branch ?? input.defaultBranch)
      : trigger === 'tag'
        ? tagPattern
        : null;
  const target: CiTarget = {
    trigger,
    ref: ref?.trim() ?? null,
    environmentId: environmentId ?? '',
  };
  const appId =
    editedAppId ??
    initialAppId(input.repoName, directory, {
      trigger,
      environmentId: environmentId ?? '',
    });
  const app: CiApp = {
    directory: normalizeDirectory(directory),
    appId: appId.trim(),
  };
  const problems = ciRunProblems({ app: { directory, appId }, target });
  const runValid = problems.length === 0;
  const standard = useGeneratedWorkflow(
    { app, target, defaultBranch: input.defaultBranch },
    {
      managed: isStudioCiMethod(method),
      enabled: methodNeedsFiles(method) && runValid,
    },
  );
  const generated = standard.data ?? null;
  // An edit of another file (the App or environment changed since) is set aside.
  const editedFile =
    edited && generated && edited.path === generated.path ? edited : null;
  /** The file as it will be written or copied: as edited (`template`), else the standard one. */
  const file =
    method === 'template' ? (editedFile ?? generated) : (generated ?? null);
  // Only `template` sends its file; the ways done by hand show it and send nothing.
  const fileReady = method !== 'template' || !!generated;
  return {
    method,
    setMethod: setChosen,
    trigger,
    /** A new trigger starts again in its own default environment. */
    setTrigger: (next: CiTrigger) => {
      setTrigger(next);
      setPickedEnvironment(null);
    },
    branch: branch ?? input.defaultBranch,
    setBranch,
    tagPattern,
    setTagPattern,
    environments: list,
    environmentsLoading: environments.isPending,
    environmentsFailed: environments.isError,
    environmentId,
    setEnvironment: setPickedEnvironment,
    directory,
    setDirectory,
    appId,
    /** Whether the App ID is the one the target starts from, not one someone typed. */
    appIdDerived: editedAppId === null,
    setAppId: setEditedAppId,
    app,
    target,
    problems,
    runValid,
    agentId,
    setAgentId,
    /** Replaces the file's edited content. */
    edit: (path: string, content: string) => setEdited({ path, content }),
    /** The standard file, named after the repository once it exists; null while it loads. */
    generated,
    file,
    fileLoading: standard.isPending && standard.fetchStatus !== 'idle',
    fileFailed: standard.isError,
    /** Whether the run may be sent; a way done by hand sends nothing, and is always finished. */
    valid:
      !isStudioCiMethod(method) ||
      (runValid && fileReady && (method !== 'agent' || agentId.trim() !== '')),
    /** What Studio is asked to do; null for a way done by hand. */
    request: (): CiRunRequest | null => {
      if (method === 'direct') return { method, app, target };
      if (method === 'agent') return { method, app, target, agentId };
      if (method === 'template')
        return { method, app, target, workflowFiles: file ? [file] : [] };
      return null;
    },
  };
}

export type CiDraft = ReturnType<typeof useCiDraft>;
