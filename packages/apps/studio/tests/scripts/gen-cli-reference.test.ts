// @vitest-environment node
import assert from 'node:assert/strict';
import { test } from 'vitest';

import {
  commandSection,
  renderReference,
  usageOf,
} from '../../scripts/gen-cli-reference.mjs';

const comment = {
  id: 'issue:comment:add',
  summary: 'Comment on an issue.',
  method: 'POST',
  path: '/main/api/projects/issues/{issueId}/comments',
  operationId: 'projectsCreateComment',
  parameters: [
    {
      name: 'issue',
      field: 'issueId',
      in: 'path',
      position: 0,
      type: 'string',
      required: true,
      description: 'The issue.',
    },
    {
      name: 'content',
      field: 'content',
      in: 'body',
      type: 'string',
      required: true,
      contentFile: true,
      description: 'Markdown | text.',
    },
    {
      name: 'attach',
      field: 'attachmentIds',
      in: 'file',
      type: 'string[]',
      required: false,
      upload: {
        method: 'POST',
        path: '/x',
        part: 'file',
        field: 'attachmentIds',
        multiple: true,
      },
    },
  ],
  body: { media: 'application/json' },
  output: { kind: 'data' },
  identities: ['person', 'run'],
  action: 'pm.issues/comment',
  confirm: undefined,
  examples: ['issue comment add PM-12 --content-file note.md'],
};

test('a command is typed with its arguments and required flags', () => {
  assert.equal(
    usageOf(comment, 'nb-studio'),
    'nb-studio issue comment add <issue> --content <string>',
  );
});

test('a section says what a command takes, answers, needs and requests', () => {
  const section = commandSection(comment, 'nb-studio');
  assert.match(section, /^## issue comment add$/mu);
  assert.match(
    section,
    /\| `--content` \| string \| Markdown \\\| text\. \(required; or --content-file <path>\) \|/u,
  );
  assert.match(
    section,
    /\| `--attach` \| path \| \(uploaded first, repeatable\) \|/u,
  );
  assert.match(section, /needs the action `pm\.issues\/comment`/u);
  assert.match(
    section,
    /`POST \/api\/projects\/issues\/\{issueId\}\/comments` \(`projectsCreateComment`\)/u,
  );
  assert.match(
    section,
    /nb-studio issue comment add PM-12 --content-file note\.md/u,
  );
});

test('the reference has an index and a file per area', () => {
  const files = renderReference(
    [comment, { ...comment, id: 'kb:list', examples: undefined }],
    { bin: 'nb-studio', title: 'NocoBase Studio' },
  );
  assert.deepEqual([...files.keys()].sort(), ['index.md', 'issue.md', 'kb.md']);
  assert.match(
    files.get('index.md'),
    /\| \[issue\]\(issue\.md\) \| `issue comment add` \|/u,
  );
});

test('repeatable enum flags stay within one Markdown table cell', () => {
  const section = commandSection(
    {
      ...comment,
      parameters: [
        {
          name: 'type',
          field: 'type',
          in: 'query',
          type: 'string[]',
          required: false,
          enum: ['text', 'input'],
        },
      ],
    },
    'nb-studio',
  );
  assert.ok(section.includes('| `--type` | text \\| input | (repeatable) |'));
  assert.ok(!section.includes('text \\\\| input'));
});
