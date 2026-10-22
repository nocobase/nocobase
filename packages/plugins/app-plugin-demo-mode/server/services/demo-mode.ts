import type { DemoModeSettings } from '../config.js';
import type { DemoModeService } from '../tokens.js';

export class DefaultDemoModeService implements DemoModeService {
  public readonly enabled: boolean;
  public readonly allowCollections: readonly string[];

  public constructor(settings: DemoModeSettings) {
    this.enabled = settings.enabled;
    this.allowCollections = [...settings.allowCollections];
  }
}
