# nb intención de diseño de la aplicación

Los comandos relacionados con `nb app` son esencialmente adaptaciones basadas en diferentes métodos de gestión de procesos y luego unificadas en un conjunto de entradas de gestión de aplicaciones estables. El propósito de esto es intentar hacer converger el uso mental durante la operación y el mantenimiento diarios en un conjunto de comandos.

Actualmente, los métodos de gestión de procesos de aplicaciones admitidos por CLI incluyen principalmente:

- acoplador
-PM2

Si necesitamos admitir más métodos en el futuro, como Supervisor, continuaremos haciendo adaptaciones en esta capa. La entrada de mando de alta frecuencia expuesta al mundo exterior sigue siendo la misma:

```bash
nb app start
nb app restart
nb app logs
nb app upgrade
nb app stop
```

## ¿Por qué deberíamos unificarlo en `nb app`?

La gestión de procesos se puede implementar de muchas maneras, pero a la mayoría de los usuarios lo que realmente les importa no es lo que se usa en la capa inferior, sino las acciones específicas de "Quiero iniciar la aplicación", "Quiero leer el registro" y "Quiero actualizar la aplicación".

Si las diferencias subyacentes quedan expuestas directamente, los usuarios primero deben determinar qué modo operativo están utilizando actualmente y luego recordar el conjunto correspondiente de métodos operativos. Después de unificarse en `nb app`, estas acciones de alta frecuencia pueden converger en un conjunto de entradas estables.

### Reducir los costos de aprendizaje

Las diferentes soluciones de gestión de procesos funcionan de diferentes maneras:

- Docker tiene el sistema de comando de Docker.
- PM2 tiene sistema de comando PM2
- Supervisor también tiene su propio método de configuración.

Si estas diferencias se exponen directamente, los usuarios necesitarán aprender múltiples métodos de uso y será más fácil pasar por alto pasos clave en escenarios de alta frecuencia, como actualizaciones, reinicios y solución de problemas de registros.

Después de la unificación como `nb app`, la mayor parte de la gestión diaria solo requiere dominar un conjunto de comandos.

### Unificar procesos de negocio

La gestión del ciclo de vida de las aplicaciones no se trata sólo de la gestión de procesos.

En procesos como el inicio, la actualización y la detención, la CLI a menudo necesita manejar lógica adicional, como por ejemplo:

- Inspección ambiental
- Procesamiento de configuración
- Migración de datos
- Actualización de versión
- Gestión de registros

Al utilizar `nb app` como entrada unificada, puede garantizar que los comportamientos de estos procesos sean consistentes. Si continúa ampliando sus capacidades en el futuro, no necesita volver a aprender una nueva entrada de operación y mantenimiento.

## ¿Por qué todavía se necesita `nb app autostart`?

Después de tener una entrada de gestión de procesos unificada, es necesario agregar otra capa de capacidad de "gestión de inicio automático" para completar todo el proceso. Por eso existe `nb app autostart`.

El uso común es:

```bash
# 为当前 env 开启自启动
nb app autostart enable

# 为指定 env 开启自启动
nb app autostart enable --env app1

# 查看自启动状态
nb app autostart list

# 启动所有已开启自启动的 env
nb app autostart run

# 启动时显示底层启动输出
nb app autostart run --verbose
```

El objetivo de este conjunto de órdenes es continuar manteniendo la unidad externamente. En otras palabras, en la mente del usuario en esta capa de `nb app`, no es necesario que le importe si la capa inferior es Docker, PM2 u otros métodos que puedan ser compatibles en el futuro. El método de operación unificada externa sigue siendo similar a:

```bash
nb app autostart enable --env app1
nb app autostart disable --env app1
```

### `run` ¿A qué se adapta esta capa?

`nb app autostart` también se divide en dos niveles de responsabilidades:

- `enable` / `disable` son responsables de gestionar si un determinado entorno permite el inicio automático
- `run` es responsable de activar todos los entornos que tengan habilitado el inicio automático durante la fase de inicio del sistema.

En otras palabras, la CLI también proporcionará una entrada `run` unificada para brindar acceso al mecanismo de inicio automático del sistema:

```bash
nb app autostart run
```

Lo que se adapta aquí son mecanismos de inicio del sistema como `systemd`, `launchd` y scripts de inicio del host, no administradores de procesos de aplicaciones como Supervisor.

## En general

- Los comandos relacionados con `nb app` son esencialmente una capa de adaptación además de diferentes métodos de gestión de procesos. Después de unificarse externamente, pueden reducir la confusión mental del usuario.
- La implementación de la gestión de procesos puede ser Docker, PM2, Supervisor, etc. Actualmente, se admiten Docker y PM2.
- Debido a que las configuraciones de inicio automático de diferentes métodos de gestión de procesos son diferentes, se necesita un conjunto unificado de capacidades `nb app autostart` para que se complete todo el proceso.

Si desea seguir viendo las operaciones diarias, puede ir directamente a [Administrar aplicación] (../operaciones/manage-app.md). Si está listo para implementar la aplicación en el entorno formal, puede continuar viendo [Implementación del entorno de producción] (../production/index.md).
