:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Logger

El sistema de registro de NocoBase se basa en <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. Por defecto, NocoBase clasifica los registros en: registros de solicitudes de API, registros de ejecución del sistema y registros de ejecución de SQL. Los registros de solicitudes de API y los registros de ejecución de SQL se imprimen internamente por la aplicación. Los desarrolladores de plugins, por lo general, solo necesitan imprimir los registros de ejecución del sistema relacionados con sus plugins.

Este documento describe cómo crear e imprimir registros al desarrollar un plugin.

## Métodos de Registro Predeterminados

NocoBase le ofrece métodos para imprimir los registros de ejecución del sistema. Estos registros se imprimen siguiendo campos definidos y se envían a archivos específicos.

```ts
// Método de registro predeterminado
app.log.info("message");

// Uso en un middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Uso en plugins
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Todos estos métodos se utilizan de la siguiente manera:

El primer parámetro es el mensaje del registro, y el segundo es un objeto de metadatos opcional que puede contener cualquier par clave-valor. Los campos `module`, `submodule` y `method` se extraerán como campos individuales, mientras que los campos restantes se agruparán en el campo `meta`.

```ts
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## Salida a Otros Archivos

Si desea seguir utilizando los métodos de registro predeterminados del sistema, pero no quiere que se guarden en el archivo predeterminado, puede crear una instancia de logger de sistema personalizada usando `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Indica si los registros de nivel 'error' deben guardarse por separado en 'xxx_error.log'
});
```

## Logger Personalizado

Si prefiere no usar los métodos de registro que ofrece el sistema y desea utilizar los métodos nativos de Winston, puede crear registros de las siguientes maneras.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

Las `options` (opciones) extienden las `winston.LoggerOptions` originales.

- `transports` - Puede usar `'console' | 'file' | 'dailyRotateFile'` para aplicar los métodos de salida preestablecidos.
- `format` - Puede usar `'logfmt' | 'json' | 'delimiter'` para aplicar los formatos de impresión preestablecidos.

### `app.createLogger`

En escenarios con múltiples aplicaciones, a veces queremos personalizar los directorios y archivos de salida para que se guarden en un directorio con el nombre de la aplicación actual.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Se guardará en /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

El caso de uso y la forma de emplearlo son los mismos que para `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Se guardará en /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```