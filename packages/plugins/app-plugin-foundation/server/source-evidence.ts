import ts from 'typescript';
import { StaticValues } from './static-values.js';
import { NativeInitialization } from './native-initialization.js';

export interface EvidenceSource {
  readonly file: string;
  readonly ast: ts.SourceFile;
}

type CandidateWrite =
  ts.BinaryExpression | ts.ForInStatement | ts.ForOfStatement;

/** Package-local value reachability. The host never loads dependencies, libraries or application code. */
export class SourceEvidence {
  // Syntax-only write sites are shared by candidates in the same scope. Reachability is
  // evaluated with the current invocation, never cached across bindings or captures.
  private readonly candidateWriteIndexes = new WeakMap<
    ts.Node,
    {
      complete: boolean;
      writes: Map<ts.Declaration, CandidateWrite[]>;
    }
  >();

  private candidateWrites(
    declaration: ts.Declaration,
  ): readonly CandidateWrite[] | undefined {
    let scope: ts.Node = declaration.parent;
    while (!ts.isFunctionLike(scope) && !ts.isSourceFile(scope))
      scope = scope.parent;
    let index = this.candidateWriteIndexes.get(scope);
    if (!index) {
      index = { complete: true, writes: new Map() };
      this.candidateWriteIndexes.set(scope, index);
      let visits = 0;
      const recordTarget = (target: ts.Node, write: CandidateWrite): void => {
        if (++visits > 100_000) {
          index!.complete = false;
          return;
        }
        while (
          ts.isParenthesizedExpression(target) ||
          ts.isAsExpression(target) ||
          ts.isNonNullExpression(target) ||
          ts.isSatisfiesExpression(target)
        )
          target = target.expression;
        if (ts.isIdentifier(target)) {
          for (const binding of this.declarations(target)) {
            const writes = index!.writes.get(binding) ?? [];
            writes.push(write);
            index!.writes.set(binding, writes);
          }
        } else if (ts.isArrayLiteralExpression(target)) {
          for (const element of target.elements) recordTarget(element, write);
        } else if (ts.isObjectLiteralExpression(target)) {
          for (const property of target.properties) {
            if (ts.isPropertyAssignment(property))
              recordTarget(property.initializer, write);
            else if (ts.isShorthandPropertyAssignment(property))
              recordTarget(property.name, write);
            else if (ts.isSpreadAssignment(property))
              recordTarget(property.expression, write);
          }
        } else if (
          ts.isArrayBindingPattern(target) ||
          ts.isObjectBindingPattern(target)
        ) {
          for (const element of target.elements)
            if (ts.isBindingElement(element)) recordTarget(element.name, write);
        } else if (ts.isSpreadElement(target))
          recordTarget(target.expression, write);
        else if (
          ts.isBinaryExpression(target) &&
          target.operatorToken.kind === ts.SyntaxKind.EqualsToken
        )
          recordTarget(target.left, write);
      };
      const scan = (node: ts.Node): void => {
        if (++visits > 100_000) {
          index!.complete = false;
          return;
        }
        if (ts.isTypeNode(node)) return;
        if (StaticValues.isAssignment(node)) recordTarget(node.left, node);
        else if (ts.isForOfStatement(node) || ts.isForInStatement(node)) {
          if (ts.isVariableDeclarationList(node.initializer)) {
            for (const declaration of node.initializer.declarations)
              recordTarget(declaration.name, node);
          } else recordTarget(node.initializer, node);
        }
        if (ts.isBlock(node) || ts.isSourceFile(node)) {
          for (const statement of node.statements) {
            scan(statement);
            if (
              ts.isReturnStatement(statement) ||
              ts.isThrowStatement(statement)
            )
              break;
          }
        } else ts.forEachChild(node, scan);
      };
      scan(scope);
    }
    return index.complete ? (index.writes.get(declaration) ?? []) : undefined;
  }
  /** Syntactic binding writes include destructuring and loop targets; an incomplete index is unsafe. */
  public hasBindingWrites(declaration: ts.Declaration): boolean {
    const writes = this.candidateWrites(declaration);
    return writes === undefined || writes.length > 0;
  }

  public proofRevision = 0;
  // Changes whenever the set of authorized handlers changes (each route registration sets and restores it).
  public authorizationScope = 0;
  public authorizationIdentityResolved = false;
  /** Parsed sources of this analysis. */
  public evidenceSources(): ts.SourceFile[] {
    return [...this.sources.values()].map((source) => source.ast);
  }
  // Route handlers registered after the proven official authorization middleware on the same router and path.
  public readonly authorizedHandlers: WeakSet<ts.Node> = new WeakSet();
  // PROPOSAL (needs approval): every handler registered on an identified Hono router.
  public readonly routeHandlers: WeakSet<ts.Node> = new WeakSet();
  public readonly nativeInitialization: NativeInitialization;
  private readonly checker: ts.TypeChecker;
  private readonly symbols = new WeakMap<ts.Node, ts.Symbol | undefined>();
  private readonly declarationNodes = new WeakMap<
    ts.Node,
    readonly ts.Declaration[]
  >();
  private readonly sources: Map<string, EvidenceSource>;
  private readonly services = new Map<ts.Declaration, ts.Expression[]>();
  private readonly serviceReceivers = new Map<ts.Expression, ts.Expression>();
  private readonly serviceSummaries = new Map<
    ts.Expression,
    {
      readonly values: readonly ts.Node[];
      readonly scopes: ReadonlyMap<
        ts.Node,
        ReadonlyMap<ts.Declaration, readonly ts.Node[]>
      >;
    }
  >();

  /** Reuse one static registration's value summary, without sharing endpoint evidence or mutable scopes. */
  public serviceSummary(
    factory: ts.Expression,
    build: (receiver: ts.Expression | undefined) => {
      readonly values: readonly ts.Node[];
      readonly scopes: ReadonlyMap<
        ts.Node,
        ReadonlyMap<ts.Declaration, readonly ts.Node[]>
      >;
    },
  ): {
    readonly values: readonly ts.Node[];
    readonly scopes: ReadonlyMap<
      ts.Node,
      ReadonlyMap<ts.Declaration, readonly ts.Node[]>
    >;
  } {
    const known = this.serviceSummaries.get(factory);
    if (known) return known;
    this.serviceSummaries.set(factory, { values: [], scopes: new Map() });
    const revision = this.proofRevision;
    const summary = build(this.serviceReceivers.get(factory));
    if (revision === this.proofRevision)
      this.serviceSummaries.set(factory, summary);
    else this.serviceSummaries.delete(factory);
    return summary;
  }

