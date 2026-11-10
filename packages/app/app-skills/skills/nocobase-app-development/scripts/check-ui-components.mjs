import { readFileSync, readdirSync, lstatSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import {
  dirname,
  extname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const controls = new Map([
  ['button', 'Button'],
  ['input', 'Input, Checkbox, Switch or another matching input primitive'],
  ['select', 'Select or NativeSelect'],
  ['textarea', 'Textarea'],
  ['dialog', 'Dialog or the owning route overlay'],
  ['summary', 'Accordion or Collapsible'],
]);
// Native date interactions: the browser's own calendar, not the shadcn Date Picker composition.
const dateTypes = new Map([
  [
    'date',
    "the application's DatePicker (#components/date-picker); if it does not exist, compose it there once from the calendar, popover and button primitives following https://ui.shadcn.com/docs/components/base/date-picker and the Skill's references/frontend/references/form.md (Dates)",
  ],
  [
    'datetime-local',
    "the application's DatePicker for the day plus an Input type='time' for the time, combined into one value at the component boundary (the Time Picker example of https://ui.shadcn.com/docs/components/base/date-picker); keep the time, do not replace it with a date-only picker",
  ],
]);
// Primitive exports that render a native <input> and pass `type` through to it.
const inputPrimitives = new Set(['Input', 'InputGroupInput']);
const widgetRoles = new Set([
  'button',
  'checkbox',
  'combobox',
  'dialog',
  'listbox',
  'menu',
  'menuitem',
  'radio',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'tree',
]);
// Unsaved input in a create or edit form (mobile.md M7.4): the route overlay asks "Discard changes?" before every way
// out. A FeedbackForm with values and savedValues lets it compare with what is saved, a restored draft included.
const formReplacement =
  "FeedbackForm (#components/feedback-form) with values={form.getValues} and savedValues={the stored or blank values}, so its route overlay asks before discarding the input, a restored draft included (mobile.md M7.4); a search form takes role='search'";
const feedbackFormValues =
  'values={form.getValues} (or values={() => values} for a form kept in useState) and savedValues={the stored or blank values, never the restored draft} on this FeedbackForm, so its route overlay asks before discarding the input, a restored draft or a changed Select included (mobile.md M7.4)';
const feedbackFormSpread =
  'values={form.getValues} and savedValues={the stored or blank values} written on this FeedbackForm itself: a spread whose contents this file does not show cannot confirm them, so its route overlay may not ask before discarding the input (mobile.md M7.4)';
const draftDirty =
  'a dirty that only adds what the form cannot show; never derive it from a draft, storage or saved flag: a stored draft never replaces the discard question (mobile.md M7.4)';
const overlays = new Set(['RouteDialog', 'RouteDrawer']);
const ownQuestion =
  "the layer's own discard question: OwnDiscardQuestion only declares that this file asks about unsaved input itself through useNavigationGuard from @nocobase/app-client, and no guard here reads an unsaved state (dirty, unsaved, changed); a guard that only blocks during a save, or a kept draft, never replaces the question (mobile.md M7.4)";
// What a guard of a form's own reads when it asks about unsaved input, matched against identifiers, never comments or strings.
const unsavedState = /dirty|unsaved|changed|modified/i;
const passiveTags = new Set([
  'div',
  'span',
  'li',
  'td',
  'tr',
  'section',
  'article',
  'svg',
]);
const ignoredDirectories = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'storage',
  'tests',
  '__tests__',
  '__fixtures__',
  'fixtures',
  'generated',
  'vendor',
]);

function inside(directory, file) {
  const path = relative(directory, file);
  return (
    path === '' ||
    (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path))
  );
}

function attribute(ts, node, name) {
  return node.attributes.properties.find(
    (item) => ts.isJsxAttribute(item) && item.name.text === name,
  );
}

function literal(ts, value) {
  if (value && ts.isJsxExpression(value)) value = value.expression;
  return value && ts.isStringLiteralLike(value) ? value.text : undefined;
}

