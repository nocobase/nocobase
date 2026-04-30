---
title: "Desarrollo de Component"
description: "Desarrollo de componentes en el cliente de NocoBase: cree páginas de plugins con React/Antd, gestione estado con observable y obtenga las capacidades de NocoBase con useFlowContext()."
keywords: "Component,desarrollo de componentes,React,Antd,observable,observer,useFlowContext,ctx,NocoBase"
---

# Desarrollo de Component

En NocoBase, el componente de página montado en una ruta es un componente React común. Puede escribirlo directamente con React + [Antd](https://5x.ant.design/) sin diferencia respecto al desarrollo frontend habitual.

NocoBase aporta además:

- **`observable` + `observer`**: la forma recomendada de gestionar estado, más adecuada para el ecosistema de NocoBase que `useState`.
- **`useFlowContext()`**: acceso a las capacidades del contexto de NocoBase (peticiones, internacionalización, navegación de rutas, etc.).

## Estructura básica

El componente de página más sencillo:

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

Una vez escrito, regístrelo en el `load()` del plugin con `this.router.add()`. Para más detalles, consulte [Router](../router).

## Gestión de estado: observable

NocoBase recomienda gestionar el estado con `observable` + `observer` en lugar del `useState` de React. Sus ventajas son:

- Modificar directamente las propiedades del objeto desencadena la actualización; no hace falta `setState`.
- Recolección automática de dependencias: el componente solo se vuelve a renderizar cuando cambian las propiedades realmente usadas.
- Coherente con el mecanismo reactivo subyacente de NocoBase (FlowModel, FlowContext, etc.).

Uso básico: cree el objeto reactivo con `observable.deep()` y envuelva el componente con `observer()`. Tanto `observable` como `observer` se importan desde `@nocobase/flow-engine`:

```tsx
import React from 'react';
import { Input } from 'antd';
import { observable, observer } from '@nocobase/flow-engine';

// Crear un objeto de estado reactivo
const state = observable.deep({
  text: '',
});

// Envolver el componente con observer; se actualizará al cambiar el estado
const DemoPage = observer(() => {
  return (
    <div>
      <Input
        placeholder="Escriba algo..."
        value={state.text}
        onChange={(e) => {
          state.text = e.target.value;
        }}
      />
      {state.text && <div style={{ marginTop: 8 }}>Ha escrito: {state.text}</div>}
    </div>
  );
});

export default DemoPage;
```

Vista previa:

```tsx file="./_demos/observable-basic.tsx" preview
```

Para más detalles, consulte [Mecanismo reactivo Observable](../../../flow-engine/observable).

## Uso de useFlowContext

`useFlowContext()` es el punto de entrada a las capacidades de NocoBase. Se importa desde `@nocobase/flow-engine` y devuelve un objeto `ctx`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();
  // ctx.api — peticiones
  // ctx.t — internacionalización
  // ctx.router — navegación de rutas
  // ctx.logger — registro
  // ...
}
```

A continuación se muestran ejemplos de las capacidades más comunes.

### Peticiones

Llame al backend con `ctx.api.request()`. Su uso es idéntico al de [Axios](https://axios-http.com/):

```tsx
const response = await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
console.log(response.data);
```

### Internacionalización

Obtenga textos traducidos con `ctx.t()`:

```tsx
const label = ctx.t('Hello');
// Especificar un namespace
const msg = ctx.t('Save success', { ns: '@my-project/plugin-hello' });
```

### Navegación de rutas

Use `ctx.router.navigate()` para navegar a otra página:

```tsx
ctx.router.navigate('/some-page'); // -> /v2/some-page
```

Obtenga los parámetros de la ruta actual:

```tsx
// Por ejemplo, ruta definida como /users/:id
const { id } = ctx.route.params; // Parámetros dinámicos
```

Obtenga el nombre de la ruta actual:

```tsx
const { name } = ctx.route; // Nombre de la ruta
```

<!-- ### Mensajes, diálogos y notificaciones

NocoBase encapsula los componentes de feedback de Antd a través de ctx, y se pueden invocar directamente desde el código de lógica:

```tsx
// Mensaje (ligero, desaparece automáticamente)
ctx.message.success('Guardado correctamente');

