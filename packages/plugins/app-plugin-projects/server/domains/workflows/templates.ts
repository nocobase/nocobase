/**
 * Workflow templates other plugins contribute (`projectsWorkflowTemplatesToken`): built-in workflows this plugin
 * cannot spell out itself, because they name another plugin's kinds or rule types (an agent runtime's agent moves and
 * `runAgent`, say). The plugin itself ships no workflow: without one, every project uses the built-in statuses.
 *
 * A template is installed once (`WorkflowService.installTemplate`): it becomes a workflow marked with the template's
 * key, validated like any other, and the default workflow when it says `makeDefault` and none is the default yet.
 * People may then change, rename or delete it like any workflow; a deleted one is not installed again, because the
 * settings remember every template installed.
 *
 * The plugin installs templates in the background, from its `boot()` on: those added before then at once, the others as
 * they are added. `installed()` waits for them; the plugin awaits it in its `ready()` phase, so an application that
 * starts the usual way serves no request before the templates its plugins added while booting are workflows.
 */
import type { KindTitle } from '../../../shared/kinds.js';
import type { WorkflowDefinition } from '../../../shared/workflows.js';

/** A template's translatable text: stored as `defaultValue`, shown as `key` in `ns` while unchanged. */
export interface WorkflowTemplateText {
  readonly key: string;
  readonly ns: string;
  readonly defaultValue: string;
}

export interface WorkflowTemplate {
  /** The workflow's `builtInKey`: `^[a-z][A-Za-z0-9]{1,63}$`, unique across templates. */
  readonly key: string;
  /** Its stored name, in English; unique among workflows. */
  readonly name: string;
  /** Its name in the reader's language while nobody renamed it. */
  readonly title?: KindTitle;
  /**
   * Its stored description: a plain string, or an i18n key in the contributing plugin's namespace whose
   * `defaultValue` (English) is stored and translated for the reader while nobody changed it.
   */
  readonly description?: string | WorkflowTemplateText;
  readonly definition: WorkflowDefinition;
  /**
   * Installed as the default workflow when no workflow is the default at that moment (and the issues on the built-in
   * statuses all have their status in it). Afterwards the administrators choose the default.
   */
  readonly makeDefault?: boolean;
}

/** Installs one template; what it returns or throws is its own business (the plugin logs a failure). */
export type WorkflowTemplateInstaller = (
  template: WorkflowTemplate,
) => Promise<unknown>;

export interface WorkflowTemplates {
  /** Adds a template; returns what removes it (an installed workflow stays). */
  add(template: WorkflowTemplate): () => void;
  get(key: string): WorkflowTemplate | undefined;
  list(): readonly WorkflowTemplate[];
  /**
   * Resolves once every template added so far has been installed, or failed to be. Never rejects. A template added
   * before the plugin booted waits for it, so call this after the plugins' `boot()` (from a provider's `boot()`
   * registered after the plugins, or from `start()`/`ready()`).
   */
  installed(): Promise<void>;
  /**
   * Installs each template with `installer`: those added before now, then each one as it is added. The plugin calls it
   * once, at boot; returns what stops it.
   */
  installWith(installer: WorkflowTemplateInstaller): () => void;
}

const KEY = /^[a-z][A-Za-z0-9]{1,63}$/u;

const ignore = (): void => undefined;

export function createWorkflowTemplates(): WorkflowTemplates {
  const templates = new Map<string, WorkflowTemplate>();
  /** Each template's installation, settled once it is a workflow (or failed to become one). */
  const installations = new Map<string, Promise<void>>();
  /** Templates added while nothing installs them, with what settles their installation. */
  const waiting = new Map<string, () => void>();
  let installer: WorkflowTemplateInstaller | undefined;

  const run = (template: WorkflowTemplate): Promise<void> => {
    const install = installer;
    if (!install) return Promise.resolve();
    try {
      return install(template).then(ignore, ignore);
    } catch {
      return Promise.resolve();
    }
  };

  return {
    add(template) {
      if (!KEY.test(template.key))
        throw new TypeError(
          `Workflow template ${template.key} must match ${String(KEY)}.`,
        );
      if (templates.has(template.key))
        throw new TypeError(
          `Workflow template ${template.key} is registered already.`,
        );
      templates.set(template.key, template);
      installations.set(
        template.key,
        installer
          ? run(template)
          : new Promise<void>((resolve) => {
              waiting.set(template.key, resolve);
            }),
      );
      return () => {
        if (templates.get(template.key) !== template) return;
        templates.delete(template.key);
        waiting.get(template.key)?.();
        waiting.delete(template.key);
      };
    },
    get: (key) => templates.get(key),
    list: () => [...templates.values()],
    async installed() {
      await Promise.all(installations.values());
    },
    installWith(next) {
      installer = next;
      for (const [key, settle] of [...waiting]) {
        waiting.delete(key);
        const template = templates.get(key);
        if (template) void run(template).then(settle);
        else settle();
      }
      return () => {
        if (installer === next) installer = undefined;
      };
    },
  };
}