/** Inspect JSX syntax, not strings or comments. The caller supplies its installed TypeScript. */
export function inspectSource(ts, text, file, root) {
  const kind =
    /\.[jt]sx?$/.test(file) && !file.endsWith('.ts')
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS;
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  if (source.parseDiagnostics.length) {
    throw new Error(
      `${file}: ${ts.flattenDiagnosticMessageText(source.parseDiagnostics[0].messageText, '\n')}`,
    );
  }
  const primitives = new Set();
  const namespaces = new Set();
  let usesHookForm = false;
  // Local names of `useNavigationGuard` imported from @nocobase/app-client, and whether the file calls one.
  const guardHooks = new Set();
  // Namespace imports of @nocobase/app-client, for `App.useNavigationGuard(...)`.
  const guardNamespaces = new Set();
  const leaveHooks = new Set();
  // A plain <form> is a create or edit form when it holds React Hook Form fields or renders in a route overlay; a chat
  // composer or a filter bar elsewhere is left alone.
  let usesOverlay = false;
  // A tool form on a page of its own (an extraction prompt, a calculator) has nothing saved to compare with.
  let rendersPage = false;
  // FeedbackForm's own implementation renders the one plain <form> the rule points everyone else to.
  const definesFeedbackForm = /\bfunction FeedbackForm\b/.test(text);
  // Local names bound to an input primitive, including aliases.
  const inputs = new Set();
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      continue;
    const specifier = statement.moduleSpecifier.text;
    if (specifier === 'react-hook-form') usesHookForm = true;
    if (
      specifier === '@nocobase/app-client' &&
      statement.importClause?.namedBindings &&
      ts.isNamespaceImport(statement.importClause.namedBindings)
    )
      guardNamespaces.add(statement.importClause.namedBindings.name.text);
    if (
      specifier === '@nocobase/app-client' &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings)
    )
      for (const item of statement.importClause.namedBindings.elements)
        if ((item.propertyName ?? item.name).text === 'useNavigationGuard')
          guardHooks.add(item.name.text);
    // The application's own page-leave hook (the settings forms' `usePageLeave`, re-exported as `useSettingsLeave`).
    if (
      /^[.#]/.test(specifier) &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings)
    )
      for (const item of statement.importClause.namedBindings.elements)
        if (/^use\w*Leave$/.test((item.propertyName ?? item.name).text))
          leaveHooks.add(item.name.text);
    if (/(^|\/)route-(dialog|drawer|child-page)(\.js)?$/.test(specifier))
      usesOverlay = true;
    if (/(^|\/)page-container(\.js)?$/.test(specifier)) rendersPage = true;
    const isPrimitive =
      specifier === '#components/ui' ||
      specifier.startsWith('#components/ui/') ||
      (specifier.startsWith('.') &&
        inside(
          resolve(root, 'client/components/ui'),
          resolve(dirname(file), specifier),
        ));
    const clause = statement.importClause;
    if (!isPrimitive || !clause || clause.isTypeOnly) continue;
    if (clause.name) primitives.add(clause.name.text);
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const item of clause.namedBindings.elements) {
        if (item.isTypeOnly) continue;
        primitives.add(item.name.text);
        if (inputPrimitives.has((item.propertyName ?? item.name).text))
          inputs.add(item.name.text);
      }
    } else if (clause.namedBindings)
      namespaces.add(clause.namedBindings.name.text);
  }

  const exceptions = new Map();
  function rememberComment(start, end, adjacentEnd = end) {
    const comment = text
      .slice(start, end)
      .replace(/^\/\/|^\/\*|\*\/$/g, '')
      .trim();
    if (!comment.startsWith('ui-component-exception:')) return;
    exceptions.set(start, {
      line: source.getLineAndCharacterOfPosition(end).line,
      nextLine: source.getLineAndCharacterOfPosition(adjacentEnd).line + 1,
      end: adjacentEnd,
      reason: comment.slice('ui-component-exception:'.length).trim(),
      used: false,
    });
  }
  function collectComments(node) {
    // Comment range scanning is context-free; JSX text is rendered content.
    if (ts.isJsxText(node)) return;
    for (const comment of ts.getLeadingCommentRanges(
      text,
      node.getFullStart(),
    ) ?? []) {
      rememberComment(comment.pos, comment.end);
    }
    if (ts.isJsxExpression(node) && !node.expression) {
      const contents = node.getText(source);
      const comment = /^\{\s*(\/\*[\s\S]*?\*\/)\s*\}$/.exec(contents);
      if (comment) {
        const start = node.getStart(source) + contents.indexOf('/*');
        rememberComment(start, start + comment[1].length, node.end);
      }
    }
    ts.forEachChild(node, collectComments);
  }
  collectComments(source);

  function renderedByPrimitive(node) {
    let element = ts.isJsxOpeningElement(node) ? node.parent : node;
    while (element.parent && ts.isParenthesizedExpression(element.parent))
      element = element.parent;
    const expression = element.parent;
    if (
      !expression ||
      !ts.isJsxExpression(expression) ||
      expression.expression !== element
    )
      return false;
    const prop = expression.parent;
    if (!ts.isJsxAttribute(prop) || prop.name.text !== 'render') return false;
    const owner = prop.parent.parent;
    const tag = owner.tagName;
    return ts.isIdentifier(tag)
      ? primitives.has(tag.text)
      : ts.isPropertyAccessExpression(tag) &&
          ts.isIdentifier(tag.expression) &&
          namespaces.has(tag.expression.text);
  }

  /** A primitive that renders a native input: `Input`, an alias of it, or `UI.Input` from a namespace import. */
  function inputPrimitive(tag) {
    if (ts.isIdentifier(tag)) return inputs.has(tag.text);
    return (
      ts.isPropertyAccessExpression(tag) &&
      ts.isIdentifier(tag.expression) &&
      namespaces.has(tag.expression.text) &&
      inputPrimitives.has(tag.name.text)
    );
  }

  const findings = [];
  const accepted = [];
  // `exemptable` is false for the unsaved-input rules (mobile.md M7.4): no marker waives a create or edit form's
  // discard question.
  function report(node, tag, replacement, type, exemptable = true) {
    const position = source.getLineAndCharacterOfPosition(
      node.getStart(source),
    );
    const exception = !exemptable
      ? undefined
      : [...exceptions.values()].find(
          (item) =>
            item.nextLine === position.line &&
            !item.used &&
            /^\s*$/.test(text.slice(item.end, node.getStart(source))),
        );
    const finding = {
      file,
      line: position.line + 1,
      column: position.character + 1,
      tag,
      ...(type ? { type } : {}),
      replacement,
    };
    if (exception?.reason && !/^(todo|n\/a|none)$/i.test(exception.reason)) {
      exception.used = true;
      accepted.push({ ...finding, reason: exception.reason });
    } else findings.push(finding);
  }
  // The property names of an object this file shows in full: an object literal, or an identifier declared here as a
  // `const` initialized with one. `null` when it cannot tell, such as for a call, a parameter or a computed key.
  function objectKeys(expression, seen = new Set()) {
    while (
      ts.isParenthesizedExpression(expression) ||
      ts.isAsExpression(expression) ||
      ts.isSatisfiesExpression?.(expression)
    )
      expression = expression.expression;
    if (ts.isObjectLiteralExpression(expression)) {
      const keys = [];
      for (const property of expression.properties) {
        if (
          (ts.isPropertyAssignment(property) ||
            ts.isShorthandPropertyAssignment(property) ||
            ts.isMethodDeclaration(property)) &&
          (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
        )
          keys.push(property.name.text);
        else if (ts.isSpreadAssignment(property)) {
          const nested = objectKeys(property.expression, seen);
          if (!nested) return null;
          keys.push(...nested);
        } else return null;
      }
      return keys;
    }
    if (!ts.isIdentifier(expression) || seen.has(expression.text)) return null;
    seen.add(expression.text);
    const declarations = [];
    (function find(node) {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === expression.text
      )
        declarations.push(node);
      ts.forEachChild(node, find);
    })(source);
    const [declaration] = declarations;
    if (
      declarations.length !== 1 ||
      !declaration.initializer ||
      !(ts.getCombinedNodeFlags(declaration.parent) & ts.NodeFlags.Const)
    )
      return null;
    return objectKeys(declaration.initializer, seen);
  }
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      // Only a statically known type is checked; `type={kind}` and spread props are left to source review.
      const type = literal(
        ts,
        attribute(ts, node, 'type')?.initializer,
      )?.toLowerCase();
      const dateReplacement = dateTypes.get(type);
      if (tag === 'form') {
        if (
          !definesFeedbackForm &&
          (usesHookForm || usesOverlay) &&
          literal(ts, attribute(ts, node, 'role')?.initializer) !== 'search'
        )
          report(node, tag, formReplacement, undefined, false);
      } else if (
        tag === 'FeedbackForm' &&
        !definesFeedbackForm &&
        literal(ts, attribute(ts, node, 'role')?.initializer) !== 'search' &&
        // A form in a route overlay, React Hook Form or `useState` alike: without values and savedValues nothing saved
        // is compared, so a restored draft left untouched leaves without asking. Elsewhere a React Hook Form form
        // outside a page of its own (a form component an overlay renders). A form whose file asks its own question
        // (a guard reading its unsaved state, or the application's page-leave hook) compares by itself.
        (usesOverlay || (usesHookForm && !rendersPage)) &&
        !covered(node, asking)
      ) {
        // Explicit props, or a spread whose object this file shows (`{...{ values, savedValues }}` or a const object
        // declared here); any other spread cannot confirm them and is reported as unconfirmed, never passed silently.
        const names = new Set(
          node.attributes.properties
            .filter((item) => ts.isJsxAttribute(item))
            .map((item) => item.name.getText(source)),
        );
        let unknown = false;
        for (const item of node.attributes.properties) {
          if (!ts.isJsxSpreadAttribute(item)) continue;
          const keys = objectKeys(item.expression);
          if (keys) for (const key of keys) names.add(key);
          else unknown = true;
        }
        if (!(names.has('values') && names.has('savedValues')))
          report(
            node,
            tag,
            unknown ? feedbackFormSpread : feedbackFormValues,
            undefined,
            false,
          );
      } else if (
        tag === 'OwnDiscardQuestion' &&
        !covered(node, guarding, true)
      ) {
        report(node, tag, ownQuestion, undefined, false);
      } else if (overlays.has(tag) && attribute(ts, node, 'dirty')) {
        const value = attribute(ts, node, 'dirty').initializer;
        if (value && /storage|draft|persist|saved/i.test(value.getText(source)))
          report(node, tag, draftDirty, 'dirty', false);
      }
      if (
        dateReplacement &&
        (tag === 'input' || inputPrimitive(node.tagName))
      ) {
        // A date input stays a native calendar even inside a primitive's `render`.
        report(node, tag, dateReplacement, type);
      } else if (/^[a-z]/.test(tag) && !tag.includes('.')) {
        const hidden = tag === 'input' && type === 'hidden';
        const role = literal(ts, attribute(ts, node, 'role')?.initializer);
        const clickable =
          passiveTags.has(tag) &&
          ['onClick', 'onPointerDown', 'onKeyDown'].some((name) =>
            attribute(ts, node, name),
          );
        const replacement =
          controls.get(tag) ??
          (widgetRoles.has(role) || clickable
            ? 'the matching shadcn interaction or an existing business component'
            : undefined);
        if (replacement && !hidden && !renderedByPrimitive(node))
          report(node, tag, replacement);
      }
    }
    ts.forEachChild(node, visit);
  }
  // The identifiers of a piece of code, without its comments or strings: what a guard reads, not what it says.
  function identifiers(node, skip) {
    const names = [];
    (function walk(child) {
      if (child === skip) return;
      if (ts.isIdentifier(child) || ts.isPrivateIdentifier(child))
        names.push(child.text);
      ts.forEachChild(child, walk);
    })(node);
    return names.join(' ');
  }
  // What a guard's argument reads: its own identifiers, except that a name it passes stands for that name's
  // declaration (its initializer or body) rather than for the name itself, so `useNavigationGuard(dirtyGuard)` is read
  // by what it does. A plain name resolves lexically, from the call outward (its function, then each enclosing scope),
  // so a same-named `guard` of another component never lends its reads; a parameter or a destructured name stays a
  // name. A property name (`controller.guard`, either branch of `boundary ? allow : controller.guard`) has no lexical
  // scope and stands for every method or property of that name this file declares.
  function guardReads(argument) {
    const parts = [];
    (function walk(node) {
      if (ts.isIdentifier(node)) {
        const property =
          ts.isPropertyAccessExpression(node.parent) &&
          node.parent.name === node;
        const declared = property
          ? memberDeclarations(node.text)
          : [lexicalDeclaration(node)].filter(Boolean);
        parts.push(
          ...(declared.length
            ? declared.map((child) => identifiers(child, child.name))
            : [node.text]),
        );
        return;
      }
      ts.forEachChild(node, walk);
    })(argument);
    return parts.join(' ');
  }
  // Whether a binding name (an identifier or a destructuring pattern) binds `name`.
  function binds(binding, name) {
    if (ts.isIdentifier(binding)) return binding.text === name;
    if (ts.isObjectBindingPattern(binding) || ts.isArrayBindingPattern(binding))
      return binding.elements.some(
        (element) =>
          !ts.isOmittedExpression(element) && binds(element.name, name),
      );
    return false;
  }
  // The declaration a plain name refers to at its position: the nearest enclosing scope declaring it. A parameter or a
  // destructured binding has no body of its own to read, so it resolves to nothing and the name itself counts.
  function lexicalDeclaration(identifier) {
    const name = identifier.text;
    for (let scope = identifier.parent; scope; scope = scope.parent) {
      if (
        ts.isFunctionLike(scope) &&
        scope.parameters?.some((parameter) => binds(parameter.name, name))
      )
        return undefined;
      const statements =
        ts.isSourceFile(scope) ||
        ts.isBlock(scope) ||
        ts.isModuleBlock(scope) ||
        ts.isCaseClause(scope) ||
        ts.isDefaultClause(scope)
          ? scope.statements
          : undefined;
      if (!statements) continue;
      for (const statement of statements) {
        if (
          (ts.isFunctionDeclaration(statement) ||
            ts.isClassDeclaration(statement)) &&
          statement.name?.text === name
        )
          return statement;
        if (ts.isVariableStatement(statement))
          for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name)) {
              if (declaration.name.text === name) return declaration;
            } else if (binds(declaration.name, name)) return undefined;
          }
      }
    }
    return undefined;
  }
  // The methods and properties of a name anywhere in this file, for a property access.
  function memberDeclarations(name) {
    const declared = [];
    (function find(child) {
      if (
        (ts.isPropertyDeclaration(child) ||
          ts.isMethodDeclaration(child) ||
          ts.isPropertyAssignment(child)) &&
        child.name &&
        ts.isIdentifier(child.name) &&
        child.name.text === name
      )
        declared.push(child);
      ts.forEachChild(child, find);
    })(source);
    return declared;
  }
  // Each top-level statement is a unit: a component, a hook or a constant declared in this file. A form's question
  // belongs to its own component, to a component of this file that renders it, or to a hook of this file that one of
  // them calls; another form's component elsewhere in the file does not lend its question.
  function unitOf(node) {
    while (node.parent && node.parent !== source) node = node.parent;
    return node;
  }
  const units = new Map();
  for (const statement of source.statements) {
    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement)) &&
      statement.name
    )
      units.set(statement.name.text, statement);
    else if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations)
        if (ts.isIdentifier(declaration.name))
          units.set(declaration.name.text, statement);
  }
  // Units a unit renders as JSX, and units it calls (its hooks).
  const renders = new Map();
  const calls = new Map();
  const link = (edges, from, name) => {
    const target = units.get(name);
    if (!target || target === from) return;
    if (!edges.has(from)) edges.set(from, new Set());
    edges.get(from).add(target);
  };
  // Units asking their own question about unsaved input, and the subset doing it through useNavigationGuard.
  const asking = new Set();
  const guarding = new Set();
  (function findGuardCall(node) {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      ts.isIdentifier(node.tagName)
    )
      link(renders, unitOf(node), node.tagName.text);
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression))
      link(calls, unitOf(node), node.expression.text);
    if (
      ts.isCallExpression(node) &&
      ((ts.isIdentifier(node.expression) &&
        guardHooks.has(node.expression.text)) ||
        (ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          guardNamespaces.has(node.expression.expression.text) &&
          node.expression.name.text === 'useNavigationGuard')) &&
      node.arguments[0] &&
      // A guard that asks about unsaved input reads it; one that only blocks while a save runs (`submitting`,
      // `pending`, a saved flag) does not ask anything, so it cannot stand in for the layer's question.
      unsavedState.test(guardReads(node.arguments[0]))
    ) {
      asking.add(unitOf(node));
      guarding.add(unitOf(node));
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      leaveHooks.has(node.expression.text)
    )
      asking.add(unitOf(node));
    // An overlay whose beforeClose reads the form's unsaved state asks its own question on close.
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(source) === 'beforeClose' &&
      node.initializer &&
      unsavedState.test(identifiers(node.initializer))
    )
      asking.add(unitOf(node));
    ts.forEachChild(node, findGuardCall);
  })(source);
  // A unit calling a hook of this file that asks asks as well.
  for (const set of [asking, guarding])
    for (let grew = true; grew;) {
      grew = false;
      for (const [from, targets] of calls)
        if (!set.has(from) && [...targets].some((target) => set.has(target))) {
          set.add(from);
          grew = true;
        }
    }
  // Whether the unit of `node`, or a unit of this file rendering or calling it, is in `set`. With `downward`, the
  // units it renders count too: OwnDiscardQuestion may sit in the overlay while the form component it renders asks.
  function covered(node, set, downward = false) {
    const unit = unitOf(node);
    if (set.has(unit)) return true;
    const reach = (start, next) => {
      const seen = new Set([start]);
      const queue = [start];
      while (queue.length) {
        for (const item of next(queue.shift()))
          if (!seen.has(item)) {
            if (set.has(item)) return true;
            seen.add(item);
            queue.push(item);
          }
      }
      return false;
    };
    const callers = (target) =>
      [...renders, ...calls]
        .filter(([, targets]) => targets.has(target))
        .map(([from]) => from);
    return (
      reach(unit, callers) ||
      (downward && reach(unit, (from) => renders.get(from) ?? []))
    );
  }
  visit(source);
  for (const exception of exceptions.values()) {
    if (!exception.used)
      findings.push({
        file,
        line: exception.line + 1,
        column: 1,
        tag: 'exception',
        replacement:
          'remove the stale marker or place a specific reason immediately above one flagged element',
      });
  }
  return { findings, accepted };
}

