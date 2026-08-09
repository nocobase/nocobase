---
title: "Construcción con un AI Agent"
description: "Dirija a un AI Agent en lenguaje natural para que escriba las páginas frontend del AI Portal, con indicaciones sobre cómo escribir los prompts, consejos de colaboración y cómo resolver los problemas más habituales."
keywords: "AI Portal, AI Agent, construcción colaborativa, prompts, nocobase-portal-manage, Skills"
---

# Construcción con un AI Agent

:::tip Requisitos previos

Antes de leer esta página, asegúrese de tener su primer Portal en marcha siguiendo el [Inicio rápido del AI Portal](./index.md).

:::

El desarrollo diario del AI Portal es una conversación con un AI Agent: usted describe la página que quiere, el Agent escribe el código y usted comprueba el resultado en el navegador.

## Trabaje dentro del directorio del Portal

Antes de empezar, entre en el directorio de código fuente del Portal y abra allí su AI Agent. Así el Agent arranca en el contexto correcto, con acceso a `AGENTS.md` y al código existente.

Localice primero dónde está el directorio:

```bash
nb portal info main
```

La ruta de desarrollo que aparece en la salida es donde vive el código fuente del Portal. Haga `cd` hasta allí y abra después su AI Agent:

```bash
cd <directorio del espacio de trabajo de desarrollo>
```

A partir de ahí, basta con describir lo que necesita:

```
Añade una página de listado de pedidos al portal main de mi aplicación nocobase
```

## Haga que la IA lea antes de escribir

En la raíz de la plantilla hay un `AGENTS.md` que describe las convenciones de este proyecto: reutilizar preferentemente lo que ya existe en `src/extensions`, personalizar los componentes de UI mediante composición en lugar de editar los componentes base y no incorporar Ant Design. Los AI Agents que leen este archivo siguen estas convenciones automáticamente.

También puede añadir a `AGENTS.md` las convenciones de su propio proyecto: costumbres de nomenclatura, terminología de negocio, directorios que no hay que tocar. Una vez ahí se aplican en cada conversación, de modo que no tiene que repetirlas.

`src/extensions` contiene algunas extensiones integradas. Entre ellas, `nocobase-users-example` es una página CRUD completa con vistas de listado, creación, edición y detalle. Señalarle esa extensión a la IA funciona mejor que describir una página nueva desde cero:

```
Crea una página de gestión de productos siguiendo el patrón de nocobase-users-example
```

## Ejemplos de prompts

### Caso A: crear una página de negocio nueva

Basta con tres cosas: qué hay en la página, de dónde vienen los datos y cómo se comporta:

```
Añade una página de gestión de clientes:
la tabla muestra nombre, teléfono, correo electrónico y fecha de creación, con búsqueda por nombre,
al hacer clic en una fila se abre un cajón de detalles donde se puede editar y guardar el registro
```

<!-- 需要一张 AI 生成的客户管理页面效果截图，展示表格、搜索框和详情抽屉 -->

### Caso B: modificar una página existente

Para una petición de cambio, concrete qué cambia. No hace falta describir de nuevo toda la página:

```
Añade un filtro de estado al listado de clientes,
con las opciones «En seguimiento», «Ganado» y «Perdido», sin filtrar por defecto
```

<!-- 需要一张添加状态筛选后的页面截图 -->

### Caso C: conectar una tabla nueva

Una vez que la tabla existe, pida a la IA que genere las páginas correspondientes. Leerá las definiciones de los campos y elegirá en consecuencia los controles del formulario y las columnas del listado:

```
Acabo de crear una tabla contracts, hazme un conjunto de páginas CRUD para ella
```

Si la tabla todavía no existe, use [Modelado de datos](../data-modeling.md) para que la IA diseñe antes la estructura de datos y vuelva después a las páginas.

<!-- 需要一张根据数据表自动生成的增删改查页面截图 -->

### Caso D: reproducir un diseño

Cuando tenga un archivo de diseño o un prototipo HTML ya existente, páseselo a la IA:

```
Crea la página de inicio a partir de este prototipo,
mantén los mismos colores y la misma disposición, y conecta los datos a la tabla orders
```

<!-- 需要一个视频，展示给出原型图后 AI 复刻出页面的过程 -->

### Caso E: añadir un método de autenticación

Una vez habilitado un método de autenticación en el servidor, la página de inicio de sesión necesita el soporte correspondiente en el frontend:

```
En NocoBase está habilitado el inicio de sesión con DingTalk, añade un botón de inicio de sesión con DingTalk a la página de login
```

<!-- 需要一张登录页出现第三方登录按钮的截图 -->

## Consejos de colaboración

**Itere en pasos pequeños.** Pida a la IA una página o un cambio cada vez y compruebe el resultado antes de continuar. Si describe cinco páginas de golpe, cuando algo falle será difícil saber en qué paso se torció.

**Deje el servidor de desarrollo en marcha.** `nb portal dev main` recarga en caliente, así que verá el resultado justo después de cada cambio de la IA. Es el ciclo de retroalimentación más corto posible.

**Déle el error exacto.** Una página en blanco, una compilación fallida, un 403 de una API: pegue el mensaje de error completo y una captura a la IA en lugar de dejar que adivine. Unas pocas rondas suelen bastar para resolverlo. No necesita averiguar primero en qué capa está el problema.

![error](https://static-docs.nocobase.com/20260803204308.png)

## Preguntas frecuentes

**¿Cómo revierto cuando la IA se equivoca?**

Si el código fuente del Portal está bajo Git, basta con `git checkout`. Con el source storage `nocobase` por defecto, puede descargar una copia limpia desde el source storage y sobrescribir la local:

```bash
nb portal pull main --force
```

`--force` elimina el espacio de trabajo de desarrollo y vuelve a descargarlo, así que asegúrese de que no haya nada que quiera conservar antes de ejecutarlo. Para evitar ese compromiso, pase el código fuente a Git cuanto antes: consulte [Despliegue y gestión del código fuente](./deploy.md).

**¿Cómo diagnostico una compilación fallida?**

Ejecute primero una compilación en local para ver el error completo:

```bash
nb portal deploy main
```

Los errores de tipos de TypeScript y las dependencias que faltan son las dos causas más habituales. Pegue el error a la IA y deje que los corrija.

**¿Entran en conflicto mis ediciones manuales con las de la IA?**

No. El código fuente del Portal es un proyecto frontend corriente: puede editarlo usted cuando quiera y dejar que la IA continúe a partir de ahí. Mientras no estén editando ambos el mismo archivo en el mismo momento, no hay problema.

## Enlaces relacionados

- [Inicio rápido del AI Portal](./index.md) — ponga en marcha su primera entrada frontend escrita por la IA
- [Despliegue y gestión del código fuente](./deploy.md) — poner el código fuente del Portal bajo Git y el flujo de despliegue
- [Estructura del proyecto y stack técnico](./project-structure.md) — las convenciones de directorios de la plantilla, para que pueda juzgar si la IA lo ha hecho bien
- [Componentes estándar y extensiones](./components.md) — la base de componentes shadcn/ui y el mecanismo de extensión
- [Modelado de datos](../data-modeling.md) — deje que la IA diseñe las tablas antes de construir las páginas
- [`nb portal info`](../../api/cli/portal/info.md) — consulte dónde está el espacio de trabajo de desarrollo de un Portal
- [`nb portal pull`](../../api/cli/portal/pull.md) — vuelva a descargar el código fuente desde el source storage
