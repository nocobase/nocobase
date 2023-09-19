
import { Options as TsupConfig } from 'tsup'
import { InlineConfig as ViteConfig } from 'vite'

export type PkgLog = (msg: string, ...args: any[]) => void;

interface UserConfig {
  modifyTsupConfig?: (config: TsupConfig) => TsupConfig;
  modifyViteConfig?: (config: ViteConfig) => ViteConfig;
  beforeBuild?: (log: PkgLog) => void | Promise<void>;
  afterBuild?: (log: PkgLog) => void | Promise<void>;
}

declare const defineConfig: (config: UserConfig) => UserConfig;
