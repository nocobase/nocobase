// `@nocobase/app-cli-client/parse`: how a command line is read against a manifest command, and the help built from the
// manifest, with no file, environment or terminal of its own. The CLI reads its lines with it, and so does the `acme`
// command of an online run's shell, through a `CliParseIo` over that shell's files and environment.
export {
  accepts,
  CliParseError,
  envDefaultOf,
  commandWords,
  missingArguments,
  needsLocalFiles,
  parameterLabel,
  parseCommandLine,
  positionalOf,
  type CliCall,
  type CliFileRef,
  type CliParseIo,
  type CliParseOptions,
} from './arguments.ts';
export { apiExitCode } from './exit.ts';
export {
  flagRows,
  helpColumns,
  renderCommandHelp,
  renderCommandList,
  renderTopicHelp,
  type CommandHelpOptions,
  type HelpRow,
} from './help.ts';
export type {
  CliCommand,
  CliEnvDefault,
  CliManifest,
  CliParameter,
  CliWithheldCommand,
} from './manifest.ts';
