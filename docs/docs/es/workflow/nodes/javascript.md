---
pkg: '@nocobase/plugin-workflow-javascript'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Script de JavaScript

## Introducción

El nodo de script de JavaScript le permite ejecutar un script de JavaScript personalizado en el servidor dentro de un flujo de trabajo. El script puede usar variables de pasos anteriores del flujo de trabajo como parámetros, y su valor de retorno puede ser utilizado por los nodos siguientes.

El script se ejecuta en un hilo de trabajo en el servidor de la aplicación NocoBase y es compatible con la mayoría de las características de Node.js, aunque existen algunas diferencias con el entorno de ejecución nativo. Consulte la [Lista de características](#lista-de-características) para más detalles.

## Crear nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de signo más ('+') en el flujo para añadir un nodo 'JavaScript':

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Configuración del nodo

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parámetros

Se utilizan para pasar variables del contexto del flujo de trabajo o valores estáticos al script, para que puedan ser usados por la lógica del código. `name` es el nombre del parámetro, que se convierte en el nombre de la variable una vez que se pasa al script. `value` es el valor del parámetro, que puede ser una variable o una constante.

### Contenido del script

El contenido del script puede considerarse una función. Puede escribir cualquier código JavaScript compatible con el entorno de Node.js y usar la sentencia `return` para devolver un valor como resultado de la ejecución del nodo, que podrá ser utilizado como variable por los nodos posteriores.

Después de escribir el código, puede hacer clic en el botón de prueba debajo del editor para abrir un cuadro de diálogo de ejecución de prueba, donde podrá introducir valores estáticos para los parámetros y simular la ejecución. Después de la ejecución, podrá ver el valor de retorno y el contenido de la salida (registro) en el cuadro de diálogo.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Configuración de tiempo de espera

La unidad es milisegundos. Un valor de `0` significa que no se establece un tiempo de espera.

### Continuar en caso de error

Si se marca esta opción, los nodos posteriores se seguirán ejecutando incluso si el script encuentra un error o un tiempo de espera.

:::info{title="Nota"}
Si el script falla, no tendrá un valor de retorno, y el resultado del nodo se rellenará con el mensaje de error. Si los nodos posteriores utilizan la variable de resultado del nodo de script, debe manejarse con precaución.
:::

## Lista de características

### Versión de Node.js

Es la misma que la versión de Node.js que ejecuta la aplicación principal.

### Soporte de módulos

Los módulos pueden usarse en el script con limitaciones, de forma consistente con CommonJS, utilizando la directiva `require()` para importarlos.

Soporta módulos nativos de Node.js y módulos instalados en `node_modules` (incluyendo las dependencias ya utilizadas por NocoBase). Los módulos que se van a poner a disposición del código deben declararse en la variable de entorno de la aplicación `WORKFLOW_SCRIPT_MODULES`, separando los nombres de los paquetes con comas, por ejemplo:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Nota"}
Los módulos no declarados en la variable de entorno `WORKFLOW_SCRIPT_MODULES` **no pueden** usarse en el script, incluso si son nativos de Node.js o ya están instalados en `node_modules`. Esta política puede utilizarse a nivel operativo para controlar la lista de módulos disponibles para los usuarios, evitando que los scripts tengan permisos excesivos en algunos escenarios.
:::

En un entorno sin despliegue desde el código fuente, si un módulo no está instalado en `node_modules`, puede instalar manualmente el paquete requerido en el directorio `storage`. Por ejemplo, para usar el paquete `exceljs`, puede realizar los siguientes pasos:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Luego, añada la ruta relativa (o absoluta) del paquete, basada en el CWD (directorio de trabajo actual) de la aplicación, a la variable de entorno `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Así podrá usar el paquete `exceljs` en su script:

```js
const ExcelJS = require('exceljs');
// ...
```

### Variables globales

**No soporta** variables globales como `global`, `process`, `__dirname` y `__filename`.

```js
console.log(global); // will throw error: "global is not defined"
```

### Parámetros de entrada

Los parámetros configurados en el nodo se convierten en variables globales dentro del script y pueden usarse directamente. Los parámetros pasados al script solo soportan tipos básicos, como `boolean`, `number`, `string`, `object` y arrays. Un objeto `Date` se convertirá en una cadena de formato ISO al pasarse. Otros tipos complejos, como instancias de clases personalizadas, no pueden pasarse directamente.

### Valor de retorno

La sentencia `return` puede usarse para devolver tipos de datos básicos (siguiendo las mismas reglas que los parámetros) al nodo como su resultado. Si la sentencia `return` no se llama en el código, la ejecución del nodo no tendrá un valor de retorno.

```js
return 123;
```

### Salida (Registro)

**Soporta** el uso de `console` para mostrar registros.

```js
console.log('hello world!');
```

Cuando se ejecuta el flujo de trabajo, la salida del nodo de script también se registra en el archivo de registro del flujo de trabajo correspondiente.

### Asíncrono

**Soporta** el uso de `async` para definir funciones asíncronas y `await` para llamarlas. **Soporta** el uso del objeto global `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Temporizadores

Para usar métodos como `setTimeout`, `setInterval` o `setImmediate`, debe importarlos desde el paquete `timers` de Node.js.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```