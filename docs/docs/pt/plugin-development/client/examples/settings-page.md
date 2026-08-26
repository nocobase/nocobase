---
title: "Construir uma página de configurações de plugin"
description: "Hands-on de plugins NocoBase: usar pluginSettingsManager + Component + ctx.api para criar uma página de configurações de plugin que gerencia API Keys de terceiros."
keywords: "página de configurações de plugin,pluginSettingsManager,addMenuItem,addPageTabItem,Antd Form,ctx.api,NocoBase"
---

# Construir uma página de configurações de plugin

Muitos plugins precisam de uma página de configurações para o usuário definir parâmetros — por exemplo, API Keys de serviços terceiros, endereços de Webhook etc. Este exemplo mostra como criar uma página de configurações de plugin completa com `pluginSettingsManager` + componente React + `ctx.api`.

Este exemplo não envolve FlowEngine; é puramente uma combinação de Plugin + Router + Component + Context.

:::tip Dica de leitura prévia

É recomendável conhecer os seguintes tópicos antes:

- [Escreva seu primeiro plugin](../../write-your-first-plugin) — criação do plugin e estrutura de diretórios
- [Plugin](../plugin) — entrada do plugin e ciclo de vida `load()`
- [Router de rotas](../router) — registro de página de configurações com `pluginSettingsManager`
- [Desenvolvimento de Component](../component/index.md) — escrita de componentes React e useFlowContext
- [i18n internacionalização](../component/i18n) — escrita de arquivos de tradução e uso de `useT()`

:::


## Resultado final

Vamos criar uma página de configurações "Configurações do serviço externo":

- Aparece no menu "Configurações do plugin"
- Usa Antd Form para a UI do formulário
- Usa `ctx.api` para chamar a API do backend e ler/salvar a configuração
- Mostra notificação ao salvar com sucesso

