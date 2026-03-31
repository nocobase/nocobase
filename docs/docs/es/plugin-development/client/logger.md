:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Logger

NocoBase le ofrece un sistema de registro (logger) de alto rendimiento basado en [pino](https://github.com/pinojs/pino). En cualquier lugar donde tenga acceso al `context`, puede obtener una instancia del logger a través de `ctx.logger` para registrar los eventos clave durante la ejecución de sus **plugins** o del sistema.

## Uso Básico

```ts
// Registra errores fatales (ej.: fallo de inicialización)
ctx.logger.fatal('Aplicación inicializada con errores', { error });

// Registra errores generales (ej.: errores en solicitudes API)
ctx.logger.error('Fallo al cargar los datos', { status, message });

// Registra advertencias (ej.: riesgos de rendimiento o acciones inesperadas del usuario)
ctx.logger.warn('El formulario actual contiene cambios sin guardar');

// Registra información general de ejecución (ej.: componente cargado)
ctx.logger.info('Componente de perfil de usuario cargado');

// Registra información de depuración (ej.: cambios de estado)
ctx.logger.debug('Estado actual del usuario', { user });

// Registra información de rastreo detallada (ej.: flujo de renderizado)
ctx.logger.trace('Componente renderizado', { component: 'UserProfile' });
```

Estos métodos corresponden a diferentes niveles de registro (de mayor a menor prioridad):

| Nivel | Método | Descripción |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Errores fatales, que suelen provocar la salida del programa. |
| `error` | `ctx.logger.error()` | Errores, indicando fallos en solicitudes u operaciones. |
| `warn` | `ctx.logger.warn()` | Advertencias, alertando sobre riesgos potenciales o situaciones inesperadas. |
| `info` | `ctx.logger.info()` | Información de ejecución regular. |
| `debug` | `ctx.logger.debug()` | Información de depuración, útil para entornos de desarrollo. |
| `trace` | `ctx.logger.trace()` | Información de rastreo detallada, generalmente para diagnósticos profundos. |

## Formato del Registro

Cada salida de registro tiene un formato JSON estructurado y, por defecto, contiene los siguientes campos:

| Campo | Tipo | Descripción |
|------|------|------|
| `level` | number | Nivel del registro |
| `time` | number | Marca de tiempo (milisegundos) |
| `pid` | number | ID del proceso |
| `hostname` | string | Nombre del host |
| `msg` | string | Mensaje del registro |
| Otros | object | Información de contexto personalizada |

Salida de ejemplo:

```json
{
  "level": 30,
  "time": 1730540153064,
  "pid": 12765,
  "hostname": "nocobase.local",
  "msg": "HelloModel rendered",
  "a": "a"
}
```

## Vinculación de Contexto

`ctx.logger` inyecta automáticamente información de contexto, como el **plugin** actual, el módulo o la fuente de la solicitud, lo que permite rastrear el origen de los registros con mayor precisión.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

Salida de ejemplo (con contexto):

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Logger Personalizado

Puede crear instancias de logger personalizadas en sus **plugins**, heredando o extendiendo las configuraciones predeterminadas:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

Los loggers hijos heredan la configuración del logger principal y adjuntan automáticamente el contexto.

## Jerarquía de Niveles de Registro

Los niveles de registro de Pino siguen una definición numérica de mayor a menor, donde los números más pequeños indican una prioridad más baja.  
A continuación, se presenta la tabla completa de la jerarquía de niveles de registro:

| Nombre del Nivel | Valor | Nombre del Método | Descripción |
|-----------|--------|----------|------|
| `fatal` | 60 | `logger.fatal()` | Errores fatales, que suelen impedir que el programa continúe ejecutándose. |
| `error` | 50 | `logger.error()` | Errores generales, indicando fallos en solicitudes o excepciones en operaciones. |
| `warn` | 40 | `logger.warn()` | Advertencias, alertando sobre riesgos potenciales o situaciones inesperadas. |
| `info` | 30 | `logger.info()` | Información común, registrando el estado del sistema u operaciones normales. |
| `debug` | 20 | `logger.debug()` | Información de depuración, utilizada en la fase de desarrollo para analizar problemas. |
| `trace` | 10 | `logger.trace()` | Información de rastreo detallada, utilizada para diagnósticos en profundidad. |
| `silent` | -Infinity | (sin método correspondiente) | Desactiva toda la salida de registros. |

Pino solo emitirá registros que sean mayores o iguales al `level` configurado actualmente. Por ejemplo, si el nivel de registro es `info`, los registros de `debug` y `trace` serán ignorados.

## Mejores Prácticas en el Desarrollo de **Plugins**

1.  **Utilice el Logger de Contexto**  
    Utilice `ctx.logger` en el contexto de sus **plugins**, modelos o aplicaciones para que la información de origen se adjunte automáticamente.

2.  **Distinga los Niveles de Registro**  
    -   Utilice `error` para registrar excepciones de negocio.  
    -   Utilice `info` para registrar cambios de estado.  
    -   Utilice `debug` para registrar información de depuración durante el desarrollo.

3.  **Evite el Registro Excesivo**  
    Especialmente en los niveles `debug` y `trace`, se recomienda activarlos únicamente en entornos de desarrollo.

4.  **Utilice Datos Estructurados**  
    Pase parámetros de objeto en lugar de concatenar cadenas de texto; esto facilita el análisis y filtrado de los registros.

Siguiendo estas prácticas, los desarrolladores pueden rastrear la ejecución de los **plugins** de manera más eficiente, solucionar problemas y mantener un sistema de registro estructurado y extensible.