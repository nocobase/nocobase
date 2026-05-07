---
title: "Crear una página de configuración del plugin"
description: "Tutorial práctico: cree una página de configuración con pluginSettingsManager + Component + ctx.api para gestionar una API Key de un servicio externo."
keywords: "página de configuración,pluginSettingsManager,addMenuItem,addPageTabItem,Antd Form,ctx.api,NocoBase"
---

# Crear una página de configuración del plugin

Muchos plugins necesitan una página de configuración para que el usuario configure parámetros: la API Key de un servicio de terceros, una URL de webhook, etc. Este ejemplo muestra cómo crear una página de configuración completa con `pluginSettingsManager` + componente React + `ctx.api`.

Este ejemplo no usa FlowEngine: es solo Plugin + Router + Component + Context.

:::tip Lectura previa

Se recomienda revisar antes los siguientes contenidos:

- [Crear el primer plugin](../../write-your-first-plugin): creación del plugin y estructura de directorios.
- [Plugin](../plugin): entrada del plugin y ciclo de vida de `load()`.
- [Router](../router): registro de páginas de configuración con `pluginSettingsManager`.
- [Desarrollo de Component](../component/index.md): forma de escribir componentes React y `useFlowContext`.
- [Internacionalización (i18n)](../component/i18n): archivos de traducción y uso de `useT()`.

:::


## Resultado final

Vamos a crear una página de configuración "External API Settings":

- Aparece en el menú "Configuración del plugin".
- La UI del formulario se construye con Antd Form.
- Se utiliza `ctx.api` para leer y guardar la configuración en el backend.
- Se muestra un mensaje al guardar correctamente.