![20260407161139](https://static-docs.nocobase.com/20260407161139.png)

O código-fonte completo está em [@nocobase-example/plugin-settings-page](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-settings-page). Se quiser executar localmente para ver o resultado:

```bash
yarn pm enable @nocobase-example/plugin-settings-page
```

A seguir, montamos esse plugin do zero, passo a passo.

## Passo 1: criar o esqueleto do plugin

Na raiz do repositório, execute:

```bash
yarn pm create @my-project/plugin-settings-page
```

Isso gera a estrutura básica de arquivos em `packages/plugins/@my-project/plugin-settings-page`, incluindo os diretórios `src/client-v2/`, `src/server/`, `src/locale/` etc. Para mais detalhes, veja [Escreva seu primeiro plugin](../../write-your-first-plugin).

## Passo 2: registrar a página de configurações

Edite `src/client-v2/plugin.tsx` e, em `load()`, use `this.pluginSettingsManager` para registrar a página de configurações. Em duas etapas — primeiro registre a entrada do menu com `addMenuItem()` e depois registre a página em si com `addPageTabItem()`:

```ts
// src/client-v2/plugin.tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class PluginSettingsPageClient extends Plugin<any, Application> {
  async load() {
    // 注册菜单入口
    this.pluginSettingsManager.addMenuItem({
      key: 'external-api',
      title: this.t('External API Settings'),
      icon: 'ApiOutlined', // Ant Design 图标，参考 https://5x.ant.design/components/icon
    });

    // Tab 1：API 配置（key 为 'index'，映射到菜单根路径 /admin/settings/external-api）
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'external-api',
      key: 'index',
      title: this.t('API Configuration'),
      componentLoader: () => import('./pages/ExternalApiSettingsPage'),
      sort: -1, // 排序值越小越靠前
    });

    // Tab 2：关于页面（映射到 /admin/settings/external-api/about）
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

Após o registro, no menu "Configurações do plugin" aparecerá a entrada "Configurações do serviço externo", e no topo haverá duas tabs — "Configuração da API" e "Sobre". Quando há apenas uma página no menu, a barra de tabs é ocultada automaticamente; aqui registramos duas, então será exibida. `this.t()` usa automaticamente o nome do pacote do plugin atual como namespace de i18n; veja [Context → Capacidades comuns](../ctx/common-capabilities#internacionalização-ctxt--ctxi18n) para detalhes.

![settings page](https://static-docs.nocobase.com/20260415160006.png)

## Passo 3: escrever o componente da página de configurações

Crie `src/client-v2/pages/ExternalApiSettingsPage.tsx`. A página de configurações é um componente React comum; aqui usamos `Form` e `Card` do Antd para montar a UI, `useFlowContext()` para obter `ctx.api` e interagir com o backend, e `useT()` para a função de tradução.

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

  // 加载已有配置
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

  // 保存配置
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

Pontos-chave:

- **`useFlowContext()`** — importado de `@nocobase/flow-engine`, fornece `ctx.api` e outras capacidades do contexto
- **`useT()`** — hook de tradução importado de `locale.ts`, já vinculado ao namespace do plugin; veja [i18n internacionalização](../component/i18n)
- **`useRequest()`** — vem de [ahooks](https://ahooks.js.org/hooks/use-request/index), gerencia os estados de loading/error da requisição. `manual: true` indica que a requisição não é disparada automaticamente, sendo necessário chamar `run()` manualmente
- **`ctx.api.request()`** — uso idêntico ao Axios; o NocoBase anexa automaticamente as informações de autenticação

## Passo 4: adicionar arquivos multilíngues

Edite os arquivos de tradução em `src/locale/` do plugin:

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

:::warning Atenção

Adicionar um novo arquivo de idioma pela primeira vez requer reiniciar a aplicação para ter efeito.

:::

Para mais informações sobre escrita de arquivos de tradução, hook `useT()`, `tExpr()` e outros usos, veja [i18n internacionalização](../component/i18n).

## Passo 5: APIs do servidor

O formulário do cliente precisa que o backend forneça as APIs `externalApi:get` e `externalApi:set`. A parte do servidor não é complexa — defina uma data table para armazenar a configuração e registre as duas APIs.

### Definir a data table

Crie `src/server/collections/externalApiSettings.ts`. O NocoBase carrega automaticamente as definições de collection desse diretório:

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

### Registrar resource e APIs

Edite `src/server/plugin.ts`. Use `resourceManager.define()` para registrar o resource e configure as permissões ACL:

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginSettingsPageServer extends Plugin {
  async load() {
    // 注册资源和接口
    this.app.resourceManager.define({
      name: 'externalApi',
      actions: {
        // GET /api/externalApi:get — 读取配置
        async get(ctx, next) {
          const repo = ctx.db.getRepository('externalApiSettings');
          const record = await repo.findOne();
          ctx.body = record?.toJSON() ?? {};
          await next();
        },
        // POST /api/externalApi:set — 保存配置
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

    // 登录用户可以读取配置
    this.app.acl.allow('externalApi', 'get', 'loggedIn');
  }
}

export default PluginSettingsPageServer;
```

Pontos-chave:

- **`ctx.db.getRepository()`** — obtém o objeto de operação de dados pelo nome da collection
- **`ctx.action.params.values`** — dados do body de uma requisição POST
- **`acl.allow()`** — `'loggedIn'` indica que usuários logados podem acessar. A API `set` não tem allow explícito; por padrão, somente administradores podem chamá-la
- **`await next()`** — cada action precisa chamá-lo no final; é a convenção do middleware Koa

## Passo 6: escrever a página "Sobre"

No passo 2, registramos duas tabs. O componente da página "Configuração da API" foi escrito no passo 3; agora vamos escrever a página da tab "Sobre".

Crie `src/client-v2/pages/AboutPage.tsx`:

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

Esta página é simples — usa `Descriptions` do Antd para mostrar informações do plugin. Em projetos reais, a tab "Sobre" pode ser usada para versão, changelog, links de ajuda etc.

## Passo 7: ativar o plugin

```bash
yarn pm enable @my-project/plugin-settings-page
```

Após ativar, atualize a página, e no menu "Configurações do plugin" aparecerá a entrada "Configurações do serviço externo".

![20260407161139](https://static-docs.nocobase.com/20260407161139.png)

## Código-fonte completo

- [@nocobase-example/plugin-settings-page](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-settings-page) — exemplo completo de página de configurações de plugin

## Resumo

Capacidades usadas neste exemplo:

| Capacidade           | Uso                                                            | Documentação                                                |
| -------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| Registrar página de configurações | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router de rotas](../router)                       |
| Página de configurações multi-tab | mesmo `menuKey` registrado em vários `addPageTabItem()` | [Router de rotas](../router)                            |
| Requisição API       | `ctx.api.request()`                                            | [Context → Capacidades comuns](../ctx/common-capabilities#requisição-api-ctxapi) |
| Internacionalização (cliente) | `this.t()` / `useT()`                                 | [i18n internacionalização](../component/i18n)               |
| Internacionalização (server) | `ctx.t()` / `plugin.t()`                               | [i18n internacionalização (server)](../../server/i18n)      |
| UI de formulário     | Antd Form                                                      | [Ant Design Form](https://5x.ant.design/components/form)    |

## Links relacionados

- [Escreva seu primeiro plugin](../../write-your-first-plugin) — criar o esqueleto do plugin do zero
- [Plugin](../plugin) — entrada do plugin e ciclo de vida
- [Router de rotas](../router) — rotas de página e registro de página de configurações de plugin
- [Context → Capacidades comuns](../ctx/common-capabilities) — ctx.api, ctx.t etc.
- [Desenvolvimento de Component](../component/index.md) — escrita de componentes React
- [Visão geral do desenvolvimento server-side](../../server) — definir APIs do backend
- [i18n internacionalização](../component/i18n) — escrita de arquivos de tradução
- [i18n internacionalização (server)](../../server/i18n) — tradução no servidor
