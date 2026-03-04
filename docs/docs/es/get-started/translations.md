:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/get-started/translations).
:::

# Contribución a la traducción

El idioma por defecto de NocoBase es el inglés. Actualmente, la aplicación principal es compatible con inglés, italiano, neerlandés, chino simplificado y japonés. Le invitamos cordialmente a contribuir con traducciones para otros idiomas, permitiendo que los usuarios de todo el mundo disfruten de una experiencia de NocoBase aún más accesible.

---

## I. Localización del sistema

### 1. Traducción de la interfaz del sistema y plugins

#### 1.1 Alcance de la traducción
Esto se aplica únicamente a la localización de la interfaz del sistema NocoBase y sus plugins, y no incluye otros contenidos personalizados (como tablas de datos o bloques de Markdown).

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 Resumen del contenido de localización
NocoBase utiliza Git para gestionar su contenido de localización. El repositorio principal es:
https://github.com/nocobase/nocobase/tree/main/locales

Cada idioma está representado por un archivo JSON nombrado según su código de idioma (por ejemplo, de-DE.json, fr-FR.json). La estructura del archivo se organiza por módulos de plugins, utilizando pares clave-valor para almacenar las traducciones. Por ejemplo:

```json
{
  // Plugin del cliente
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...otros pares clave-valor
  },
  "@nocobase/plugin-acl": {
    // Pares clave-valor para este plugin
  }
  // ...otros módulos de plugins
}
```

Al traducir, por favor conviértalo gradualmente a una estructura similar a la siguiente:

```json
{
  // Plugin del cliente
  "@nocobase/client": {
    "(Fields only)": "(Solo campos - traducido)",
    "12 hour": "12 horas",
    "24 hour": "24 horas"
    // ...otros pares clave-valor
  },
  "@nocobase/plugin-acl": {
    // Pares clave-valor para este plugin
  }
  // ...otros módulos de plugins
}
```

#### 1.3 Pruebas y sincronización de la traducción
- Una vez finalizada la traducción, por favor pruebe y verifique que todos los textos se muestren correctamente.
También hemos publicado un plugin de validación de traducción; busque `Locale tester` en el mercado de plugins.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
Después de la instalación, copie el contenido JSON del archivo de localización correspondiente en el repositorio git, péguelo dentro y haga clic en Aceptar para verificar si el contenido de la traducción es efectivo.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- Una vez enviado, los scripts del sistema sincronizarán automáticamente el contenido de localización con el repositorio de código.

#### 1.4 Plugin de localización de NocoBase 2.0

> **Nota:** Esta sección está en desarrollo. El plugin de localización para NocoBase 2.0 presenta algunas diferencias con respecto a la versión 1.x. Se proporcionarán detalles en una actualización futura.

<!-- TODO: Añadir detalles sobre las diferencias del plugin de localización 2.0 -->

## II. Localización de la documentación (NocoBase 2.0)

La documentación de NocoBase 2.0 se gestiona bajo una nueva estructura. Los archivos fuente de la documentación se encuentran en el repositorio principal de NocoBase:

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 Estructura de la documentación

