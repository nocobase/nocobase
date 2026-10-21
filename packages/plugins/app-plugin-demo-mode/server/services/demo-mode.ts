import type { DemoMode, DemoModeSettings } from '../config.js';
import type { DemoModeService } from '../tokens.js';

export class DefaultDemoModeService implements DemoModeService {
  public readonly mode: DemoMode;
  public readonly allowTables: readonly string[];

  public constructor(settings: DemoModeSettings) {
    this.mode = settings.mode;
    this.allowTables = [...settings.allowTables];
  }
}
