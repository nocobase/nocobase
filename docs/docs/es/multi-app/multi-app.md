---
pkg: "@nocobase/plugin-multi-app-manager"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Multi-aplicación


## Introducción

El **plugin Multi-aplicación** le permite crear y gestionar dinámicamente múltiples aplicaciones independientes sin necesidad de despliegues separados. Cada subaplicación es una instancia completamente independiente con su propia base de datos, plugins y configuración.

#### Casos de uso
- **Multitenencia**: Proporcionar instancias de aplicación independientes, donde cada cliente tiene sus propios datos, configuraciones de plugins y sistema de permisos.
- **Sistemas principales y subsistemas para diferentes dominios de negocio**: Un sistema grande compuesto por múltiples aplicaciones más pequeñas desplegadas de forma independiente.


:::warning
El plugin Multi-aplicación por sí mismo no proporciona capacidades para compartir usuarios.
Si necesita compartir usuarios entre múltiples aplicaciones, puede usarlo en conjunto con el **[plugin de Autenticación](/auth-verification)**.
:::


## Instalación

En el gestor de plugins, encuentre el plugin **Multi-aplicación** y actívelo.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)


## Guía de uso


### Creación de una subaplicación

En el menú de configuración del sistema, haga clic en «Multi-aplicación» para acceder a la página de gestión de multi-aplicaciones:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Haga clic en el botón «Añadir nuevo» para crear una nueva subaplicación:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Descripción de los campos del formulario

*   **Nombre**: Identificador de la subaplicación, globalmente único.
*   **Nombre de visualización**: El nombre de la subaplicación que se muestra en la interfaz.
*   **Modo de inicio**:
    *   **Iniciar en la primera visita**: La subaplicación se inicia solo cuando un usuario la accede por primera vez a través de una URL.
    *   **Iniciar con la aplicación principal**: La subaplicación se inicia al mismo tiempo que la aplicación principal (esto aumentará el tiempo de inicio de la aplicación principal).
*   **Puerto**: El número de puerto utilizado por la subaplicación en tiempo de ejecución.
*   **Dominio personalizado**: Configure un subdominio independiente para la subaplicación.
*   **Fijar al menú**: Fije la entrada de la subaplicación en el lado izquierdo de la barra de navegación superior.
*   **Conexión a la base de datos**: Se utiliza para configurar la fuente de datos de la subaplicación, compatible con los siguientes tres métodos:
    *   **Nueva base de datos**: Reutilice el servicio de datos actual para crear una base de datos independiente.
    *   **Nueva conexión de datos**: Configure un servicio de base de datos completamente nuevo.
    *   **Modo Schema**: Cree un Schema independiente para la subaplicación en PostgreSQL.
*   **Actualización**: Si la base de datos conectada contiene una versión anterior de la estructura de datos de NocoBase, se actualizará automáticamente a la versión actual.


### Iniciar y detener una subaplicación

Haga clic en el botón **Iniciar** para iniciar la subaplicación;
> Si se marcó *"Iniciar en la primera visita"* durante la creación, se iniciará automáticamente en la primera visita.

Haga clic en el botón **Ver** para abrir la subaplicación en una nueva pestaña.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)


### Estado y registros de la subaplicación

En la lista, puede ver el uso de memoria y CPU de cada aplicación.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Haga clic en el botón **Registros** para ver los registros de ejecución de la subaplicación.
> Si la subaplicación es inaccesible después de iniciarse (por ejemplo, debido a una base de datos dañada), puede usar los registros para solucionar problemas.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)


### Eliminar una subaplicación

Haga clic en el botón **Eliminar** para remover la subaplicación.
> Al eliminar, puede elegir si también desea eliminar la base de datos. Proceda con precaución, ya que esta acción es irreversible.


### Acceder a una subaplicación
Por defecto, se accede a las subaplicaciones usando `/_app/:appName/admin/`, por ejemplo:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
También puede configurar un subdominio independiente para la subaplicación. Necesitará resolver el dominio a la IP actual, y si está usando Nginx, también deberá añadir el dominio a la configuración de Nginx.


### Gestionar subaplicaciones mediante línea de comandos

En el directorio raíz del proyecto, puede usar la línea de comandos para gestionar las instancias de las subaplicaciones a través de **PM2**:

```bash
yarn nocobase pm2 list              # Ver la lista de instancias en ejecución actualmente
yarn nocobase pm2 stop [appname]    # Detener un proceso de subaplicación específico
yarn nocobase pm2 delete [appname]  # Eliminar un proceso de subaplicación específico
yarn nocobase pm2 kill              # Terminar forzosamente todos los procesos iniciados (puede incluir la instancia de la aplicación principal)
```

### Migrar datos de la antigua Multi-aplicación

Vaya a la antigua página de gestión de multi-aplicaciones y haga clic en el botón **Migrar datos a la nueva multi-aplicación** para migrar los datos.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)


## Preguntas frecuentes

#### 1. Gestión de plugins
Las subaplicaciones pueden usar los mismos plugins que la aplicación principal (incluyendo las versiones), pero pueden configurarse y usarse de forma independiente.

#### 2. Aislamiento de la base de datos
Las subaplicaciones pueden configurarse con bases de datos independientes. Si desea compartir datos entre aplicaciones, puede hacerlo a través de fuentes de datos externas.

#### 3. Copia de seguridad y migración de datos
Actualmente, las copias de seguridad de datos en la aplicación principal no incluyen los datos de las subaplicaciones (solo la información básica de las subaplicaciones). Debe realizar copias de seguridad y migrar los datos manualmente dentro de cada subaplicación.

#### 4. Despliegue y actualizaciones
La versión de una subaplicación se actualizará automáticamente junto con la aplicación principal, asegurando la coherencia de la versión entre la aplicación principal y las subaplicaciones.

#### 5. Gestión de recursos
El consumo de recursos de cada subaplicación es básicamente el mismo que el de la aplicación principal. Actualmente, una sola aplicación utiliza alrededor de 500-600 MB de memoria.