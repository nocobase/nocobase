/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createJSONTemplateParser } from '../parser/json-template-parser';

/**
 * Example demonstrating dynamic data fetching with caching
 */
async function dynamicDataDemo() {
  const parser = createJSONTemplateParser();

  // Simulate API calls
  const mockAPI = {
    async fetchUser(fields: string[]) {
      console.log('Fetching user data for fields:', fields);
      return {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        permissions: ['read', 'write'],
      };
    },
  };

  const template = {
    header: {
      user: '{{$api.name}} ({{$api.role}})',
      contact: '{{$api.email}}',
    },
    permissions: '{{$api.permissions}}',
  };

  // Example with caching and error handling
  const result = await parser.render(template, {
    $api: async ({ fields }) => {
      const cache = new Map();
      const data = await mockAPI.fetchUser(fields);

      return {
        getValue: ({ field }) => {
          try {
            if (!cache.has(field)) {
              cache.set(field, data[field]);
            }
            return cache.get(field);
          } catch (error) {
            console.error(`Error getting field ${field}:`, error);
            return null;
          }
        },
        afterApplyHelpers: ({ value }) => value,
      };
    },
  });

  console.log('Dynamic Data Demo Result:', result);
}

/**
 * Example demonstrating computed properties with context
 */
async function computedPropertiesDemo() {
  const parser = createJSONTemplateParser();

  const template = {
    stats: {
      total: '{{$stats.total}}',
      average: '{{$stats.average}}',
      summary: '{{$stats.summary}}',
    },
  };

  const result = await parser.render(
    template,
    {
      $stats: ({ data, context }) => {
        const numbers = [10, 20, 30, 40, 50];
        const total = numbers.reduce((a, b) => a + b, 0);
        const avg = total / numbers.length;

        return {
          getValue: ({ field }) => {
            switch (field) {
              case 'total':
                return total;
              case 'average':
                return avg;
              case 'summary':
                return context.detailed ? `Total: ${total}, Average: ${avg}` : `Average: ${avg}`;
              default:
                return null;
            }
          },
          afterApplyHelpers: ({ value }) => value,
        };
      },
    },
    { detailed: true },
  );

  console.log('Computed Properties Demo Result:', result);
}

/**
 * Example demonstrating nested data access with validation
 */
async function nestedDataDemo() {
  const parser = createJSONTemplateParser();

  const template = {
    user: {
      profile: '{{$user.profile.name}} ({{$user.profile.title}})',
      access: {
        role: '{{$user.access.role}}',
        level: '{{$user.access.level}}',
      },
    },
  };

  const result = await parser.render(template, {
    $user: ({ fields }) => {
      const userData = {
        profile: {
          name: 'Alice Smith',
          title: 'Senior Developer',
        },
        access: {
          role: 'developer',
          level: 3,
        },
      };

      return {
        getValue: ({ field, keys }) => {
          // Safely traverse nested paths
          return keys.reduce((obj, key) => obj?.[key], userData);
        },
        afterApplyHelpers: ({ value, keys }) => {
          // Validate and transform data
          if (keys.includes('level')) {
            return Number.isInteger(value) ? value : 0;
          }
          return value;
        },
      };
    },
  });

  console.log('Nested Data Demo Result:', result);
}

/**
 * Example demonstrating internationalization with context
 */
async function i18nDemo() {
  const parser = createJSONTemplateParser();

  const template = {
    welcome: '{{$i18n.welcome}}',
    messages: {
      notification: '{{$i18n.notification}}',
      status: '{{$i18n.status}}',
    },
  };

  // Demo with different languages
  const languages = ['en', 'es', 'fr'];
  for (const lang of languages) {
    const result = await parser.render(
      template,
      {
        $i18n: ({ context }) => {
          const translations = {
            en: {
              welcome: 'Welcome',
              notification: 'You have new messages',
              status: 'Online',
            },
            es: {
              welcome: 'Bienvenido',
              notification: 'Tienes nuevos mensajes',
              status: 'En línea',
            },
            fr: {
              welcome: 'Bienvenue',
              notification: 'Vous avez de nouveaux messages',
              status: 'En ligne',
            },
          };

          return {
            getValue: ({ field }) => translations[context.language]?.[field] || field,
            afterApplyHelpers: ({ value }) => value,
          };
        },
      },
      { language: lang },
    );

    console.log(`I18n Demo Result (${lang}):`, result);
  }
}

// Run all demos
async function runScopeFunctionDemos() {
  console.log('Running Scope Function Demos...\n');

  console.log('1. Dynamic Data Demo');
  await dynamicDataDemo();

  console.log('\n2. Computed Properties Demo');
  await computedPropertiesDemo();

  console.log('\n3. Nested Data Demo');
  await nestedDataDemo();

  console.log('\n4. I18n Demo');
  await i18nDemo();
}

runScopeFunctionDemos().catch(console.error);