![20260407161139](https://static-docs.nocobase.com/20260407161139.png)

Código fuente completo en [@nocobase-example/plugin-settings-page](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-settings-page). Para ejecutarlo en local:

```bash
yarn pm enable @nocobase-example/plugin-settings-page
```

A continuación se construye el plugin paso a paso.

## Paso 1: crear el esqueleto del plugin

Desde la raíz del repositorio:

```bash
yarn pm create @my-project/plugin-settings-page
```

Esto genera la estructura básica en `packages/plugins/@my-project/plugin-settings-page`, con los directorios `src/client-v2/`, `src/server/`, `src/locale/`, etc. Para más detalles, consulte [Crear el primer plugin](../../write-your-first-plugin).

## Paso 2: registrar la página de configuración

Edite `src/client-v2/plugin.tsx` y, en `load()`, registre la página de configuración con `this.pluginSettingsManager`. Son dos pasos: primero `addMenuItem()` para registrar la entrada del menú y luego `addPageTabItem()` para registrar la página real:

```ts
// src/client-v2/plugin.tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class PluginSettingsPageClient extends Plugin<any, Application> {
  async load() {
    // Registrar la entrada del menú
    this.pluginSettingsManager.addMenuItem({
      key: 'external-api',
      title: this.t('External API Settings'),
      icon: 'ApiOutlined', // Iconos de Ant Design, ver https://5x.ant.design/components/icon
    });

    // Tab 1: configuración de API (key 'index', se asigna a la ruta raíz del menú /admin/settings/external-api)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'external-api',
      key: 'index',
      title: this.t('API Configuration'),
      componentLoader: () => import('./pages/ExternalApiSettingsPage'),
      sort: -1, // Cuanto menor el sort, más arriba
    });

    // Tab 2: página "Acerca de" (se asigna a /admin/settings/external-api/about)
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

Tras el registro, en el menú "Configuración del plugin" aparecerá la entrada "External API Settings", con dos pestañas en la parte superior: "API Configuration" y "About". Cuando solo hay una página bajo el menú, la barra de pestañas se oculta automáticamente; aquí, al haber dos, se muestra. `this.t()` usa automáticamente como namespace de i18n el nombre del paquete del plugin actual; consulte [Context → Capacidades comunes](../ctx/common-capabilities#internacionalización-ctxt--ctxi18n).

![settings page](https://static-docs.nocobase.com/20260415160006.png)

## Paso 3: escribir el componente de la página de configuración

Cree `src/client-v2/pages/ExternalApiSettingsPage.tsx`. La página de configuración es un componente React común; aquí construimos la UI con `Form` y `Card` de Antd, `useFlowContext()` para acceder a `ctx.api` y comunicarnos con el backend, y `useT()` para obtener la función de traducción.

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

  // Cargar la configuración existente
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

  // Guardar la configuración
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

Puntos clave:

- **`useFlowContext()`**: importado de `@nocobase/flow-engine`, permite acceder a `ctx.api` y al resto del contexto.
- **`useT()`**: hook de traducción importado de `locale.ts`, ya enlazado al namespace del plugin. Consulte [Internacionalización (i18n)](../component/i18n).
- **`useRequest()`**: viene de [ahooks](https://ahooks.js.org/hooks/use-request/index) y gestiona los estados de loading/error de la petición. `manual: true` indica que no se ejecuta de forma automática y debe llamarse a `run()` manualmente.
- **`ctx.api.request()`**: uso idéntico al de Axios; NocoBase incluye automáticamente la información de autenticación.

## Paso 4: añadir los archivos de traducción

Edite los archivos en `src/locale/`:

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

:::warning Atención

La primera vez que añada un archivo de idioma debe reiniciar la aplicación para que surta efecto.

:::

Para más detalles sobre los archivos de traducción, el hook `useT()` y `tExpr()`, consulte [Internacionalización (i18n)](../component/i18n).

## Paso 5: endpoints del servidor

El formulario del cliente necesita dos endpoints en el backend: `externalApi:get` y `externalApi:set`. La parte de servidor no es complicada: definimos una tabla para guardar la configuración y registramos los dos endpoints.

### Definir la tabla

Cree `src/server/collections/externalApiSettings.ts`. NocoBase carga automáticamente las definiciones de Collection en este directorio:

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

### Registrar el resource y los endpoints

Edite `src/server/plugin.ts` y registre el resource con `resourceManager.define()`, configurando además los permisos ACL:

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginSettingsPageServer extends Plugin {
  async load() {
    // Registrar resource y endpoints
    this.app.resourceManager.define({
      name: 'externalApi',
      actions: {
        // GET /api/externalApi:get — leer la configuración
        async get(ctx, next) {
          const repo = ctx.db.getRepository('externalApiSettings');
          const record = await repo.findOne();
          ctx.body = record?.toJSON() ?? {};
          await next();
        },
        // POST /api/externalApi:set — guardar la configuración
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

    // Los usuarios autenticados pueden leer la configuración
    this.app.acl.allow('externalApi', 'get', 'loggedIn');
  }
}

export default PluginSettingsPageServer;
```

Puntos clave:

- **`ctx.db.getRepository()`**: devuelve el objeto de operaciones de datos a partir del nombre de la Collection.
- **`ctx.action.params.values`**: cuerpo (body) de la petición POST.
- **`acl.allow()`**: `'loggedIn'` indica que basta con estar autenticado. Como el endpoint `set` no se ha permitido explícitamente, por defecto solo los administradores pueden invocarlo.
- **`await next()`**: cada acción debe llamarlo al final; es la convención del middleware de Koa.

## Paso 6: escribir la página "Acerca de"

En el paso 2 registramos dos pestañas; el componente de "API Configuration" se escribió en el paso 3, ahora toca la página de "About".

Cree `src/client-v2/pages/AboutPage.tsx`:

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

Esta página es muy sencilla: usa `Descriptions` de Antd para mostrar información del plugin. En proyectos reales la pestaña "About" puede contener versión, changelog, enlaces de ayuda, etc.

## Paso 7: activar el plugin

```bash
yarn pm enable @my-project/plugin-settings-page
```

Tras activarlo, refresque la página: en el menú "Configuración del plugin" aparecerá la entrada "External API Settings".

![20260407161139](https://static-docs.nocobase.com/20260407161139.png)

## Código fuente completo

- [@nocobase-example/plugin-settings-page](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-settings-page): página de configuración del plugin completa.

## Resumen

Capacidades utilizadas en este ejemplo:

| Capacidad             | Uso                                                        | Documentación                                                  |
| --------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| Registro de la página de configuración | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router)                                            |
| Página de configuración con varias pestañas | Varios `addPageTabItem()` con el mismo `menuKey`     | [Router](../router)                                            |
| Petición API          | `ctx.api.request()`                                        | [Context → Capacidades comunes](../ctx/common-capabilities#peticiones-api-ctxapi) |
| Internacionalización (cliente) | `this.t()` / `useT()`                                  | [Internacionalización (i18n)](../component/i18n)                |
| Internacionalización (servidor) | `ctx.t()` / `plugin.t()`                              | [Internacionalización (servidor)](../../server/i18n)            |
| Formulario UI         | Antd Form                                                  | [Ant Design Form](https://5x.ant.design/components/form)       |

## Enlaces relacionados

- [Crear el primer plugin](../../write-your-first-plugin): crear el esqueleto desde cero.
- [Plugin](../plugin): entrada del plugin y ciclo de vida.
- [Router](../router): rutas de páginas y registro de la página de configuración.
- [Context → Capacidades comunes](../ctx/common-capabilities): `ctx.api`, `ctx.t`, etc.
- [Desarrollo de Component](../component/index.md): forma de escribir componentes React.
- [Visión general del desarrollo en servidor](../../server): definición de endpoints en el backend.
- [Internacionalización (i18n)](../component/i18n): archivos de traducción.
- [Internacionalización (servidor)](../../server/i18n): traducciones en el servidor.
