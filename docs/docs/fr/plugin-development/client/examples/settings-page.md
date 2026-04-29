---
title: "Faire une page de configuration de plugin"
description: "Pratique des plugins NocoBase : créer une page de configuration de plugin avec pluginSettingsManager + Component + ctx.api pour gérer une clé d'API tierce."
keywords: "page de configuration de plugin,pluginSettingsManager,addMenuItem,addPageTabItem,Antd Form,ctx.api,NocoBase"
---

# Faire une page de configuration de plugin

De nombreux plugins ont besoin d'une page de configuration pour permettre à l'utilisateur de paramétrer — par exemple la clé d'API d'un service tiers, l'URL d'un webhook, etc. Cet exemple montre comment créer une page de configuration de plugin complète avec `pluginSettingsManager` + composant React + `ctx.api`.

Cet exemple n'utilise pas FlowEngine ; il combine simplement Plugin + Router + Component + Context.

:::tip Lecture préalable

Il est conseillé de connaître les contenus suivants pour faciliter le développement :

- [Écrire votre premier plugin](../../write-your-first-plugin) — création d'un plugin et structure du répertoire
- [Plugin](../plugin) — point d'entrée du plugin et cycle de vie `load()`
- [Router](../router) — enregistrement de page de configuration via `pluginSettingsManager`
- [Développement de composants Component](../component/index.md) — écriture de composants React et useFlowContext
- [Internationalisation i18n](../component/i18n) — écriture des fichiers de traduction et utilisation de `useT()`

:::


## Résultat final

Nous allons créer une page de configuration « Configuration du service externe » :

- Apparaît dans le menu « Configuration des plugins »
- Utilise un Form Antd pour l'UI
- Lit et sauvegarde la configuration via `ctx.api`
- Affiche un message après sauvegarde réussie

