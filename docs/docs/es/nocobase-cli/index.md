# Inicio rápido

Si es la primera vez que utiliza esta CLI, no es necesario que memorice todos los comandos al principio. Utilice `nb init --ui` para instalar una aplicación primero y luego continúe mirando el resto según el escenario.

## Primero establece la mente más importante.

En NocoBase CLI, las operaciones posteriores no giran en torno a "un directorio determinado" o "un puerto determinado" de forma predeterminada, sino alrededor de **env**.

Puede pensar en env como "un conjunto de conexión de aplicaciones e información de ejecución recordada por la CLI". Siempre que se haya guardado correctamente, se pueden utilizar directamente muchos comandos posteriores:

- Utilice `nb init` para instalar una nueva aplicación y guardarla como env
- Utilice `nb env add` para conectar una aplicación existente a la CLI
- Administrar este entorno con `nb app start`, `nb app logs`, `nb app upgrade`
- Copia de seguridad y restauración de este entorno usando `nb backup`
- Utilice `nb app autostart`, `nb proxy` para continuar complementando las capacidades del entorno de producción.

Tenga esto en cuenta primero y los documentos posteriores serán mucho más fluidos.

## Ruta recomendada predeterminada

Si no está seguro de por dónde empezar, normalmente lo más fácil es seguir este camino:

1. Primero lea [Instalación usando CLI (recomendado)](./installation/cli.md) y complete `nb init` una vez.
2. Después de guardar la aplicación como env, mire [Administración de entornos múltiples] (./operations/multi-environment.md) para confirmar el env actual, cambiar env y verificar el estado.
3. Para el inicio, detención, registro y actualización diarios, continúe viendo [Administrar aplicación] (./operations/manage-app.md).
4. Antes de realizar actualizaciones, migraciones o cambios importantes, consulte [Copia de seguridad y restauración] (./operations/backup-restore.md).
5. Si está listo para conectarse oficialmente, ingrese a [Descripción general de la implementación del entorno de producción] (./production/index.md).

Los primeros tres pasos cubren la mayoría de los escenarios de uso.

## Índice rápido

| Quiero... | Dónde buscar |
| --- | --- |
| Aún no hay ninguna aplicación, primero instale una nueva NocoBase y guárdela como CLI env | [Instalar usando CLI (recomendado)](./installation/cli.md) |
| Ya tiene NocoBase en ejecución y desea acceder a la administración CLI | [Instalar usando CLI (recomendado)](./installation/cli.md) |
| Migre gradualmente los métodos de instalación antiguos a CLI | [Migrar desde métodos de instalación antiguos a CLI](./installation/migration.md) |
| Vea qué entornos se guardan localmente, cambie el entorno actual y verifique el estado | [Gestión de entornos múltiples](./operations/multi-environment.md) |
| Iniciar, detener, reiniciar la aplicación, ver registros o continuar con la actualización | [Administrar aplicación](./operations/manage-app.md) |
| Haga una copia de seguridad antes de actualizar, migrar o cambiar datos por lotes y luego restaurarla cuando sea necesario | [Copia de seguridad y restauración](./operations/backup-restore.md) |
| Primero confirme las variables de entorno clave necesarias para ejecutar la aplicación | [Variables de entorno de la aplicación](./installation/env.md) |
| Instalar complementos de terceros | [Instalación y actualización de complementos de terceros](./plugins/third-party.md) |
| Deje que la aplicación ingrese al entorno de producción: inicio automático, acceso externo estable, proxy inverso | [Descripción general de la implementación del entorno de producción](./production/index.md) |

## Cuándo mirar la referencia del comando

Este conjunto de documentos de inicio rápido es más "qué quiero hacer ahora". Si ya sabe qué comando desea ejecutar y solo desea continuar viendo los parámetros completos, simplemente vaya a [Referencia de comandos CLI de NocoBase] (../api/cli/index.md).

Las sugerencias predeterminadas son:

- Primero utilice el documento de inicio rápido para establecer un sentido del camino.
- Luego verifique los detalles de los parámetros en la página de comando específica

Esto hace que comenzar sea más fácil que leer el árbol de comandos completo de un primer vistazo.
