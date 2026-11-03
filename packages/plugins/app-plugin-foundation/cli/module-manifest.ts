import { AppCommand } from '@nocobase/app-cli';

export default class BuildModuleManifest extends AppCommand {
  static override summary =
    'Preserve Foundation module associations in the deployment.';

  public async run(): Promise<{
    readonly routes: number;
    readonly complete: boolean;
  }> {
    await this.parse(BuildModuleManifest);
    const { writeModuleManifest } =
      await import('../server/module-manifest.js');
    const result = await writeModuleManifest(this.rootDir);
    this.log(`Preserved ${result.routes} Foundation route associations.`);
    return result;
  }
}