![20260407161139](https://static-docs.nocobase.com/20260407161139.png)

Code source complet : [@nocobase-example/plugin-settings-page](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-settings-page). Pour le faire tourner directement en local :

```bash
yarn pm enable @nocobase-example/plugin-settings-page
```

Construisons ce plugin pas à pas, à partir de zéro.

## Étape 1 : créer le squelette du plugin

À la racine du dépôt :

```bash
yarn pm create @my-project/plugin-settings-page
```

Cela génère la structure de fichiers de base sous `packages/plugins/@my-project/plugin-settings-page`, incluant `src/client-v2/`, `src/server/`, `src/locale/` et autres répertoires. Voir [Écrire votre premier plugin](../../write-your-first-plugin) pour les détails.

## Étape 2 : enregistrer la page de configuration

Modifiez `src/client-v2/plugin.tsx` ; dans `load()`, enregistrez la page de configuration via `this.pluginSettingsManager`. En deux étapes : d'abord `addMenuItem()` pour l'entrée de menu, puis `addPageTabItem()` pour la page elle-même :

```ts
// src/client-v2/plugin.tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class PluginSettingsPageClient extends Plugin<any, Application> {
  async load() {
    // Enregistre l'entrée de menu
    this.pluginSettingsManager.addMenuItem({
      key: 'external-api',
      title: this.t('External API Settings'),
      icon: 'ApiOutlined', // Icône Ant Design, voir https://5x.ant.design/components/icon
    });

    // Tab 1 : Configuration de l'API (key 'index', mappé sur la racine du menu /admin/settings/external-api)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'external-api',
      key: 'index',
      title: this.t('API Configuration'),
      componentLoader: () => import('./pages/ExternalApiSettingsPage'),
      sort: -1, // Plus la valeur de tri est petite, plus c'est en avant
    });

    // Tab 2 : page À propos (mappé sur /admin/settings/external-api/about)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'external-api',
      key: 'about',
      title: this.t('About'),
      componentLoader: () => import('./pages/AboutPage'),
    });
  }
}

export default PluginSettingsPageClient;
```

Une fois enregistrée, l'entrée « Configuration du service externe » apparaîtra dans le menu « Configuration des plugins », avec deux onglets en haut — « Configuration de l'API » et « À propos ». Lorsque le menu n'a qu'une page, la barre d'onglets est masquée automatiquement ; ici nous avons enregistré deux pages, elle s'affiche donc. `this.t()` utilise automatiquement le nom du package du plugin courant comme namespace i18n. Voir [Context → Capacités courantes](../ctx/common-capabilities#internationalisation-ctxt--ctxi18n) pour les détails.

![settings page](https://static-docs.nocobase.com/20260415160006.png)

## Étape 3 : écrire le composant de la page de configuration

Créez `src/client-v2/pages/ExternalApiSettingsPage.tsx`. La page de configuration est simplement un composant React standard ; nous utilisons ici `Form` et `Card` d'Antd pour l'UI, `useFlowContext()` pour récupérer `ctx.api` afin d'interagir avec le back-end, et `useT()` pour la traduction.

```tsx
// src/client-v2/pages/ExternalApiSettingsPage.tsx
import React from 'react';
import { Form, Input, Button, Card, Space, message } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { useT } from '../locale';

interface ExternalApiSettings {
  apiKey: string;
  apiSecret: string;
  endpoint: string;
}

export default function ExternalApiSettingsPage() {
  const ctx = useFlowContext();
  const t = useT();
  const [form] = Form.useForm<ExternalApiSettings>();

  // Charge la configuration existante
  const { loading } = useRequest(
    () =>
      ctx.api.request({
        url: 'externalApi:get',
        method: 'get',
      }),
    {
      onSuccess(response) {
        if (response?.data?.data) {
          form.setFieldsValue(response.data.data);
        }
      },
    },
  );

  // Sauvegarde la configuration
  const { run: save, loading: saving } = useRequest(
    (values: ExternalApiSettings) =>
      ctx.api.request({
        url: 'externalApi:set',
        method: 'post',
        data: values,
      }),
    {
      manual: true,
      onSuccess() {
        message.success(t('Saved successfully'));
      },
      onError() {
        message.error(t('Save failed'));
      },
    },
  );

  const handleSave = async () => {
    const values = await form.validateFields();
    save(values);
  };

  return (
    <Card title={t('External API Settings')} loading={loading}>
      <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label="API Key"
          name="apiKey"
          rules={[{ required: true, message: t('Please enter API Key') }]}
        >
          <Input placeholder="sk-xxxxxxxxxxxx" autoComplete="off" />
        </Form.Item>

        <Form.Item
          label="API Secret"
          name="apiSecret"
          rules={[{ required: true, message: t('Please enter API Secret') }]}
        >
          <Input.Password placeholder="••••••••" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          label="Endpoint"
          name="endpoint"
          rules={[{ required: true, message: t('Please enter endpoint URL') }]}
        >
          <Input placeholder="https://api.example.com/v1" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleSave} loading={saving}>
              {t('Save')}
            </Button>
            <Button onClick={() => form.resetFields()}>
              {t('Reset')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
```

Quelques points clés :

- **`useFlowContext()`** — importé depuis `@nocobase/flow-engine`, donne accès à `ctx.api` et autres capacités du contexte
- **`useT()`** — hook de traduction importé depuis `locale.ts`, déjà lié au namespace du plugin. Voir [Internationalisation i18n](../component/i18n) pour les détails
- **`useRequest()`** — depuis [ahooks](https://ahooks.js.org/hooks/use-request/index), gère les états loading/error des requêtes. `manual: true` signifie pas d'envoi automatique : il faut appeler `run()` manuellement
- **`ctx.api.request()`** — utilisation identique à Axios, NocoBase ajoute automatiquement les informations d'authentification

## Étape 4 : ajouter les fichiers de traduction

Modifiez les fichiers de traduction sous `src/locale/` du plugin :

```json
// src/locale/zh-CN.json
{
  "External API Settings": "外部服务配置",
  "API Configuration": "API 配置",
  "About": "关于",
  "Plugin name": "插件名称",
  "Version": "版本",
  "This is a demo plugin showing how to register a settings page with multiple tabs.": "这是一个演示插件，展示如何注册带多个 Tab 的设置页。",
  "Please enter API Key": "请输入 API Key",
  "Please enter API Secret": "请输入 API Secret",
  "Please enter endpoint URL": "请输入接口地址",
  "Save": "保存",
  "Reset": "重置",
  "Saved successfully": "保存成功",
  "Save failed": "保存失败"
}
```

```json
// src/locale/en-US.json
{
  "External API Settings": "External API Settings",
  "API Configuration": "API Configuration",
  "About": "About",
  "Plugin name": "Plugin name",
  "Version": "Version",
  "This is a demo plugin showing how to register a settings page with multiple tabs.": "This is a demo plugin showing how to register a settings page with multiple tabs.",
  "Please enter API Key": "Please enter API Key",
  "Please enter API Secret": "Please enter API Secret",
  "Please enter endpoint URL": "Please enter endpoint URL",
  "Save": "Save",
  "Reset": "Reset",
  "Saved successfully": "Saved successfully",
  "Save failed": "Save failed"
}
```

:::warning Attention

L'ajout initial des fichiers de langue nécessite un redémarrage de l'application pour prendre effet.

:::

Pour l'écriture des fichiers de traduction, le hook `useT()`, `tExpr()` et plus d'utilisations, voir [Internationalisation i18n](../component/i18n).

## Étape 5 : API serveur

Le formulaire client a besoin de deux endpoints `externalApi:get` et `externalApi:set` côté serveur. La partie serveur est simple : on définit une table de données pour stocker la configuration et on enregistre deux endpoints.

### Définir la table de données

Créez `src/server/collections/externalApiSettings.ts`. NocoBase chargera automatiquement les définitions de collections de ce répertoire :

```ts
// src/server/collections/externalApiSettings.ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'externalApiSettings',
  fields: [
    { name: 'apiKey', type: 'string', title: 'API Key' },
    { name: 'apiSecret', type: 'string', title: 'API Secret' },
    { name: 'endpoint', type: 'string', title: 'Endpoint' },
  ],
});
```

### Enregistrer les ressources et les endpoints

Modifiez `src/server/plugin.ts` ; enregistrez la ressource via `resourceManager.define()` puis configurez les permissions ACL :

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginSettingsPageServer extends Plugin {
  async load() {
    // Enregistre la ressource et les endpoints
    this.app.resourceManager.define({
      name: 'externalApi',
      actions: {
        // GET /api/externalApi:get — lit la configuration
        async get(ctx, next) {
          const repo = ctx.db.getRepository('externalApiSettings');
          const record = await repo.findOne();
          ctx.body = record?.toJSON() ?? {};
          await next();
        },
        // POST /api/externalApi:set — sauvegarde la configuration
        async set(ctx, next) {
          const repo = ctx.db.getRepository('externalApiSettings');
          const values = ctx.action.params.values;
          const existing = await repo.findOne();
          if (existing) {
            await repo.update({ values, filter: { id: existing.id } });
          } else {
            await repo.create({ values });
          }
          ctx.body = { ok: true };
          await next();
        },
      },
    });

    // Les utilisateurs connectés peuvent lire la configuration
    this.app.acl.allow('externalApi', 'get', 'loggedIn');
  }
}

export default PluginSettingsPageServer;
```

Quelques points clés :

- **`ctx.db.getRepository()`** — récupère l'objet d'opération sur les données via le nom de collection
- **`ctx.action.params.values`** — données du body pour les requêtes POST
- **`acl.allow()`** — `'loggedIn'` signifie que tout utilisateur connecté peut accéder. L'endpoint `set` n'a pas d'autorisation explicite : par défaut, seul l'administrateur peut l'appeler
- **`await next()`** — chaque action doit l'appeler à la fin, c'est la convention des middlewares Koa

## Étape 6 : écrire la page « À propos »

À l'étape 2, nous avons enregistré deux onglets ; la page « Configuration de l'API » est déjà écrite à l'étape 3. Écrivons maintenant la page de l'onglet « À propos ».

Créez `src/client-v2/pages/AboutPage.tsx` :

```tsx
// src/client-v2/pages/AboutPage.tsx
import React from 'react';
import { Card, Descriptions, Typography } from 'antd';
import { useT } from '../locale';

const { Paragraph } = Typography;

export default function AboutPage() {
  const t = useT();

  return (
    <Card title={t('About')}>
      <Descriptions column={1} bordered style={{ maxWidth: 600 }}>
        <Descriptions.Item label={t('Plugin name')}>
          @nocobase-example/plugin-settings-page
        </Descriptions.Item>
        <Descriptions.Item label={t('Version')}>1.0.0</Descriptions.Item>
      </Descriptions>
      <Paragraph style={{ marginTop: 16, color: '#888' }}>
        {t('This is a demo plugin showing how to register a settings page with multiple tabs.')}
      </Paragraph>
    </Card>
  );
}
```

Cette page est simple — elle utilise `Descriptions` d'Antd pour afficher les informations du plugin. Dans un projet réel, l'onglet « À propos » peut servir à afficher la version, le changelog, des liens d'aide, etc.

## Étape 7 : activer le plugin

```bash
yarn pm enable @my-project/plugin-settings-page
```

Une fois activé, rafraîchissez la page : l'entrée « Configuration du service externe » apparaîtra dans le menu « Configuration des plugins ».

![20260407161139](https://static-docs.nocobase.com/20260407161139.png)

## Code source complet

- [@nocobase-example/plugin-settings-page](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-settings-page) — exemple complet de page de configuration de plugin

## Récapitulatif

Capacités utilisées dans cet exemple :

| Capacité | Utilisation | Documentation |
| ---------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Enregistrer la page de configuration | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router) |
| Page de configuration multi-onglets | Plusieurs `addPageTabItem()` avec le même `menuKey` | [Router](../router) |
| Requêtes API | `ctx.api.request()` | [Context → Capacités courantes](../ctx/common-capabilities#requêtes-api-ctxapi) |
| Internationalisation (client) | `this.t()` / `useT()` | [Internationalisation i18n](../component/i18n) |
| Internationalisation (serveur) | `ctx.t()` / `plugin.t()` | [Internationalisation i18n (serveur)](../../server/i18n) |
| UI de formulaire | Antd Form | [Ant Design Form](https://5x.ant.design/components/form) |

## Liens connexes

- [Écrire votre premier plugin](../../write-your-first-plugin) — créer le squelette d'un plugin de zéro
- [Plugin](../plugin) — point d'entrée et cycle de vie du plugin
- [Router](../router) — routes de page et enregistrement de page de configuration
- [Context → Capacités courantes](../ctx/common-capabilities) — ctx.api, ctx.t, etc.
- [Développement de composants Component](../component/index.md) — écriture de composants React
- [Aperçu du développement côté serveur](../../server) — définition d'API back-end
- [Internationalisation i18n](../component/i18n) — écriture des fichiers de traduction
- [Internationalisation i18n (serveur)](../../server/i18n) — traduction côté serveur
