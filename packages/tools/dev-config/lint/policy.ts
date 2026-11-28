export const typescriptFiles: string[] = ['**/*.{ts,tsx,mts,cts}'];
export const reactFiles: string[] = ['**/*.{js,jsx,ts,tsx}'];
export const testFiles: string[] = [
  '**/*.{test,spec}.{js,jsx,ts,tsx,mts,cts}',
  '**/{test,tests}/**/*.{js,mjs,cjs,ts,tsx,mts,cts}',
  '**/e2e/**/*.{js,mjs,cjs,ts,tsx,mts,cts}',
];
export const toolingFiles: string[] = [
  '**/*.{config,setup}.{ts,mts,cts}',
  '**/scripts/**/*.{ts,mts,cts}',
  '**/cli/**/*.{ts,mts,cts}',
];
export const applicationClientFiles: string[] = [
  'client/**/*.{js,jsx,ts,tsx}',
  'registry/**/*.{js,jsx,ts,tsx}',
  'tests/**/*.{js,jsx,ts,tsx}',
];
export const applicationNodeFiles: string[] = [
  '*.{js,mjs,cjs}',
  'server/**/*.{js,mjs,cjs,ts,tsx,mts,cts}',
  'scripts/**/*.{js,mjs,cjs,ts,tsx,mts,cts}',
  'cli/**/*.{js,mjs,cjs,ts,tsx,mts,cts}',
  '*.config.{js,mjs,cjs,ts,mts,cts}',
];
export const commandFiles: string[] = [
  '**/cli/**/*.{js,mjs,cjs,ts,tsx,mts,cts}',
];
export const defaultIgnores: string[] = [
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/generated/**',
  '**/playwright-report/**',
  '**/test-results/**',
  // Skills are prose for agents to read. `.claude/skills/` holds symbolic links into `.agents/skills/` in an
  // application, written by `nocobase skills sync`, and both hold links into `skills/` in the monorepo, written by
  // `scripts/sync-skills.mjs`, so linting through one would report the same file twice and `--fix` would edit the
  // committed original.
  '**/.agents/skills/**',
  '**/.claude/skills/**',
];

export const browserApiFiles: string[] = [
  '{src,client,shared,registry,website}/**/*.{js,jsx,ts,tsx}',
];
export const applicationBrowserApiFiles: string[] = [
  '{client,shared,registry}/**/*.{js,jsx,ts,tsx}',
];
export const nonBrowserApiFiles: string[] = [
  '**/{server,cli,scripts,tests,test}/**',
];

interface SyntaxRestriction {
  selector: string;
  message: string;
}

interface PropertyRestriction {
  object?: string;
  property: string;
  message: string;
}

// The server renders runtime values into the page's client configuration. These four values are Vite build literals.
export const clientEnvRestrictions: SyntaxRestriction[] = [
  {
    selector:
      "MemberExpression[object.type='MemberExpression'][object.object.type='MetaProperty'][object.property.name='env']:not([property.name=/^(PROD|DEV|MODE|BASE_URL)$/])",
    message:
      'Read runtime values from the client configuration (resolveAppUrl, useClientApplication().config); use resolveAssetUrl for built assets. import.meta.env is limited to PROD, DEV, MODE and BASE_URL.',
  },
];
export const browserApiRestrictions: PropertyRestriction[] = [
  {
    property: 'randomUUID',
    message:
      'Use createUuid() from @nocobase/app-client for HTTP-compatible UUIDs.',
  },
  {
    property: 'clipboard',
    message:
      'Use copyText() from @nocobase/app-client for HTTP-compatible copying and handle its result.',
  },
];

const appServerNode = '@nocobase/app-server/node';
const useWithApp =
  'Use withApp() from AppCommand instead of creating the application yourself.';

export const commandImportRestrictions: {
  paths: { name: string; message: string }[];
} = {
  paths: [{ name: appServerNode, message: useWithApp }],
};
export const commandPropertyRestrictions: PropertyRestriction[] = [
  {
    object: 'process',
    property: 'cwd',
    message:
      'Use this.rootDir for application files, or an appPath() flag for paths the user passes.',
  },
];
export const commandSyntaxRestrictions: SyntaxRestriction[] = [
  {
    selector: `ImportExpression[source.value='${appServerNode}']`,
    message: useWithApp,
  },
  {
    selector:
      "CallExpression[callee.object.name='console'][callee.property.name=/^(log|info|debug|table)$/]",
    message:
      'Use this.log for text and return the result from run(); console output bypasses --json.',
  },
  {
    selector:
      "CallExpression[callee.object.type='ThisExpression'][callee.property.name='exit']",
    message:
      'Return the result or throw CommandError instead of calling exit().',
  },
  {
    selector:
      "CallExpression[callee.object.type='ThisExpression'][callee.property.name='logJson']",
    message:
      'Return the result from run(); AppCommand prints the --json document.',
  },
];
export const additionalTestBlockFunctions: string[] = [
  'test',
  'it',
  'describeMigration',
];