  public constructor(
    sources: readonly EvidenceSource[],
    private readonly resolutions: ReadonlyMap<string, string>,
    private readonly isLocal: (specifier: string) => boolean = (specifier) =>
      /^[.#/]/.test(specifier),
    nativeProgram?: { sources: readonly EvidenceSource[]; complete: boolean },
    private readonly implementationImports: ReadonlySet<string> = new Set(),
  ) {
    this.sources = new Map(sources.map((source) => [source.file, source]));
    const options: ts.CompilerOptions = {
      noLib: true,
      noResolve: false,
      allowJs: true,
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
    };
    const host = ts.createCompilerHost(options);
    host.getSourceFile = (file) => this.sources.get(file)?.ast;
    host.readFile = () => undefined;
    host.fileExists = (file) => this.sources.has(file);
    host.resolveModuleNames = (names, from) =>
      names.map((name) => {
        const file = resolutions.get(`${from}\0${name}`);
        return file ? { resolvedFileName: file } : undefined;
      });
    this.checker = ts
      .createProgram([...this.sources.keys()], options, host)
      .getTypeChecker();
    this.nativeInitialization = new NativeInitialization(
      this,
      (nativeProgram?.sources ?? sources).map((source) => source.ast),
      nativeProgram?.complete ?? true,
    );
  }

  /** Only declarations reachable from the provider entry establish service registrations. */
  public registerServices(entries: readonly string[]): void {
    const calls = new Set<ts.Node>();
    const visit = (node: ts.Node): void => {
      if (calls.has(node)) return;
      calls.add(node);
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ['singleton', 'instance'].includes(node.expression.name.text)
      ) {
        const [token, factory] = node.arguments;
        const declaration = token && this.declarations(token)[0];
        if (declaration && factory) {
          this.serviceReceivers.set(factory, node.expression.expression);
          this.services.set(declaration, [
            ...(this.services.get(declaration) ?? []),
            factory,
          ]);
        }
      }
      if (ts.isBlock(node)) {
        for (const statement of node.statements) {
          visit(statement);
          // Registrations are still incomplete here: do not expand or cache resolved service summaries.
          if (
            new StaticValues(
              this,
              new Map(),
              undefined,
              undefined,
              false,
            ).definitelyTerminates(statement)
          )
            break;
        }
        return;
      }
      // Providers often split registration into private methods on the same instance. Only an
      // explicit local call reaches those methods; merely declaring another method does not.
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.expression.kind === ts.SyntaxKind.ThisKeyword
      )
        for (const declaration of this.declarations(node.expression))
          if (ts.isMethodDeclaration(declaration) && declaration.body)
            visit(declaration.body);
      ts.forEachChild(node, visit);
    };
    for (const entry of entries)
      for (const nodes of this.collect(entry).nodes.values()) {
        for (const node of nodes) {
          if (ts.isCallExpression(node)) visit(node);
          if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
            for (const member of node.members)
              if (
                ts.isMethodDeclaration(member) &&
                ['register', 'boot'].includes(member.name.getText())
              )
                visit(member);
          }
        }
      }
  }

  public collect(
    file: string,
    roots?: readonly ts.Node[],
    contextualCalls = false,
    discardUnsafe = false,
  ): {
    references: Set<string>;
    collections: Set<string>;
    nodes: Map<string, Set<ts.Node>>;
    complete: boolean;
    unsafeCapability: boolean;
    unsafeValue: boolean;
  } {
    const references = new Set<string>();
    const collections = new Set<string>();
    const nodes = new Map<string, Set<ts.Node>>();
    const visited = new Map<ts.Node, Set<string>>();
    const rootFunctions = new Set<ts.SignatureDeclaration>(
      (roots ?? []).flatMap((root) => [
        ...(ts.isFunctionLike(root) ? [root] : []),
        ...this.functions(root),
      ]),
    );
    const symbols = new Set<ts.Symbol>();
    const captures = new Map<
      ts.Node,
      ReadonlyMap<ts.Declaration, readonly ts.Node[]>
    >();
    let complete = true;
    let unsafeCapabilityEscaped = false;
    let unsafeValueEscaped = false;
    let visits = 0;
    const locations = new Map<string, number>();
    const nodeKeys = new WeakMap<ts.Node, number>();
    const nodeKey = (node: ts.Node): number => {
      const known = nodeKeys.get(node);
      if (known !== undefined) return known;
      // Materialized iteration values share source syntax but have distinct invocation identities.
      const location =
        node.pos < 0
          ? `generated:${locations.size}`
          : `${node.getSourceFile().fileName}:${node.getStart()}`;
      const key = locations.get(location) ?? locations.size;
      locations.set(location, key);
      nodeKeys.set(node, key);
      return key;
    };
    // Invocation environments are immutable during traversal. Reuse the existing canonical key
    // rather than rebuilding and retaining the same long string at every syntax node.
    const contextKeys = new WeakMap<
      ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
      WeakMap<ReadonlySet<ts.Node>, string>
    >();
    const contextKey = (
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
      active: ReadonlySet<ts.Node>,
    ): string => {
      const known = contextKeys.get(bindings)?.get(active);
      if (known !== undefined) return known;
      const key = [
        ...[...bindings]
          .map(
            ([declaration, values]) =>
              `${nodeKey(declaration)}=${values.map(nodeKey).join(',')}`,
          )
          .sort(),
        ...[...active].map(nodeKey).sort(),
      ].join('|');
      const contexts =
        contextKeys.get(bindings) ??
        new WeakMap<ReadonlySet<ts.Node>, string>();
      contexts.set(active, key);
      contextKeys.set(bindings, contexts);
      return key;
    };
    const statementBarrier = (
      node: ts.Node,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
    ): 'continues' | 'terminates' | 'unknown' =>
      new StaticValues(this, bindings, captures).statementBarrier(node);
    // False after an unknown barrier: the reachable suffix is still checked for escapes and writes that invalidate
    // evidence, but adds no references, collections or selected nodes.
    let collecting = true;
    // Unknown conditions can still choose only closed data objects. Inspect every arm;
    // unresolved values and non-object arms remain an escape barrier.
    const spreadObjects = (
      node: ts.Node,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
      seen = new Set<ts.Node>(),
    ): readonly ts.ObjectLiteralExpression[] | undefined => {
      if (seen.has(node) || seen.size >= 32) return undefined;
      const next = new Set(seen).add(node);
      const values = new StaticValues(this, bindings, captures).values(node);
      if (values.length)
        return values.every(ts.isObjectLiteralExpression) ? values : undefined;
      if (ts.isIdentifier(node)) {
        const declarations = this.declarations(node);
        const declaration =
          declarations.length === 1 ? declarations[0] : undefined;
        return declaration &&
          !bindings.has(declaration) &&
          ts.isVariableDeclaration(declaration) &&
          declaration.initializer &&
          ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const
          ? spreadObjects(declaration.initializer, bindings, next)
          : undefined;
      }
      if (
        ts.isParenthesizedExpression(node) ||
        ts.isAsExpression(node) ||
        ts.isSatisfiesExpression(node) ||
        ts.isNonNullExpression(node)
      )
        return spreadObjects(node.expression, bindings, next);
      if (!ts.isConditionalExpression(node)) return undefined;
      const yes = spreadObjects(node.whenTrue, bindings, next);
      const no = spreadObjects(node.whenFalse, bindings, next);
      return yes && no && yes.length + no.length <= 32
        ? [...yes, ...no]
        : undefined;
    };
    const capability = (
      node: ts.Node,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
      seen = new Set<ts.Node>(),
    ): boolean => {
      if (seen.has(node) || seen.size >= 32) return true;
      seen = new Set(seen).add(node);
      if (ts.isIdentifier(node)) {
        if (node.text === 'container') return true;
        const bound = this.declarations(node).flatMap(
          (declaration) => bindings.get(declaration) ?? [],
        );
        if (bound.length)
          return bound.some((item) => capability(item, bindings, seen));
      }
      const literals = new StaticValues(this, bindings, captures);
      return literals.values(node).some((value) => {
        if (
          ts.isPropertyAccessExpression(value) &&
          value.name.text === 'container'
        )
          return true;
        if (
          ts.isCallExpression(value) &&
          ts.isPropertyAccessExpression(value.expression) &&
          value.expression.name.text === 'resolve'
        )
          return true;
        if (
          ts.isIdentifier(value) &&
          value.text === 'container' &&
          !this.declarations(value).length
        )
          return true;
        // A returned object's properties are read with the bindings of the call that built it.
        if (ts.isObjectLiteralExpression(value)) {
          const scope = captures.get(value) ?? bindings;
          return value.properties.some((property) =>
            ts.isPropertyAssignment(property)
              ? capability(property.initializer, scope, seen)
              : ts.isShorthandPropertyAssignment(property)
                ? capability(property.name, scope, seen)
                : ts.isSpreadAssignment(property)
                  ? (() => {
                      const objects = spreadObjects(
                        property.expression,
                        bindings,
                      );
                      return (
                        !objects ||
                        objects.some((object) =>
                          capability(object, bindings, seen),
                        )
                      );
                    })()
                  : true,
          );
        }
        if (ts.isArrayLiteralExpression(value))
          return value.elements.some(
            (element) =>
              !ts.isSpreadElement(element) &&
              capability(element, bindings, seen),
          );
        if (ts.isFunctionLike(value)) {
          const captured = captures.get(value);
          return (
            captured !== undefined &&
            [...captured.values()].some((items) =>
              items.some((item) => capability(item, captured, seen)),
            )
          );
        }
        return false;
      });
    };
    const candidateValue = (
      node: ts.Node,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
      seen = new Set<ts.Node>(),
      budget = { visits: 0 },
    ): boolean => {
      if (seen.has(node) || seen.size >= 32 || ++budget.visits > 2048)
        return true;
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'resolve' &&
        node.arguments.length === 1 &&
        (this.serviceFactories(node.arguments[0]) !== undefined ||
          this.externalService(node.arguments[0]) === '@nocobase/db')
      )
        return true;
      const next = new Set(seen).add(node);
      let source = node;
      while (
        ts.isParenthesizedExpression(source) ||
        ts.isAsExpression(source) ||
        ts.isTypeAssertionExpression(source) ||
        ts.isNonNullExpression(source) ||
        ts.isSatisfiesExpression(source)
      )
        source = source.expression;
      const evaluator = new StaticValues(this, bindings, captures);
      const choicesFor = (
        expression: ts.Node,
        ignoredWrite?: ts.BinaryExpression,
      ): boolean[] => {
        let stable = true;
        const checked = new Set<ts.Node>();
        const check = (value: ts.Node): void => {
          if (!stable || checked.has(value)) return;
          if (checked.size >= 2048) {
            stable = false;
            return;
          }
          checked.add(value);
          if (
            ts.isObjectLiteralExpression(value) ||
            ts.isArrayLiteralExpression(value) ||
            ts.isFunctionLike(value)
          )
            return;
          if (ts.isIdentifier(value)) {
            for (const declaration of this.declarations(value)) {
              if (
                ts.isVariableDeclaration(declaration) ||
                ts.isBindingElement(declaration) ||
                ts.isParameter(declaration)
              ) {
                const writes = this.candidateWrites(declaration);
                if (!writes || writes.some((write) => write !== ignoredWrite)) {
                  stable = false;
                  return;
                }
                const bound = bindings.get(declaration);
                if (bound) bound.forEach(check);
                else if (declaration.initializer)
                  check(declaration.initializer);
              }
            }
          } else ts.forEachChild(value, check);
        };
        check(expression);
        if (!stable) return [];
        const choices = evaluator.booleans(expression);
        if (choices.length) return choices;
        const values = evaluator.values(expression);
        return values.length &&
          values.every(
            (value) =>
              ts.isObjectLiteralExpression(value) ||
              ts.isArrayLiteralExpression(value) ||
              ts.isFunctionLike(value),
          )
          ? [true]
          : [];
      };
      if (source !== node)
        return candidateValue(source, bindings, next, budget);
      if (ts.isIdentifier(source)) {
        const declarations = this.declarations(source);
        const origins: ts.Node[] = [];
        for (const declaration of declarations) {
          const bound = bindings.get(declaration);
          if (bound) origins.push(...bound);
          else if (
            ts.isVariableDeclaration(declaration) &&
            declaration.initializer
          )
            origins.push(declaration.initializer);
          if (
            ((ts.isVariableDeclaration(declaration) ||
              ts.isBindingElement(declaration)) &&
              !(ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const)) ||
            ts.isParameter(declaration)
          ) {
            const writes = this.candidateWrites(declaration);
            if (!writes) return true;
            for (const write of writes) {
              if (++budget.visits > 2048) return true;
              let reachable = true;
              let child: ts.Node = write;
              for (
                let parent = child.parent;
                parent &&
                !ts.isFunctionLike(parent) &&
                !ts.isSourceFile(parent);
                child = parent, parent = parent.parent
              ) {
                if (
                  ts.isBinaryExpression(parent) &&
                  child === parent.right &&
                  parent.operatorToken.kind ===
                    ts.SyntaxKind.QuestionQuestionToken &&
                  choicesFor(parent.left).length
                ) {
                  const left = evaluator.values(parent.left);
                  if (
                    left.length &&
                    left.every(
                      (value) =>
                        ts.isObjectLiteralExpression(value) ||
                        ts.isArrayLiteralExpression(value) ||
                        ts.isFunctionLike(value) ||
                        ts.isStringLiteralLike(value) ||
                        ts.isNumericLiteral(value) ||
                        value.kind === ts.SyntaxKind.TrueKeyword ||
                        value.kind === ts.SyntaxKind.FalseKeyword,
                    )
                  ) {
                    reachable = false;
                    break;
                  }
                }
                let condition: ts.Expression | undefined;
                let expected: boolean | undefined;
                if (ts.isIfStatement(parent) && child !== parent.expression) {
                  condition = parent.expression;
                  expected = child === parent.thenStatement;
                } else if (
                  ts.isConditionalExpression(parent) &&
                  child !== parent.condition
                ) {
                  condition = parent.condition;
                  expected = child === parent.whenTrue;
                } else if (
                  ts.isBinaryExpression(parent) &&
                  child === parent.right &&
                  [
                    ts.SyntaxKind.AmpersandAmpersandToken,
                    ts.SyntaxKind.BarBarToken,
                  ].includes(parent.operatorToken.kind)
                ) {
                  condition = parent.left;
                  expected =
                    parent.operatorToken.kind ===
                    ts.SyntaxKind.AmpersandAmpersandToken;
                } else if (
                  ts.isWhileStatement(parent) &&
                  child === parent.statement
                ) {
                  condition = parent.expression;
                  expected = true;
                }
                if (condition) {
                  const choices = choicesFor(condition);
                  if (choices.length === 1 && choices[0] !== expected) {
                    reachable = false;
                    break;
                  }
                }
              }
              if (!reachable) continue;
              // A reachable pattern or iteration write has no single enumerable RHS for this binding.
              if (!ts.isBinaryExpression(write)) return true;
              let target: ts.Node = write.left;
              while (
                ts.isParenthesizedExpression(target) ||
                ts.isAsExpression(target) ||
                ts.isNonNullExpression(target) ||
                ts.isSatisfiesExpression(target)
              )
                target = target.expression;
              if (!ts.isIdentifier(target)) return true;
              if (
                ![
                  ts.SyntaxKind.EqualsToken,
                  ts.SyntaxKind.BarBarEqualsToken,
                  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
                  ts.SyntaxKind.QuestionQuestionEqualsToken,
                ].includes(write.operatorToken.kind)
              )
                continue;
              if (
                [
                  ts.SyntaxKind.BarBarEqualsToken,
                  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
                ].includes(write.operatorToken.kind)
              ) {
                const choices = choicesFor(write.left, write);
                const rightWhen =
                  write.operatorToken.kind ===
                  ts.SyntaxKind.AmpersandAmpersandEqualsToken;
                if (choices.length === 1 && choices[0] !== rightWhen) continue;
              }
              if (
                write.operatorToken.kind ===
                  ts.SyntaxKind.QuestionQuestionEqualsToken &&
                choicesFor(write.left, write).length
              ) {
                const left = evaluator.values(write.left);
                if (
                  left.length &&
                  left.every(
                    (value) =>
                      ts.isObjectLiteralExpression(value) ||
                      ts.isArrayLiteralExpression(value) ||
                      ts.isFunctionLike(value) ||
                      ts.isStringLiteralLike(value) ||
                      ts.isNumericLiteral(value) ||
                      value.kind === ts.SyntaxKind.TrueKeyword ||
                      value.kind === ts.SyntaxKind.FalseKeyword,
                  )
                )
                  continue;
              }
              origins.push(write.right);
            }
          }
        }
        if (origins.length)
          return origins.some((origin) =>
            candidateValue(origin, bindings, next, budget),
          );
      }
      if (ts.isConditionalExpression(source)) {
        const choices = choicesFor(source.condition);
        const branches =
          choices.length === 1
            ? [choices[0] ? source.whenTrue : source.whenFalse]
            : [source.whenTrue, source.whenFalse];
        return branches.some((branch) =>
          candidateValue(branch, bindings, next, budget),
        );
      }
      if (
        ts.isBinaryExpression(source) &&
        source.operatorToken.kind === ts.SyntaxKind.CommaToken
      )
        return candidateValue(source.right, bindings, next, budget);
      if (
        ts.isBinaryExpression(source) &&
        [
          ts.SyntaxKind.BarBarToken,
          ts.SyntaxKind.AmpersandAmpersandToken,
        ].includes(source.operatorToken.kind)
      ) {
        const choices = choicesFor(source.left);
        const rightWhen =
          source.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken;
        const branches =
          choices.length === 1
            ? [choices[0] === rightWhen ? source.right : source.left]
            : [source.left, source.right];
        return branches.some((branch) =>
          candidateValue(branch, bindings, next, budget),
        );
      }
      if (
        ts.isBinaryExpression(source) &&
        source.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
      ) {
        const left = evaluator.values(source.left);
        const nonNull =
          left.length > 0 &&
          left.every(
            (item) =>
              ts.isObjectLiteralExpression(item) ||
              ts.isArrayLiteralExpression(item) ||
              ts.isFunctionLike(item) ||
              ts.isStringLiteralLike(item) ||
              ts.isNumericLiteral(item) ||
              item.kind === ts.SyntaxKind.TrueKeyword ||
              item.kind === ts.SyntaxKind.FalseKeyword,
          );
        return (
          candidateValue(source.left, bindings, next, budget) ||
          (!nonNull && candidateValue(source.right, bindings, next, budget))
        );
      }
      const values = new StaticValues(this, bindings, captures).values(node);
      return values.some((value) => {
        if (ts.isArrayLiteralExpression(value))
          return value.elements.some(
            (item) =>
              !ts.isSpreadElement(item) &&
              candidateValue(item, bindings, next, budget),
          );
        if (ts.isObjectLiteralExpression(value)) {
          const scope = captures.get(value) ?? bindings;
          return value.properties.some((property) =>
            ts.isPropertyAssignment(property)
              ? candidateValue(property.initializer, scope, next, budget)
              : ts.isShorthandPropertyAssignment(property)
                ? candidateValue(property.name, scope, next, budget)
                : ts.isMethodDeclaration(property) ||
                  ts.isGetAccessorDeclaration(property) ||
                  ts.isSetAccessorDeclaration(property),
          );
        }
        if (ts.isFunctionLike(value)) {
          const captured = captures.get(value);
          return Boolean(
            captured &&
            [...captured.values()].some((items) =>
              items.some((item) =>
                candidateValue(item, captured, next, budget),
              ),
            ),
          );
        }
        return (
          ts.isCallExpression(value) &&
          ts.isPropertyAccessExpression(value.expression) &&
          value.expression.name.text === 'resolve' &&
          value.arguments.length === 1 &&
          (this.serviceFactories(value.arguments[0]) !== undefined ||
            this.externalService(value.arguments[0]) === '@nocobase/db')
        );
      });
    };
    const exported = (
      target: string,
      name: string,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]> = new Map(),
      active: ReadonlySet<ts.Node> = new Set(),
    ): void => {
      const ast = this.sources.get(target)?.ast;
      const symbol = ast && this.checker.getSymbolAtLocation(ast);
      const value =
        symbol &&
        this.checker
          .getExportsOfModule(symbol)
          .find((item) => item.name === name);
      if (!value) {
        complete = false;
        return;
      }
      follow(value, bindings, active);
    };
    const imported = (
      declaration: ts.Node,
      name?: string,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]> = new Map(),
      active: ReadonlySet<ts.Node> = new Set(),
    ): boolean => {
      let statement: ts.Node | undefined = declaration;
      while (
        statement &&
        !ts.isImportDeclaration(statement) &&
        !ts.isExportDeclaration(statement)
      )
        statement = statement.parent;
      if (
        !statement ||
        !statement.moduleSpecifier ||
        !ts.isStringLiteralLike(statement.moduleSpecifier)
      )
        return false;
      const specifier = statement.moduleSpecifier.text;
      const target = this.resolutions.get(
        `${statement.getSourceFile().fileName}\0${specifier}`,
      );
      if (!target) {
        if (this.isLocal(specifier)) complete = false;
        else references.add(specifier);
      } else if (name) exported(target, name, bindings, active);
      else complete = false;
      return true;
    };
    const follow = (
      symbol: ts.Symbol,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
      active: ReadonlySet<ts.Node>,
    ): void => {
      if (symbols.has(symbol)) return;
      symbols.add(symbol);
      for (const declaration of symbol.declarations ?? []) {
        if (
          ts.isImportSpecifier(declaration) ||
          ts.isExportSpecifier(declaration)
        ) {
          if (
            declaration.isTypeOnly ||
            (ts.isExportSpecifier(declaration) &&
              declaration.parent.parent.isTypeOnly)
          )
            continue;
          if (
            imported(
              declaration,
              declaration.propertyName?.text ?? declaration.name.text,
              bindings,
              active,
            )
          )
            continue;
          if (ts.isExportSpecifier(declaration)) {
            const local =
              this.checker.getExportSpecifierLocalTargetSymbol(declaration);
            if (local) follow(local, bindings, active);
            else complete = false;
            continue;
          }
          if (symbol.flags & ts.SymbolFlags.Alias)
            follow(this.checker.getAliasedSymbol(symbol), bindings, active);
        } else if (ts.isImportClause(declaration)) {
          if (!declaration.isTypeOnly) imported(declaration, 'default');
        } else if (ts.isNamespaceImport(declaration)) {
          imported(declaration);
        } else if (this.sources.has(declaration.getSourceFile().fileName)) {
          visit(declaration, bindings, active);
        }
      }
    };
    const visit = (
      node: ts.Node,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]> = new Map(),
      active: ReadonlySet<ts.Node> = new Set(),
    ): void => {
      // Only dependency callers that discard unsafe slices may skip the remaining evidence.
      // Page discovery and diagnostic callers still need the complete traversal.
      if (
        contextualCalls &&
        discardUnsafe &&
        (unsafeCapabilityEscaped || unsafeValueEscaped)
      )
        return;
      if (ts.isTypeNode(node)) return;
      if (
        contextualCalls &&
        ts.isFunctionLike(node) &&
        !rootFunctions.has(node)
      )
        return;
      if (++visits > 100_000 || active.size >= 32) {
        complete = false;
        return;
      }
      const key =
        (contextualCalls ? contextKey(bindings, active) : '') +
        (collecting ? '' : '\0check');
      const contexts = visited.get(node) ?? new Set<string>();
      if (contexts.has(key)) return;
      if (contexts.size >= 32) {
        complete = false;
        return;
      }
      contexts.add(key);
      visited.set(node, contexts);
      const sourceFile = node.getSourceFile();
      if (collecting) {
        const selected = nodes.get(sourceFile.fileName) ?? new Set<ts.Node>();
        selected.add(node);
        nodes.set(sourceFile.fileName, selected);
      }
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
      const evaluate = (expression: ts.Node): boolean => {
        visit(expression, bindings, active);
        const barrier = new StaticValues(
          this,
          bindings,
          captures,
        ).expressionBarrier(expression);
        if (barrier === 'unknown') {
          collecting = false;
          complete = false;
        }
        return barrier !== 'terminates';
      };
      if (contextualCalls && ts.isConditionalExpression(node)) {
        if (!evaluate(node.condition)) return;
        const branches = new StaticValues(this, bindings, captures).booleans(
          node.condition,
        );
        const entry = collecting;
        let merged = entry;
        for (const branch of branches.length === 1
          ? [branches[0] ? node.whenTrue : node.whenFalse]
          : [node.whenTrue, node.whenFalse]) {
          collecting = entry;
          evaluate(branch);
          merged = merged && collecting;
        }
        collecting = merged;
        return;
      }
      if (contextualCalls && StaticValues.isAssignment(node)) {
        // Receiver, key, getter (compound/logical), value when reachable, setter: the order JavaScript runs them.
        // A write through a capability candidate invalidates evidence wherever it sits, as for any assignment.
        let written: ts.Node = node.left;
        while (
          (ts.isPropertyAccessExpression(written) ||
            ts.isElementAccessExpression(written)) &&
          written.expression
        )
          written = written.expression;
        const evaluator = new StaticValues(this, bindings, captures);
        // Writing a property every resolved receiver declares only as an accessor replaces no stored value: the setter
        // runs (and is checked below), or a getter-only property throws in module code.
        // A pattern's identifiers are rebound; only property references write through an existing value.
        // The pattern still has unknown completion below and contributes no new evidence after that barrier.
        const patternEvaluations: ts.Node[] = [];
        const patternWritesCapability = (target: ts.Node): boolean => {
          if (++visits > 100_000) return true;
          while (
            ts.isParenthesizedExpression(target) ||
            ts.isAsExpression(target) ||
            ts.isNonNullExpression(target) ||
            ts.isSatisfiesExpression(target)
          )
            target = target.expression;
          if (
            ts.isPropertyAccessExpression(target) ||
            ts.isElementAccessExpression(target)
          ) {
            patternEvaluations.push(target.expression);
            if (ts.isElementAccessExpression(target))
              patternEvaluations.push(target.argumentExpression);
            let receiver: ts.Node = target.expression;
            while (
              ts.isPropertyAccessExpression(receiver) ||
              ts.isElementAccessExpression(receiver)
            )
              receiver = receiver.expression;
            return candidateValue(receiver, bindings);
          }
          if (ts.isArrayLiteralExpression(target))
            return target.elements.some(patternWritesCapability);
          if (ts.isObjectLiteralExpression(target))
            return target.properties.some((property) => {
              if (property.name && ts.isComputedPropertyName(property.name))
                patternEvaluations.push(property.name.expression);
              if (
                ts.isShorthandPropertyAssignment(property) &&
                property.objectAssignmentInitializer
              )
                patternEvaluations.push(property.objectAssignmentInitializer);
              return ts.isPropertyAssignment(property)
                ? patternWritesCapability(property.initializer)
                : ts.isSpreadAssignment(property)
                  ? patternWritesCapability(property.expression)
                  : !ts.isShorthandPropertyAssignment(property);
            });
          if (ts.isSpreadElement(target))
            return patternWritesCapability(target.expression);
          if (
            ts.isBinaryExpression(target) &&
            target.operatorToken.kind === ts.SyntaxKind.EqualsToken
          ) {
            patternEvaluations.push(target.right);
            return patternWritesCapability(target.left);
          }
          return !ts.isIdentifier(target) && !ts.isOmittedExpression(target);
        };
        let assignmentTarget: ts.Node = node.left;
        while (
          ts.isParenthesizedExpression(assignmentTarget) ||
          ts.isAsExpression(assignmentTarget) ||
          ts.isNonNullExpression(assignmentTarget) ||
          ts.isSatisfiesExpression(assignmentTarget)
        )
          assignmentTarget = assignmentTarget.expression;
        const pattern =
          ts.isArrayLiteralExpression(assignmentTarget) ||
          ts.isObjectLiteralExpression(assignmentTarget);
        const throughCapability = pattern
          ? patternWritesCapability(assignmentTarget)
          : candidateValue(written, bindings);
        if (!evaluator.accessorOnlyWrite(node) && throughCapability) {
          complete = false;
          unsafeValueEscaped = true;
        }
        const steps = evaluator.assignmentSteps(node);
        if (!steps) {
          visit(node.right, bindings, active);
          collecting = false;
          complete = false;
          for (const expression of patternEvaluations)
            visit(expression, bindings, active);
          return;
        }
        const accessor = (
          body: ts.Node,
          scope: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
        ): boolean => {
          visit(body, scope, active);
          const flow = new StaticValues(this, scope, captures).statementBarrier(
            body,
          );
          if (flow === 'unknown') {
            collecting = false;
            complete = false;
          }
          return flow !== 'terminates';
        };
        for (const part of [steps.receiver, steps.key])
          if (part && !evaluate(part)) return;
        for (const getter of steps.getters)
          if (!accessor(getter.body, getter.bindings)) return;
        if (steps.valueReachable && !evaluate(node.right)) return;
        for (const setter of steps.setters) {
          const scope = new Map(setter.bindings);
          if (setter.parameter) scope.set(setter.parameter, [node.right]);
          if (!accessor(setter.body, scope)) return;
        }
        return;
      }
      if (
        contextualCalls &&
        ts.isBinaryExpression(node) &&
        [
          ts.SyntaxKind.CommaToken,
          ts.SyntaxKind.AmpersandAmpersandToken,
          ts.SyntaxKind.BarBarToken,
          ts.SyntaxKind.QuestionQuestionToken,
        ].includes(node.operatorToken.kind)
      ) {
        if (!evaluate(node.left)) return;
        const op = node.operatorToken.kind;
        const values = new StaticValues(this, bindings, captures).booleans(
          node.left,
        );
        if (
          values.length === 1 &&
          ((op === ts.SyntaxKind.AmpersandAmpersandToken && !values[0]) ||
            (op === ts.SyntaxKind.BarBarToken && values[0]))
        )
          return;
        if (op === ts.SyntaxKind.QuestionQuestionToken) {
          const left = new StaticValues(this, bindings, captures).values(
            node.left,
          );
          if (
            left.length &&
            left.every(
              (value) =>
                ts.isObjectLiteralExpression(value) ||
                ts.isArrayLiteralExpression(value) ||
                ts.isFunctionLike(value) ||
                ts.isStringLiteralLike(value) ||
                ts.isNumericLiteral(value) ||
                value.kind === ts.SyntaxKind.TrueKeyword ||
                value.kind === ts.SyntaxKind.FalseKeyword,
            )
          )
            return;
        }
        evaluate(node.right);
        return;
      }
      if (contextualCalls && (ts.isBlock(node) || ts.isSourceFile(node))) {
        const enclosing = collecting;
        for (const statement of node.statements) {
          visit(statement, bindings, active);
          const barrier = statementBarrier(statement, bindings);
          if (barrier === 'terminates') break;
          if (barrier === 'unknown' && collecting) {
            collecting = false;
            complete = false;
          }
        }
        collecting = enclosing;
        return;
      }
      if (
        contextualCalls &&
        (ts.isReturnStatement(node) || ts.isThrowStatement(node))
      ) {
        if (node.expression) visit(node.expression, bindings, active);
        return;
      }
      if (contextualCalls && ts.isIfStatement(node)) {
        visit(node.expression, bindings, active);
        const branches = new StaticValues(this, bindings, captures).booleans(
          node.expression,
        );
        if (branches.length === 1) {
          if (branches[0]) visit(node.thenStatement, bindings, active);
          else if (node.elseStatement)
            visit(node.elseStatement, bindings, active);
        } else {
          visit(node.thenStatement, bindings, active);
          if (node.elseStatement) visit(node.elseStatement, bindings, active);
        }
        return;
      }
      if (
        ts.isVariableDeclaration(node) ||
        ts.isParameter(node) ||
        ts.isPropertyDeclaration(node)
      ) {
        if (node.initializer) visit(node.initializer, bindings, active);
        return;
      }
      if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
        // Referring to a class does not mean all its methods are used.
        for (const member of node.members)
          if (
            ts.isConstructorDeclaration(member) ||
            ts.isPropertyDeclaration(member)
          )
            visit(member, bindings, active);
        return;
      }
      if (ts.isPropertyAccessExpression(node)) {
        for (const root of contextualCalls
          ? []
          : this.serviceMethod(node.expression, node.name.text, bindings)) {
          if (contextualCalls && ts.isFunctionLike(root))
            rootFunctions.add(root);
          visit(root, bindings, active);
        }
        const receiver = this.checker.getSymbolAtLocation(node.expression);
        const namespace = receiver?.declarations?.find(ts.isNamespaceImport);
        if (namespace) {
          imported(namespace, node.name.text, bindings, active);
          return;
        }
      }
      if (ts.isIdentifier(node)) {
        const symbol = this.symbol(node);
        const callTarget =
          ts.isCallExpression(node.parent) && node.parent.expression === node;
        if (symbol && (!callTarget || !contextualCalls))
          follow(symbol, bindings, active);
        if (symbol && callTarget)
          for (const declaration of symbol.declarations ?? []) {
            if (ts.isImportSpecifier(declaration) && !declaration.isTypeOnly) {
              let statement: ts.Node = declaration;
              while (!ts.isImportDeclaration(statement) && statement.parent)
                statement = statement.parent;
              if (
                ts.isImportDeclaration(statement) &&
                ts.isStringLiteralLike(statement.moduleSpecifier) &&
                !this.resolutions.has(
                  `${statement.getSourceFile().fileName}\0${statement.moduleSpecifier.text}`,
                ) &&
                !this.isLocal(statement.moduleSpecifier.text)
              )
                (collecting ? references : new Set<string>()).add(
                  statement.moduleSpecifier.text,
                );
            }
          }
      }
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword
      ) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument)) {
          const target = this.resolutions.get(
            `${sourceFile.fileName}\0${argument.text}`,
          );
          if (target) exported(target, 'default', bindings, active);
          else if (this.isLocal(argument.text)) complete = false;
          else (collecting ? references : new Set<string>()).add(argument.text);
        } else complete = false;
      }
      if (contextualCalls && ts.isCallExpression(node)) {
        const evaluator = new StaticValues(this, bindings, captures);
        const database = (value: ts.Node): boolean =>
          evaluator.databaseIdentity(value);
        // A `connection()` or `query()` accessor without arguments on the proven database identity is part of the
        // operation it prefixes: its own completion is judged once, with the whole call, not again as a barrier.
        const receiver = ts.isPropertyAccessExpression(node.expression)
          ? node.expression.expression
          : undefined;
        if (
          receiver &&
          ts.isCallExpression(receiver) &&
          !receiver.questionDotToken &&
          receiver.arguments.length === 0 &&
          ts.isPropertyAccessExpression(receiver.expression) &&
          !receiver.expression.questionDotToken &&
          ['connection', 'query'].includes(receiver.expression.name.text) &&
          database(receiver)
        )
          visit(node.expression, bindings, active);
        else if (!evaluate(node.expression)) return;
        for (const argument of node.arguments) if (!evaluate(argument)) return;
        // An operation on a service another package provides, reached through local values: the call's receiver
        // is what `resolve(token)` returned for that package's token. Resolving the token alone is no evidence.
        if (ts.isPropertyAccessExpression(node.expression))
          for (const value of evaluator.values(node.expression.expression)) {
            const provided =
              ts.isCallExpression(value) &&
              ts.isPropertyAccessExpression(value.expression) &&
              value.expression.name.text === 'resolve' &&
              value.arguments.length === 1
                ? this.externalService(value.arguments[0])
                : undefined;
            if (provided)
              (collecting ? references : new Set<string>()).add(provided);
          }
        if (
          ts.isPropertyAccessExpression(node.expression) &&
          [
            'repository',
            'selectFrom',
            'insertInto',
            'updateTable',
            'deleteFrom',
          ].includes(node.expression.name.text) &&
          database(node.expression.expression)
        ) {
          if (collecting) {
            (collecting ? references : new Set<string>()).add('@nocobase/db');
            const names = node.arguments[0]
              ? evaluator.strings(node.arguments[0])
              : [];
            if (names.length === 1) collections.add(names[0]);
          }
        }
        const invocations = evaluator.invocations(node);
        const serviceCall =
          invocations.length > 0 ||
          (ts.isPropertyAccessExpression(node.expression) &&
            ['connection', 'query', 'repository', 'transaction'].includes(
              node.expression.name.text,
            ) &&
            database(node.expression.expression));
        const safeParser =
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === 'safeParse';
        const passesCapability =
          invocations.length === 0 &&
          !serviceCall &&
          node.arguments.some((argument) => capability(argument, bindings));
        if (passesCapability) {
          complete = false;
          unsafeCapabilityEscaped = true;
        }
        const escapesCandidate =
          invocations.length === 0 &&
          !serviceCall &&
          !safeParser &&
          (node.arguments.some((argument) =>
            candidateValue(argument, bindings),
          ) ||
            (ts.isPropertyAccessExpression(node.expression) &&
              candidateValue(node.expression.expression, bindings)));
        if (escapesCandidate) {
          complete = false;
          unsafeValueEscaped = true;
        }
        for (const invocation of invocations) {
          if (active.has(invocation.fn)) {
            complete = false;
            continue;
          }
          if ('body' in invocation.fn && invocation.fn.body)
            visit(
              invocation.fn.body,
              invocation.bindings,
              new Set(active).add(invocation.fn),
            );
        }
      }
      if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
      ) {
        let target = node.left;
        while (
          (ts.isPropertyAccessExpression(target) ||
            ts.isElementAccessExpression(target)) &&
          target.expression
        )
          target = target.expression;
        if (candidateValue(target, bindings)) {
          complete = false;
          unsafeValueEscaped = true;
        }
      }
      if (
        (ts.isPrefixUnaryExpression(node) ||
          ts.isPostfixUnaryExpression(node)) &&
        [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(
          node.operator,
        )
      ) {
        let target = node.operand;
        while (
          (ts.isPropertyAccessExpression(target) ||
            ts.isElementAccessExpression(target)) &&
          target.expression
        )
          target = target.expression;
        if (candidateValue(target, bindings)) {
          complete = false;
          unsafeValueEscaped = true;
        }
      }
      if (ts.isDeleteExpression(node)) {
        let target = node.expression;
        while (
          (ts.isPropertyAccessExpression(target) ||
            ts.isElementAccessExpression(target)) &&
          target.expression
        )
          target = target.expression;
        if (candidateValue(target, bindings)) {
          complete = false;
          unsafeValueEscaped = true;
        }
      }
      if (contextualCalls && ts.isCallExpression(node)) return;
      ts.forEachChild(node, (child) => {
        // A nested helper declaration is not a call. Follow it only when a value reference reaches it.
        if (!ts.isFunctionDeclaration(child)) visit(child, bindings, active);
      });
    };
    if (roots) roots.forEach((root) => visit(root));
    else {
      const ast = this.sources.get(file)?.ast;
      const symbol = ast && this.checker.getSymbolAtLocation(ast);
      const value =
        symbol &&
        this.checker
          .getExportsOfModule(symbol)
          .find((item) => item.name === 'default');
      if (value) follow(value, new Map(), new Set());
      else complete = false;
    }
    return {
      references,
      collections,
      nodes,
      complete,
      unsafeCapability: unsafeCapabilityEscaped,
      unsafeValue: unsafeValueEscaped,
    };
  }

  /** External contracts cannot describe resolved local overrides or unresolved local declarations. */
  public isExternalImport(node: ts.ImportDeclaration): boolean {
    if (!ts.isStringLiteralLike(node.moduleSpecifier)) return false;
    const specifier = node.moduleSpecifier.text;
    return (
      !this.isLocal(specifier) &&
      (!this.resolutions.has(
        `${node.getSourceFile().fileName}\0${specifier}`,
      ) ||
        this.implementationImports.has(
          `${node.getSourceFile().fileName}\0${specifier}`,
        ))
    );
  }

  public importedSource(
    node: ts.ImportDeclaration | ts.ExportDeclaration,
  ): ts.SourceFile | undefined {
    if (ts.isExportDeclaration(node) && node.isTypeOnly) return undefined;
    const clause = ts.isImportDeclaration(node) ? node.importClause : undefined;
    if (clause?.isTypeOnly) return undefined;
    const named = clause?.namedBindings;
    if (
      named &&
      ts.isNamedImports(named) &&
      !clause?.name &&
      named.elements.length &&
      named.elements.every((item) => item.isTypeOnly)
    )
      return undefined;
    if (!node.moduleSpecifier || !ts.isStringLiteralLike(node.moduleSpecifier))
      return undefined;
    const file = this.resolutions.get(
      `${node.getSourceFile().fileName}\0${node.moduleSpecifier.text}`,
    );
    return file ? this.sources.get(file)?.ast : undefined;
  }

  /** The declarations of one export of the local module an `import()` call loads. */
  public namespaceExport(
    call: ts.CallExpression,
    name: string,
  ): readonly ts.Declaration[] {
    const specifier = call.arguments[0];
    if (!specifier || !ts.isStringLiteralLike(specifier)) return [];
    const file = this.resolutions.get(
      `${call.getSourceFile().fileName}\0${specifier.text}`,
    );
    const source = file ? this.sources.get(file)?.ast : undefined;
    const module = source && this.checker.getSymbolAtLocation(source);
    let symbol = module
      ? this.checker
          .getExportsOfModule(module)
          .find((item) => item.name === name)
      : undefined;
    if (symbol && symbol.flags & ts.SymbolFlags.Alias)
      symbol = this.checker.getAliasedSymbol(symbol);
    return symbol?.declarations ?? [];
  }

  public symbol(node: ts.Node): ts.Symbol | undefined {
    // The checker and its source graph never change during a scan. These are declaration facts,
    // not invocation bindings or endpoint evidence, including a stable absence of a symbol.
    if (this.symbols.has(node)) return this.symbols.get(node);
    const symbol =
      node.parent &&
      ts.isShorthandPropertyAssignment(node.parent) &&
      node.parent.name === node
        ? this.checker.getShorthandAssignmentValueSymbol(node.parent)
        : this.checker.getSymbolAtLocation(node);
    this.symbols.set(node, symbol);
    return symbol;
  }

  public declarations(node: ts.Node): readonly ts.Declaration[] {
    const known = this.declarationNodes.get(node);
    if (known) return known;
    let symbol = this.symbol(node);
    if (symbol && symbol.flags & ts.SymbolFlags.Alias)
      symbol = this.checker.getAliasedSymbol(symbol);
    const declarations = symbol?.declarations ?? [];
    this.declarationNodes.set(node, declarations);
    return declarations;
  }

  /** The package exporting a service token that no local code registers: the host or that package provides it. */
  public externalService(token: ts.Node): string | undefined {
    if (!ts.isIdentifier(token)) return undefined;
    const imported = this.symbol(token)?.declarations?.find(
      ts.isImportSpecifier,
    );
    if (!imported || imported.isTypeOnly) return undefined;
    const statement = imported.parent.parent.parent;
    if (
      !ts.isImportDeclaration(statement) ||
      statement.importClause?.isTypeOnly ||
      !this.isExternalImport(statement) ||
      !ts.isStringLiteralLike(statement.moduleSpecifier)
    )
      return undefined;
    const declaration = this.declarations(token)[0];
    if (declaration && this.services.get(declaration)?.length) return undefined;
    return statement.moduleSpecifier.text;
  }

  /** Only one locally registered implementation can prove a resolved service value. */
  public serviceFactories(
    token: ts.Node,
  ): readonly ts.Expression[] | undefined {
    const declaration = this.declarations(token)[0];
    const factories = declaration ? this.services.get(declaration) : undefined;
    return factories?.length === 1 ? factories : undefined;
  }

  public isExported(declaration: ts.Declaration): boolean {
    const statement = ts.isVariableDeclaration(declaration)
      ? declaration.parent.parent
      : declaration;
    return (
      ts.canHaveModifiers(statement) &&
      !!ts
        .getModifiers(statement)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    );
  }

  // Only fresh top-level syntax queries are reusable. Recursive queries retain
  // their own visited set and depth limit, so a cycle cannot borrow a fuller answer.
  private readonly functionRoots = new WeakMap<
    ts.Node,
    readonly ts.SignatureDeclaration[]
  >();

  /** Resolve returned local functions and React's identity-preserving callback wrapper only. */
  public functions(
    node: ts.Node,
    seen: Set<ts.Node> = new Set<ts.Node>(),
  ): readonly ts.SignatureDeclaration[] {
    if (seen.size === 0) {
      const known = this.functionRoots.get(node);
      if (known) return known;
      const result = this.resolveFunctions(node, seen);
      this.functionRoots.set(node, result);
      return result;
    }
    return this.resolveFunctions(node, seen);
  }

  private resolveFunctions(
    node: ts.Node,
    seen: Set<ts.Node>,
  ): readonly ts.SignatureDeclaration[] {
    if (seen.has(node) || seen.size >= 32) return [];
    seen = new Set(seen).add(node);
    return this.values(node).flatMap((value): ts.SignatureDeclaration[] => {
      if (ts.isFunctionLike(value)) return [value];
      if (!ts.isCallExpression(value)) return [];
      const callback = (this.symbol(value.expression)?.declarations ?? []).some(
        (declaration) => {
          if (
            !ts.isImportSpecifier(declaration) ||
            declaration.isTypeOnly ||
            (declaration.propertyName?.text ?? declaration.name.text) !==
              'useCallback'
          )
            return false;
          const statement = declaration.parent.parent.parent;
          return (
            ts.isImportDeclaration(statement) &&
            !statement.importClause?.isTypeOnly &&
            ts.isStringLiteralLike(statement.moduleSpecifier) &&
            statement.moduleSpecifier.text === 'react'
          );
        },
      );
      if (callback && value.arguments[0])
        return [...this.functions(value.arguments[0], seen)];
      return this.functions(value.expression, seen).flatMap((fn) => {
        const results: ts.SignatureDeclaration[] = [];
        const visit = (child: ts.Node): void => {
          if (ts.isReturnStatement(child) && child.expression)
            results.push(...this.functions(child.expression, seen));
          else if (!ts.isFunctionLike(child)) ts.forEachChild(child, visit);
        };
        if ('body' in fn && fn.body) {
          if (ts.isArrowFunction(fn) && !ts.isBlock(fn.body))
            results.push(...this.functions(fn.body, seen));
          else visit(fn.body);
        }
        return results;
      });
    });
  }

  private readonly immutableReferenceIndexes = new WeakMap<
    ts.SourceFile,
    Map<ts.Symbol | undefined, ts.Identifier[]> | null
  >();

  /** Index syntax once; whether a use is allowed remains specific to each proof. */
  private immutableReferences(
    declaration: ts.VariableDeclaration,
  ): readonly ts.Identifier[] | undefined {
    const source = declaration.getSourceFile();
    let index = this.immutableReferenceIndexes.get(source);
    if (index === undefined) {
      const references = new Map<ts.Symbol | undefined, ts.Identifier[]>();
      let visits = 0;
      const scan = (node: ts.Node): void => {
        if (++visits > 100_000 || ts.isTypeNode(node)) return;
        if (ts.isIdentifier(node)) {
          const symbol = this.symbol(node);
          const uses = references.get(symbol) ?? [];
          uses.push(node);
          references.set(symbol, uses);
        }
        ts.forEachChild(node, scan);
      };
      scan(source);
      index = visits > 100_000 ? null : references;
      this.immutableReferenceIndexes.set(source, index);
    }
    return (
      index?.get(this.symbol(declaration.name)) ?? (index ? [] : undefined)
    );
  }

  /** A const binding is insufficient when its object or function escapes or is written through. */
  public immutable(
    declaration: ts.VariableDeclaration,
    allowArgument: (call: ts.CallExpression) => boolean = () => false,
  ): boolean {
    if (
      !ts.isIdentifier(declaration.name) ||
      !ts.isVariableDeclarationList(declaration.parent) ||
      !(declaration.parent.flags & ts.NodeFlags.Const) ||
      (ts.isVariableStatement(declaration.parent.parent) &&
        !!ts
          .getModifiers(declaration.parent.parent)
          ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
    )
      return false;
    const references = this.immutableReferences(declaration);
    if (!references) return false;
    let valid = true;
    const visit = (node: ts.Node): void => {
      if (!valid || ts.isTypeNode(node)) return;
      if (ts.isIdentifier(node) && node !== declaration.name) {
        let owner: ts.Node = node;
        const transparent = (
          node: ts.Node,
        ): node is
          | ts.ParenthesizedExpression
          | ts.AsExpression
          | ts.SatisfiesExpression
          | ts.TypeAssertion
          | ts.NonNullExpression =>
          ts.isParenthesizedExpression(node) ||
          ts.isAsExpression(node) ||
          ts.isSatisfiesExpression(node) ||
          ts.isTypeAssertionExpression(node) ||
          ts.isNonNullExpression(node);
        for (;;) {
          const parent = owner.parent;
          if (
            (ts.isPropertyAccessExpression(parent) ||
              ts.isElementAccessExpression(parent) ||
              transparent(parent)) &&
            parent.expression === owner
          )
            owner = parent;
          else if (
            ts.isConditionalExpression(parent) &&
            (parent.whenTrue === owner || parent.whenFalse === owner)
          )
            owner = parent;
          else break;
        }
        const parent = owner.parent;
        if (ts.isCallExpression(parent)) {
          const initializer = declaration.initializer;
          valid =
            allowArgument(parent) ||
            (parent.expression === owner &&
              owner === node &&
              !!initializer &&
              (ts.isArrowFunction(initializer) ||
                ts.isFunctionExpression(initializer)));
        } else if (
          ts.isShorthandPropertyAssignment(parent) ||
          ts.isPropertyAssignment(parent) ||
          ts.isSpreadAssignment(parent) ||
          ts.isSpreadElement(parent) ||
          ts.isArrayLiteralExpression(parent)
        ) {
          let context: ts.Node = parent;
          while (
            ts.isShorthandPropertyAssignment(context.parent) ||
            ts.isPropertyAssignment(context.parent) ||
            ts.isSpreadAssignment(context.parent) ||
            ts.isSpreadElement(context.parent) ||
            ts.isArrayLiteralExpression(context.parent) ||
            ts.isObjectLiteralExpression(context.parent) ||
            transparent(context.parent)
          )
            context = context.parent;
          valid =
            ts.isCallExpression(context.parent) &&
            allowArgument(context.parent);
        } else if (!(
          ts.isConditionalExpression(parent) && parent.condition === owner
        )) {
          // Every other use can escape or modify the value, including expression-bodied
          // closures and assignment RHSs. Unknown contexts cannot establish immutability.
          valid = false;
        }
      }
    };
    // An unexported lexical binding cannot be referenced outside its own module. Export aliases are rejected above.
    for (const reference of references) visit(reference);
    return valid;
  }

  /** Resolve local value aliases and re-exports without executing a module. */
  public values(
    node: ts.Node,
    seen: Set<ts.Node> = new Set<ts.Node>(),
  ): readonly ts.Node[] {
    if (seen.has(node)) return [];
    seen.add(node);
    if (ts.isIdentifier(node))
      return this.declarations(node).flatMap((item) => this.values(item, seen));
    if (ts.isVariableDeclaration(node))
      return node.initializer ? this.values(node.initializer, seen) : [];
    if (ts.isExportAssignment(node)) return this.values(node.expression, seen);
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return this.values(node.expression, seen);
    return [node];
  }

  private serviceMethod(
    receiver: ts.Expression,
    method: string,
    bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
  ): readonly ts.Node[] {
    const roots: ts.Node[] = [];
    for (const value of new StaticValues(
      this,
      bindings,
      undefined,
      undefined,
      false,
    ).values(receiver)) {
      if (
        !ts.isCallExpression(value) ||
        !ts.isPropertyAccessExpression(value.expression) ||
        value.expression.name.text !== 'resolve'
      )
        continue;
      const token = value.arguments[0];
      const declaration = token && this.declarations(token)[0];
      const factories = declaration
        ? (this.services.get(declaration) ?? [])
        : [];
      // Competing registrations cannot establish which implementation this runtime selected.
      if (factories.length !== 1) continue;
      for (const factory of factories) {
        const find = (node: ts.Node): void => {
          if (ts.isNewExpression(node)) {
            for (const candidate of this.values(node.expression)) {
              if (
                !ts.isClassDeclaration(candidate) &&
                !ts.isClassExpression(candidate)
              )
                continue;
              roots.push(node);
              roots.push(candidate);
              for (const member of candidate.members)
                if (
                  ts.isMethodDeclaration(member) &&
                  member.name &&
                  member.name.getText() === method
                )
                  roots.push(member);
            }
          }
          ts.forEachChild(node, find);
        };
        this.values(factory).forEach(find);
      }
    }
    return roots;
  }
}