// Diálogo de confirmación (bloqueante, espera acción del usuario)
const confirmed = await ctx.modal.confirm({
  title: '¿Confirmar eliminación?',
  content: 'No se puede deshacer.',
});

// Notificación (aparece a la derecha, adecuada para mensajes más largos)
ctx.notification.open({
  message: 'Importación finalizada',
  description: 'Se importaron 42 registros.',
});
```

### Logger

Salida de logs estructurados con `ctx.logger`:

```tsx
ctx.logger.info('Página cargada', { page: 'UserList' });
ctx.logger.error('Error al cargar datos', { error });
``` -->

Para más niveles de log y usos, consulte [Context → Capacidades comunes](../ctx/common-capabilities).

## Ejemplo completo

Combinando observable, useFlowContext y Antd, un componente de página que carga datos del backend y los muestra:

```tsx
// pages/PostListPage.tsx
import React, { useEffect } from 'react';
import { Button, Card, List, Spin } from 'antd';
import { observable, observer, FlowContext, useFlowContext } from '@nocobase/flow-engine';

interface Post {
  id: number;
  title: string;
}

// Gestionar el estado de la página con observable
const state = observable.deep({
  posts: [] as Post[],
  loading: true,
});

const PostListPage = observer(() => {
  const ctx = useFlowContext();

  useEffect(() => {
    loadPosts(ctx);
  }, []);

  return (
    <Card title={ctx.t('Post list')}>
      <Spin spinning={state.loading}>
        <List
          dataSource={state.posts}
          renderItem={(post: Post) => (
            <List.Item
              actions={[
                <Button danger onClick={() => handleDelete(ctx, post.id)}>
                  {ctx.t('Delete')}
                </Button>,
              ]}
            >
              {post.title}
            </List.Item>
          )}
        />
      </Spin>
    </Card>
  );
});

async function loadPosts(ctx: FlowContext) {
  state.loading = true;
  try {
    const response = await ctx.api.request({
      url: 'posts:list',
      method: 'get',
    });
    state.posts = response.data?.data || [];
  } catch (error) {
    ctx.logger.error('Error al cargar la lista de publicaciones', { error });
  } finally {
    state.loading = false;
  }
}

async function handleDelete(ctx: FlowContext, id: number) {
  await ctx.api.request({
    url: `posts:destroy/${id}`,
    method: 'post',
  });
  loadPosts(ctx); // Refrescar la lista
}

export default PostListPage;
```

## A continuación

- Capacidades completas que ofrece `useFlowContext`: consulte [Context](../ctx/index.md).
- Estilo y personalización del tema de los componentes: consulte [Styles & Themes](./styles-themes).
- Si su componente necesita aparecer en los menús "Añadir bloque / campo / acción" de NocoBase y admitir configuración visual, debe envolverlo con FlowModel: consulte [FlowEngine](../flow-engine/index.md).
- ¿No sabe si usar Component o FlowModel? Consulte [Component vs FlowModel](../component-vs-flow-model).

## Enlaces relacionados

- [Router](../router): registrar rutas de páginas y montar componentes en una URL.
- [Context](../ctx/index.md): introducción completa a las capacidades de `useFlowContext`.
- [Styles & Themes](./styles-themes): `createStyles`, theme tokens, etc.
- [FlowEngine](../flow-engine/index.md): use FlowModel cuando necesite configuración visual.
- [Mecanismo reactivo Observable](../../../flow-engine/observable): gestión reactiva del estado en FlowEngine.
- [Context → Capacidades comunes](../ctx/common-capabilities): `ctx.api`, `ctx.t` y otras capacidades integradas.
- [Component vs FlowModel](../component-vs-flow-model): cómo elegir entre componente y FlowModel.
