:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/t).
:::

# ctx.t()

Una función de acceso rápido de i18n utilizada en RunJS para traducir textos basados en la configuración de idioma del contexto actual. Es adecuada para la internacionalización de textos en línea como botones, títulos y avisos.

## Casos de uso

`ctx.t()` puede utilizarse en todos los entornos de ejecución de RunJS.

## Definición de tipo

```ts
t(key: string, options?: Record<string, any>): string
```

## Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `key` | `string` | Clave de traducción o plantilla con marcadores de posición (ej. `Hello {{name}}`, `{{count}} rows`). |
| `options` | `object` | Opcional. Variables de interpolación (ej. `{ name: 'Juan', count: 5 }`), u opciones de i18n (ej. `defaultValue`, `ns`). |

## Valor de retorno

- Devuelve la cadena traducida. Si no existe una traducción para la clave y no se proporciona un `defaultValue`, puede devolver la propia clave o la cadena interpolada.

## Espacio de nombres (ns)

El **espacio de nombres predeterminado para el entorno RunJS es `runjs`**. Cuando no se especifica `ns`, `ctx.t(key)` buscará la clave en el espacio de nombres `runjs`.

```ts
// Busca la clave en el espacio de nombres 'runjs' por defecto
ctx.t('Submit'); // Equivalente a ctx.t('Submit', { ns: 'runjs' })

// Busca la clave en un espacio de nombres específico
ctx.t('Submit', { ns: 'myModule' });

// Busca en múltiples espacios de nombres secuencialmente (primero 'runjs', luego 'common')
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Ejemplos

### Clave simple

```ts
ctx.t('Submit');
ctx.t('No data');
```

### Con variables de interpolación

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Textos dinámicos (ej. tiempo relativo)

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Especificar un espacio de nombres

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## Notas

- **Plugin de localización**: Para traducir textos, debe activar primero el plugin de localización. Las claves de traducción faltantes se extraerán automáticamente a la lista de gestión de localización para un mantenimiento y traducción unificados.
- Soporta interpolación al estilo i18next: utilice `{{nombreVariable}}` en la clave y pase la variable correspondiente en `options` para reemplazarla.
- El idioma se determina por el contexto actual (ej. `ctx.i18n.language`, locale del usuario).

## Relacionado

- [ctx.i18n](./i18n.md): Leer o cambiar idiomas