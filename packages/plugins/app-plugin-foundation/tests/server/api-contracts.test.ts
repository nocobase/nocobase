import ts from 'typescript';
import { expect, it } from 'vitest';
import { importedContract } from '../../server/api-contracts.js';
import { SourceEvidence } from '../../server/source-evidence.js';

it.each([
  ['hono', 'Hono'],
  ['hono/body-limit', 'bodyLimit'],
  ['@nocobase/app-server/router', 'defineApiRoutes'],
  ['@nocobase/app-server/router', 'defineRootRoutes'],
  ['@nocobase/app-server/router', 'apiErrorHandler'],
  ['@nocobase/app-server/router', 'describeRoute'],
  ['@nocobase/app-server/router', 'apiValidator'],
  ['@nocobase/db', 'databaseManagerToken'],
  ['@nocobase/app-plugin-authentication', 'authenticationToken'],
])(
  'requires external provenance for %s#%s, including renamed imports',
  (module, name) => {
    const file = '/fixture/routes.js';
    const ast = ts.createSourceFile(
      file,
      `import {${name} as renamed} from '${module}'; renamed;`,
      ts.ScriptTarget.Latest,
      true,
    );
    const reference = (ast.statements[1] as ts.ExpressionStatement).expression;
    const sources = [{ file, ast }];
    expect(
      importedContract(
        reference,
        new SourceEvidence(sources, new Map()),
        module,
        name,
      ),
    ).toBe(true);
    expect(
      importedContract(
        reference,
        new SourceEvidence(
          sources,
          new Map([[`${file}\0${module}`, '/fixture/stop.js']]),
        ),
        module,
        name,
      ),
    ).toBe(false);
    expect(
      importedContract(
        reference,
        new SourceEvidence(
          sources,
          new Map(),
          (specifier) => specifier === module,
        ),
        module,
        name,
      ),
    ).toBe(false);
  },
);
