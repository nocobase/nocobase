---
title: "Componentes estándar y extensiones"
description: "La base de componentes shadcn/ui del AI Portal y su mecanismo de extensión: un directorio por extensión, descubiertas y montadas automáticamente."
keywords: "AI Portal, shadcn/ui, componentes, extensiones, AppExtension, Registry, Tailwind CSS"
---

# Componentes estándar y extensiones

:::tip Requisitos previos

Antes de leer esta página, asegúrese de tener su primer Portal en marcha siguiendo el [Inicio rápido del AI Portal](./index.md).

:::

La interfaz de un Portal tiene dos partes: `src/components/ui` aporta los componentes base y `src/extensions` alberga los módulos de negocio. Esta página explica cómo se usan ambas.

## Base de componentes

`src/components/ui` contiene unos 60 componentes de [shadcn/ui](https://ui.shadcn.com/): botones, formularios, diálogos, cajones, tablas, gráficos, todos los habituales. El estilo se configura en `components.json` y los iconos vienen de lucide.

A diferencia de lo que ocurre al incorporar una biblioteca de componentes, **el código fuente de estos componentes pertenece a su proyecto**. Vive en su repositorio, puede cambiarlo libremente y las actualizaciones de upstream nunca lo sobrescriben.

Por eso conviene personalizar mediante composición en lugar de editarlos directamente:

```tsx
// Recomendado: envolverlo, para que el componente base siga siendo reemplazable
import { Button } from "@/components/ui/button";

export function SubmitButton(props) {
  return <Button variant="default" size="lg" {...props} />;
}
```

Editar `src/components/ui/button.tsx` directamente también funciona, pero dificulta incorporar más adelante las correcciones de errores de upstream. Cuando realmente necesite cambiar un componente base, compárelo antes con la versión de upstream y fusione de forma selectiva en lugar de sobrescribir en bloque sus cambios locales.

:::warning Atención

No incorpore Ant Design, ni los componentes de cliente de NocoBase basados en Ant Design, a un Portal. El sistema de estilos del Portal es Tailwind CSS más shadcn/ui, y mezclarlos provoca conflictos de estilos. Esta convención ya está recogida en el `AGENTS.md` de la plantilla.

:::

## Mecanismo de extensión

Las funcionalidades de negocio se escriben como extensiones bajo `src/extensions/`, un directorio por módulo funcional:

```text
src/extensions/
├── nocobase-acl/               Componentes de permisos
├── nocobase-ai/                Capacidades de conversación con IA
├── nocobase-route-surfaces/    Soportes de ruta de página, cajón y ventana modal
└── nocobase-users-example/     Ejemplo de gestión de usuarios
```

Cada directorio tiene un `extension.tsx` con una exportación por defecto de tipo `AppExtension`. La plantilla las escanea y las carga automáticamente: **basta con dejarla en el directorio para que funcione, sin tocar ningún código de registro**.

## AppExtension

Una extensión puede aportar lo siguiente:

| Campo | Descripción |
| --- | --- |
| `id` | Identificador de la extensión, obligatorio |
| `priority` | Orden de carga; los números menores van primero, 100 por defecto |
| `resources` | Definiciones de recursos de Refine, que determinan el menú de navegación y el mapeo de rutas |
| `routes` | Elementos de ruta, montados bajo el árbol de rutas autenticadas |
| `Provider` | Un Provider que envuelve toda la aplicación |
| `AuthRuntimeProvider` | Provider del runtime de autenticación, activo antes del inicio de sesión |
| `UserMenuItems` | Entradas que se añaden al menú de usuario |
| `authAdapters` | Adaptadores de métodos de autenticación |
| `dev` | Recursos y rutas que solo se aplican en modo de desarrollo |

Una extensión mínima tiene este aspecto:

```tsx
import type { AppExtension } from "@/app/extension";
import { Route } from "react-router";
import { Package } from "lucide-react";
import { ProductList } from "./list";

const productsExtension: AppExtension = {
  id: "products",
  resources: [
    {
      name: "products",
      list: "/products",
      meta: {
        label: "Products",
        icon: <Package />,
        acl: { type: "collection" }, // Participa en la comprobación de permisos de tabla de NocoBase
      },
    },
  ],
  routes: <Route path="/products" element={<ProductList />} />,
};

export default productsExtension;
```

## Extensiones integradas

La plantilla incluye cuatro extensiones. Están listas para usar y además son la mejor referencia a la hora de escribir código nuevo:

**`nocobase-users-example`**: un módulo CRUD completo sobre la tabla estándar `users` de NocoBase, con vistas de listado, creación, edición y detalle. Señálesela a la IA cuando cree una página nueva.

**`nocobase-acl`**: componentes de permisos: `CanAccess`, `AclPage`, `AclRegion`, `AclField` y `RoleSwitcher`.

**`nocobase-route-surfaces`**: tres soportes de ruta: página completa, cajón y ventana modal. El mismo contenido puede abrirse como página independiente o desplegarse como cajón dentro de una página de listado, con el estado de la ruta siempre sincronizado.

**`nocobase-ai`**: lleva al frontend las capacidades de conversación con IA de NocoBase, incluidas la ventana de chat, el streaming, el historial de conversaciones y el contexto de la página. Úsela para incorporar un asistente de IA a su propio Portal.

## Reglas de importación

Al escribir una extensión se aplican dos convenciones de rutas:

- Use el alias `@/` para todo lo que proceda de la aplicación anfitriona, por ejemplo `@/components/ui/button`
- Evite que las importaciones relativas dentro de la extensión salgan de su propio directorio

Así cada extensión queda autocontenida y puede copiar el directorio entero a otro Portal y seguir usándola.

## Extensiones oficiales instalables

<!-- Registry 的对外地址和可安装项清单待定，确定后补充这一节：怎么安装、有哪些可选扩展、安装后源码落在哪里 -->

Además de las cuatro integradas, NocoBase ofrecerá un conjunto de extensiones oficiales que podrá instalar según sus necesidades. Una vez instaladas, el código fuente queda bajo `src/extensions/` y pasa a ser código propio de su proyecto, igual que una extensión integrada, listo para modificarse y confirmarse junto con la aplicación.

## Internacionalización

Los textos viven en `src/locales/`, y la plantilla incluye inglés y chino. Una extensión también puede tener su propio paquete de idiomas: cree un directorio `locales/` dentro de la extensión e impórtelo desde `extension.tsx`.

## Enlaces relacionados

- [Inicio rápido del AI Portal](./index.md) — ponga en marcha su primera entrada frontend escrita por la IA
- [Estructura del proyecto y stack técnico](./project-structure.md) — las convenciones de directorios completas y los comandos habituales
- [Construcción con un AI Agent](./agent-workflow.md) — haga que la IA siga una extensión integrada al escribir un módulo nuevo
