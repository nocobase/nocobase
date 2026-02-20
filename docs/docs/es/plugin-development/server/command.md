:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Comando

En NocoBase, los comandos se utilizan para ejecutar operaciones relacionadas con aplicaciones o **plugins** desde la línea de comandos. Esto incluye tareas como ejecutar tareas del sistema, realizar operaciones de migración o sincronización, inicializar la configuración, o interactuar con instancias de la aplicación en ejecución. Los desarrolladores pueden definir comandos personalizados para los **plugins** y registrarlos a través del objeto `app`, ejecutándolos en la CLI como `nocobase <command>`.

## Tipos de comandos

En NocoBase, la forma de registrar comandos se divide en dos tipos:

| Tipo | Método de registro | ¿Requiere **plugin** habilitado? | Escenarios típicos |
|------|--------------------|----------------------------------|--------------------|
| Comando dinámico | `app.command()` | ✅ Sí | Comandos relacionados con la lógica de negocio del **plugin** |
| Comando estático | `Application.registerStaticCommand()` | ❌ No | Comandos de instalación, inicialización, mantenimiento |

## Comandos dinámicos

Utilice `app.command()` para definir comandos de **plugin**. Estos comandos solo se pueden ejecutar después de que el **plugin** esté habilitado. Los archivos de comandos deben ubicarse en `src/server/commands/*.ts` dentro del directorio del **plugin**.

Ejemplo

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

Descripción

- `app.command('echo')`: Define un comando llamado `echo`.
- `.option('-v, --version')`: Añade una opción al comando.
- `.action()`: Define la lógica de ejecución del comando.
- `app.version.get()`: Obtiene la versión actual de la aplicación.

Ejecutar comando

```bash
nocobase echo
nocobase echo -v
```

## Comandos estáticos

Se registran utilizando `Application.registerStaticCommand()`. Los comandos estáticos se pueden ejecutar sin necesidad de habilitar el **plugin**. Son adecuados para tareas de instalación, inicialización, migración o depuración. Regístrelos en el método `staticImport()` de la clase del **plugin**.

Ejemplo

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

Ejecutar comando

```bash
nocobase echo
nocobase echo --version
```

Descripción

- `Application.registerStaticCommand()`: Registra comandos antes de que la aplicación sea instanciada.
- Los comandos estáticos se utilizan generalmente para ejecutar tareas globales que no dependen del estado de la aplicación o del **plugin**.

## API de comandos

Los objetos de comando ofrecen tres métodos auxiliares opcionales para controlar el contexto de ejecución del comando:

| Método | Propósito | Ejemplo |
|--------|-----------|---------|
| `ipc()` | Se comunica con las instancias de la aplicación en ejecución (a través de IPC) | `app.command('reload').ipc().action()` |
| `auth()` | Verifica que la configuración de la base de datos sea correcta | `app.command('seed').auth().action()` |
| `preload()` | Precarga la configuración de la aplicación (ejecuta `app.load()`) | `app.command('sync').preload().action()` |

Descripción de la configuración

- **`ipc()`**
  Por defecto, los comandos se ejecutan en una nueva instancia de la aplicación.
  Al habilitar `ipc()`, los comandos interactúan con la instancia de la aplicación que se está ejecutando actualmente a través de la comunicación entre procesos (IPC), lo que es ideal para operaciones en tiempo real (como refrescar la caché o enviar notificaciones).

- **`auth()`**
  Verifica si la configuración de la base de datos está disponible antes de ejecutar el comando.
  Si la configuración de la base de datos es incorrecta o la conexión falla, el comando no continuará. Se usa comúnmente para tareas que implican escritura o lectura de la base de datos.

- **`preload()`**
  Precarga la configuración de la aplicación antes de ejecutar el comando, lo que equivale a ejecutar `app.load()`.
  Es adecuado para comandos que dependen de la configuración o del contexto del **plugin**.

Para más métodos de la API, consulte [AppCommand](/api/server/app-command).

## Ejemplos comunes

Inicializar datos por defecto

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Initialized default admin user.');
  });
```

Recargar la caché para una instancia en ejecución (modo IPC)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

Registro estático de un comando de instalación

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```