La documentación utiliza [Rspress](https://rspress.dev/) como generador de sitios estáticos y admite 22 idiomas. La estructura se organiza de la siguiente manera:

```
docs/
├── docs/
│   ├── en/                    # Inglés (idioma de origen)
│   ├── cn/                    # Chino simplificado
│   ├── ja/                    # Japonés
│   ├── ko/                    # Coreano
│   ├── de/                    # Alemán
│   ├── fr/                    # Francés
│   ├── es/                    # Español
│   ├── pt/                    # Portugués
│   ├── ru/                    # Ruso
│   ├── it/                    # Italiano
│   ├── tr/                    # Turco
│   ├── uk/                    # Ucraniano
│   ├── vi/                    # Vietnamita
│   ├── id/                    # Indonesio
│   ├── th/                    # Tailandés
│   ├── pl/                    # Polaco
│   ├── nl/                    # Neerlandés
│   ├── cs/                    # Checo
│   ├── ar/                    # Árabe
│   ├── he/                    # Hebreo
│   ├── hi/                    # Hindi
│   ├── sv/                    # Sueco
│   └── public/                # Recursos compartidos (imágenes, etc.)
├── theme/                     # Tema personalizado
├── rspress.config.ts          # Configuración de Rspress
└── package.json
```

### 2.2 Flujo de trabajo de traducción

1. **Sincronización con la fuente en inglés**: Todas las traducciones deben basarse en la documentación en inglés (`docs/en/`). Cuando se actualice la documentación en inglés, las traducciones deberán actualizarse en consecuencia.

2. **Estrategia de ramas**:
   - Utilice la rama `develop` o `next` como referencia para el contenido más reciente en inglés.
   - Cree su rama de traducción a partir de la rama de destino.

3. **Estructura de archivos**: Cada directorio de idioma debe reflejar la estructura del directorio en inglés. Por ejemplo:
   ```
   docs/en/get-started/index.md    →    docs/es/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/es/api/acl/acl.md
   ```

### 2.3 Cómo contribuir con traducciones

1. Realice un Fork del repositorio: https://github.com/nocobase/nocobase
2. Clone su fork y sitúese en la rama `develop` o `next`.
3. Navegue al directorio `docs/docs/`.
4. Busque el directorio del idioma al que desea contribuir (por ejemplo, `es/` para español).
5. Traduzca los archivos markdown, manteniendo la misma estructura de archivos que la versión en inglés.
6. Pruebe sus cambios localmente:
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. Envíe un Pull Request al repositorio principal.

### 2.4 Guía de traducción

- **Mantenga la consistencia del formato**: Conserve la misma estructura de markdown, encabezados, bloques de código y enlaces que el original.
- **Preserve el frontmatter**: Mantenga cualquier YAML frontmatter en la parte superior de los archivos sin cambios, a menos que contenga contenido traducible.
- **Referencias de imágenes**: Utilice las mismas rutas de imagen de `docs/public/`; las imágenes se comparten entre todos los idiomas.
- **Enlaces internos**: Actualice los enlaces internos para que apunten a la ruta del idioma correcto.
- **Ejemplos de código**: Por lo general, los ejemplos de código no deben traducirse, pero los comentarios dentro del código sí pueden traducirse.

### 2.5 Configuración de navegación

La estructura de navegación para cada idioma se define en los archivos `_nav.json` y `_meta.json` dentro de cada directorio de idioma. Al añadir nuevas páginas o secciones, asegúrese de actualizar estos archivos de configuración.

## III. Localización del sitio web

Las páginas del sitio web y todo su contenido se almacenan en:
https://github.com/nocobase/website

### 3.1 Recursos de inicio y referencia

Al añadir un nuevo idioma, por favor consulte las páginas de idiomas existentes:
- Inglés: https://github.com/nocobase/website/tree/main/src/pages/en
- Chino: https://github.com/nocobase/website/tree/main/src/pages/cn
- Japonés: https://github.com/nocobase/website/tree/main/src/pages/ja

![Diagrama de localización del sitio web](https://static-docs.nocobase.com/20250319121600.png)

Las modificaciones de estilo global se encuentran en:
- Inglés: https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- Chino: https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- Japonés: https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![Diagrama de estilo global](https://static-docs.nocobase.com/20250319121501.png)

La localización de los componentes globales del sitio web está disponible en:
https://github.com/nocobase/website/tree/main/src/components

![Diagrama de componentes del sitio web](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 Estructura de contenido y método de localización

Utilizamos un enfoque de gestión de contenido mixto. El contenido y los recursos en inglés, chino y japonés se sincronizan regularmente desde el sistema CMS y se sobrescriben, mientras que otros idiomas pueden editarse directamente en archivos locales. El contenido local se almacena en el directorio `content`, organizado de la siguiente manera:

```
/content
  /articles        # Artículos del blog
    /article-slug
      index.md     # Contenido en inglés (por defecto)
      index.cn.md  # Contenido en chino
      index.ja.md  # Contenido en japonés
      metadata.json # Metadatos y otras propiedades de localización
  /tutorials       # Tutoriales
  /releases        # Información de lanzamientos
  /pages           # Algunas páginas estáticas
  /categories      # Información de categorías
    /article-categories.json  # Lista de categorías de artículos
    /category-slug            # Detalles de categoría individual
      /category.json
  /tags            # Información de etiquetas
    /article-tags.json        # Lista de etiquetas de artículos
    /release-tags.json        # Lista de etiquetas de lanzamientos
    /tag-slug                 # Detalles de etiqueta individual
      /tag.json
  /help-center     # Contenido del centro de ayuda
    /help-center-tree.json    # Estructura de navegación del centro de ayuda
  ....
```

### 3.3 Guía de traducción de contenido

- Sobre la traducción de contenido Markdown

1. Cree un nuevo archivo de idioma basado en el archivo por defecto (por ejemplo, de `index.md` a `index.es.md`).
2. Añada las propiedades localizadas en los campos correspondientes del archivo JSON.
3. Mantenga la consistencia en la estructura de archivos, enlaces y referencias de imágenes.

- Traducción de contenido JSON
Muchos metadatos de contenido se almacenan en archivos JSON, que normalmente contienen campos multilingües:

```json
{
  "id": 123,
  "title": "English Title",       // Título en inglés (por defecto)
  "title_cn": "中文标题",          // Título en chino
  "title_ja": "日本語タイトル",    // Título en japonés
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // Ruta URL (normalmente no se traduce)
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**Notas de traducción:**

1. **Convención de nomenclatura de campos**: Los campos de traducción suelen utilizar el formato `{campo_original}_{código_idioma}`.
   - Por ejemplo: title_es (título en español), description_de (descripción en alemán).

2. **Al añadir un nuevo idioma**:
   - Añada una versión con el sufijo del idioma correspondiente para cada campo que necesite traducción.
   - No modifique los valores de los campos originales (como title, description, etc.), ya que sirven como contenido del idioma por defecto (inglés).

3. **Mecanismo de sincronización del CMS**:
   - El sistema CMS actualiza periódicamente el contenido en inglés, chino y japonés.
   - El sistema solo actualizará/sobrescribirá el contenido de estos tres idiomas (algunas propiedades en el JSON) y **no eliminará** los campos de idioma añadidos por otros colaboradores.
   - Por ejemplo: si ha añadido una traducción al español (title_es), la sincronización del CMS no afectará a este campo.


### 3.4 Configuración del soporte para un nuevo idioma

Para añadir soporte para un nuevo idioma, debe modificar la configuración `SUPPORTED_LANGUAGES` en el archivo `src/utils/index.ts`:

```typescript
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    default: true
  },
  cn: {
    code: 'cn',
    locale: 'zh-CN',
    name: 'Chinese'
  },
  ja: {
    code: 'ja',
    locale: 'ja-JP',
    name: 'Japanese'
  },
  // Ejemplo de cómo añadir un nuevo idioma:
  es: {
    code: 'es',
    locale: 'es-ES',
    name: 'Spanish'
  }
};
```

### 3.5 Archivos de diseño (Layout) y estilos

Cada idioma necesita sus archivos de diseño correspondientes:

1. Cree un nuevo archivo de diseño (por ejemplo, para español, cree `src/layouts/BaseES.astro`).
2. Puede copiar un archivo de diseño existente (como `BaseEN.astro`) y traducirlo.
3. El archivo de diseño contiene traducciones para elementos globales como menús de navegación, pies de página, etc.
4. Asegúrese de actualizar la configuración del selector de idiomas para que cambie correctamente al idioma recién añadido.

### 3.6 Creación de directorios de páginas por idioma

Cree directorios de páginas independientes para el nuevo idioma:

1. Cree una carpeta con el nombre del código del idioma en el directorio `src` (por ejemplo, `src/es/`).
2. Copie la estructura de páginas de otros directorios de idiomas (por ejemplo, `src/en/`).
3. Actualice el contenido de las páginas, traduciendo títulos, descripciones y textos al idioma de destino.
4. Asegúrese de que las páginas utilicen el componente de diseño correcto (por ejemplo, `.layout: '@/layouts/BaseES.astro'`).

### 3.7 Localización de componentes

Algunos componentes comunes también requieren traducción:

1. Revise los componentes en el directorio `src/components/`.
2. Preste especial atención a los componentes con texto fijo (como barras de navegación, pies de página, etc.).
3. Los componentes pueden utilizar renderizado condicional para mostrar contenido en diferentes idiomas:

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/es') && <p>Contenido en español</p>}
```

### 3.8 Pruebas y validación

Tras completar la traducción, realice pruebas exhaustivas:

1. Ejecute el sitio web localmente (normalmente usando `yarn dev`).
2. Compruebe cómo se muestran todas las páginas en el nuevo idioma.
3. Verifique que la funcionalidad de cambio de idioma funcione correctamente.
4. Asegúrese de que todos los enlaces apunten a las versiones de página del idioma correcto.
5. Revise los diseños responsivos para asegurar que el texto traducido no rompa el diseño de la página.

## IV. Cómo empezar a traducir

Si desea contribuir con una nueva traducción de idioma para NocoBase, por favor siga estos pasos:

| Componente | Repositorio | Rama | Notas |
|------------|-------------|------|-------|
| Interfaz del sistema | https://github.com/nocobase/nocobase/tree/main/locales | main | Archivos JSON de localización |
| Documentación (2.0) | https://github.com/nocobase/nocobase | develop / next | Directorio `docs/docs/<lang>/` |
| Sitio web | https://github.com/nocobase/website | main | Ver Sección III |

Una vez finalizada su traducción, por favor envíe un Pull Request a NocoBase. Los nuevos idiomas aparecerán en la configuración del sistema, permitiéndole seleccionar qué idiomas mostrar.

![Diagrama de idiomas habilitados](https://static-docs.nocobase.com/20250319123452.png)

## Documentación de NocoBase 1.x

Para la guía de traducción de NocoBase 1.x, por favor consulte:

https://docs.nocobase.com/welcome/community/translations