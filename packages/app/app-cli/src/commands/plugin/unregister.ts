import { AppCommand } from '../../context.ts';
import PluginRemove from './remove.ts';
import {
  addDependencyCommand,
  appPackageManager,
  declaredDependencyRange,
} from '../../lib/plugin-install.ts';
import {
  applyPluginRegistration,
  planPluginUnregistration,
  pluginPackageName,
} from '../../lib/plugin-registration.ts';
import {
  classifyPluginError,
  pluginPlanForJson,
} from '../../lib/plugin-json.ts';
import { runCommand } from '../../lib/run-command.ts';
import { resolveAppRoot } from '../../lib/workspace-app.ts';
import { checkRetainedPluginReferences } from '../../lib/plugin-references.ts';

export default class PluginUnregister extends AppCommand {
  static override summary =
    'Remove runtime registrations and retain the plugin and its Skills for development.';
  static override examples: typeof PluginRemove.examples =
    PluginRemove.examples;
  static override args: typeof PluginRemove.args = PluginRemove.args;
  static override flags: typeof PluginRemove.flags = PluginRemove.flags;

  public async run(): Promise<unknown> {
    const { args, flags } = await this.parse(PluginUnregister);
    try {
      const appRoot = await resolveAppRoot({
        app: flags.app,
        dir: flags.dir,
        workspaceRoot: flags['workspace-root'],
      });
      const packageName = pluginPackageName(args.name);
      const retainRange = await declaredDependencyRange(appRoot, packageName);
      const plan = await planPluginUnregistration({
        appRoot,
        packageName,
        retainRange,
      });
      if (
        plan.manualClientEdit ||
        plan.manualServerEdit ||
        plan.manualCliEdit
      ) {
        throw new Error(
          'Install TypeScript in the application to safely remove its composition entries.',
        );
      }
      if (!plan.changed) {
        this.setStatus('success-noop');
        return { appRoot, packageName, changed: false };
      }
      if (!retainRange)
        throw new Error(
          `Restore the missing dependency declaration for ${packageName} before unregistering it.`,
        );
      await checkRetainedPluginReferences(appRoot, plan);
      const invocation =
        !flags['no-install'] && plan.removedFrom.includes('dependencies')
          ? addDependencyCommand(
              await appPackageManager(appRoot),
              `${packageName}@${retainRange}`,
              true,
            )
          : undefined;
      const result = {
        appRoot,
        packageName,
        plan: pluginPlanForJson(plan),
        commands: invocation
          ? [
              {
                command: invocation.packageManager,
                args: invocation.args,
                cwd: appRoot,
              },
            ]
          : [],
      };
      if (flags['dry-run']) {
        this.setStatus('success-noop');
        this.log(
          `Would unregister ${packageName} and keep it as a development dependency.`,
        );
        return result;
      }
      if (invocation)
        await runCommand(invocation.packageManager, [...invocation.args], {
          cwd: appRoot,
        });
      // The package manager owns the manifest and lockfile. Re-read its manifest before applying source edits.
      await applyPluginRegistration(
        appRoot,
        await planPluginUnregistration({ appRoot, packageName, retainRange }),
      );
      this.log(
        `Unregistered ${packageName}; its development dependency and Skills are retained.`,
      );
      return result;
    } catch (error) {
      throw classifyPluginError(error);
    }
  }
}
