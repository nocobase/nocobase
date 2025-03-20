/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createJSONTemplateParser } from '../parser/json-template-parser';

async function basicDemo() {
  const parser = createJSONTemplateParser();

  // Basic template
  const template = {
    greeting: 'Hello {{name}}!',
    age: '{{age}} years old',
  };

  const result = await parser.render(template, {
    name: 'Alice',
    age: 25,
  });

  console.log('Basic Demo Result:', result);
}

async function filterDemo() {
  const parser = createJSONTemplateParser();

  // Register filter group
  parser.registerFilterGroup({
    name: 'text',
    title: 'Text Operations',
    sort: 1,
  });

  // Register filters
  parser.registerFilter({
    name: 'uppercase',
    title: 'To Uppercase',
    handler: (value) => String(value).toUpperCase(),
    group: 'text',
    sort: 1,
  });

  parser.registerFilter({
    name: 'append',
    title: 'Append Text',
    handler: (value, suffix) => `${value}${suffix}`,
    group: 'text',
    sort: 2,
  });

  const template = {
    message: "{{name | uppercase | append: '!'}}",
    description: "{{role | append: ' at NocoBase'}}",
  };

  const result = await parser.render(template, {
    name: 'bob',
    role: 'developer',
  });

  console.log('Filter Demo Result:', result);
}

async function scopeFunctionDemo() {
  const parser = createJSONTemplateParser();

  const template = {
    userInfo: '{{$user.name}} ({{$user.role}})',
    permissions: '{{$user.permissions}}',
    settings: {
      theme: '{{$settings.theme}}',
      language: '{{$settings.language}}',
    },
  };

  const result = await parser.render(template, {
    $user: ({ fields, data, context }) => {
      // Simulating user data fetching
      const userData = {
        name: 'Charlie Brown',
        role: 'Admin',
        permissions: ['read', 'write', 'delete'],
      };

      return {
        getValue: ({ field }) => userData[field],
        afterApplyHelpers: ({ value }) => value,
      };
    },
    $settings: ({ fields }) => {
      // Simulating settings data
      const settings = {
        theme: 'dark',
        language: 'en-US',
      };

      return {
        getValue: ({ field }) => settings[field],
        afterApplyHelpers: ({ value }) => value,
      };
    },
  });

  console.log('Scope Function Demo Result:', result);
}

async function complexDemo() {
  const parser = createJSONTemplateParser();

  const template = {
    project: {
      name: '{{projectName}}',
      description: '{{description | uppercase}}',
      team: {
        leader: '{{$team.leader}}',
        members: '{{$team.members}}',
      },
      stats: {
        tasks: '{{$stats.taskCount}} tasks',
        completion: '{{$stats.completionRate}}%',
      },
    },
  };

  const result = await parser.render(template, {
    projectName: 'NocoBase Extension',
    description: 'A powerful extension system',
    $team: () => ({
      getValue: ({ field }) =>
        ({
          leader: 'David',
          members: ['Alice', 'Bob', 'Charlie'],
        })[field],
      afterApplyHelpers: ({ value }) => value,
    }),
    $stats: () => ({
      getValue: ({ field }) =>
        ({
          taskCount: 42,
          completionRate: 85,
        })[field],
      afterApplyHelpers: ({ value }) => value,
    }),
  });

  console.log('Complex Demo Result:', result);
}

// Run all demos
async function runDemos() {
  console.log('Running JSON Template Parser Demos...\n');

  console.log('1. Basic Demo');
  await basicDemo();
  console.log('\n2. Filter Demo');
  await filterDemo();
  console.log('\n3. Scope Function Demo');
  await scopeFunctionDemo();
  console.log('\n4. Complex Demo');
  await complexDemo();
}

runDemos().catch(console.error);