function collectFiles(root, requested) {
  const files = new Set();
  let skipped = 0;
  function visit(file) {
    if (!inside(root, file)) throw new Error(`Path is outside --root: ${file}`);
    const stat = lstatSync(file);
    const parts = relative(root, file).split(sep);
    if (
      stat.isSymbolicLink() ||
      parts.some(
        (part) => ignoredDirectories.has(part) || part.startsWith('.'),
      ) ||
      inside(resolve(root, 'client/components/ui'), file) ||
      /\.(test|spec|stories)\.[jt]sx?$/.test(file) ||
      file.endsWith('.d.ts')
    ) {
      skipped += 1;
      return;
    }
    if (stat.isDirectory()) {
      for (const entry of readdirSync(file).sort()) visit(resolve(file, entry));
    } else if (/\.[jt]sx?$/.test(extname(file))) files.add(file);
  }
  for (const file of requested.length ? requested : ['client'])
    visit(resolve(root, file));
  return { files: [...files].sort(), skipped };
}

function label(item) {
  if (item.type === 'dirty') return `<${item.tag} dirty>`;
  return item.type ? `<${item.tag} type="${item.type}">` : `<${item.tag}>`;
}

export function main(args) {
  let root = process.cwd();
  const requested = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--help') {
      console.log(
        'Usage: node check-ui-components.mjs [--root <app-or-plugin>] [files-or-directories...]\nPaths are relative to --root; default: client/. Exit 1: findings; exit 2: incomplete scan.',
      );
      return 0;
    }
    if (args[index] === '--root') {
      if (!args[index + 1] || args[index + 1].startsWith('--'))
        throw new Error('--root needs a directory');
      root = resolve(args[++index]);
    } else if (args[index].startsWith('--'))
      throw new Error(`Unknown option: ${args[index]}`);
    else requested.push(args[index]);
  }
  const manifest = resolve(root, 'package.json');
  JSON.parse(readFileSync(manifest, 'utf8'));
  let ts;
  try {
    ts = createRequire(manifest)('typescript');
  } catch {
    throw new Error(
      `Cannot resolve TypeScript from ${root}. Install this project's development dependencies before checking.`,
    );
  }
  const { files, skipped } = collectFiles(root, requested);
  let findings = 0;
  let accepted = 0;
  for (const file of files) {
    const result = inspectSource(ts, readFileSync(file, 'utf8'), file, root);
    for (const item of result.findings) {
      console.log(
        `${relative(root, file)}:${item.line}:${item.column} ${label(item)}: use ${item.replacement}.`,
      );
    }
    for (const item of result.accepted) {
      console.log(
        `${relative(root, file)}:${item.line}:${item.column} REVIEW EXCEPTION ${label(item)}: ${item.reason}`,
      );
    }
    findings += result.findings.length;
    accepted += result.accepted.length;
  }
  console.log(
    `Scanned ${files.length} source files; skipped ${skipped} paths; ${findings} findings; ${accepted} exceptions requiring review.`,
  );
  return findings ? 1 : 0;
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(
      `UI component check incomplete: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 2;
  }
}
