---
pkg: "@nocobase/plugin-multi-app-manager"
---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/multi-space/multi-app).
:::

# Multi-app

## Introducción

El plugin **Multi-app** permite la creación y gestión dinámica de múltiples aplicaciones independientes sin necesidad de despliegues por separado. Cada sub-aplicación es una instancia completamente independiente con su propia base de datos, plugins y configuraciones.

#### Casos de uso
- **Multitenencia (Multi-tenancy)**: Proporciona instancias de aplicación independientes donde cada cliente tiene sus propios datos, configuraciones de plugins y sistemas de permisos.
- **Sistemas principales y secundarios para diferentes dominios de negocio**: Un sistema grande compuesto por varias aplicaciones pequeñas desplegadas de forma independiente.

:::warning
El plugin Multi-app por sí solo no proporciona capacidades de uso compartido de usuarios.  
Para habilitar la integración de usuarios entre múltiples aplicaciones, puede utilizarse en conjunto con el **[Plugin de Autenticación](/auth-verification)**.
:::

## Instalación

Busque el plugin **Multi-app** en el gestor de plugins y actívelo.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)

## Manual de usuario

### Creación de una sub-aplicación

Haga clic en "Multi-app" en el menú de configuración del sistema para acceder a la página de gestión de multi-app:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Haga clic en el botón "Añadir nuevo" para crear una nueva sub-aplicación:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Descripción de los campos del formulario

* **Nombre**: Identificador de la sub-aplicación, único globalmente.
* **Nombre a mostrar**: El nombre de la sub-aplicación que se muestra en la interfaz.
* **Modo de inicio**:
  * **Iniciar al primer acceso**: La sub-aplicación se inicia solo cuando un usuario accede a ella a través de la URL por primera vez.
  * **Iniciar con la aplicación principal**: La sub-aplicación se inicia simultáneamente con la aplicación principal (esto aumenta el tiempo de inicio de la aplicación principal).
* **Puerto**: El número de puerto utilizado por la sub-aplicación durante la ejecución.
* **Dominio personalizado**: Configure un subdominio independiente para la sub-aplicación.
* **Anclar al menú**: Ancla el acceso a la sub-aplicación en el lado izquierdo de la barra de navegación superior.
* **Conexión a la base de datos**: Se utiliza para configurar la fuente de datos de la sub-aplicación, admitiendo tres métodos:
  * **Nueva base de datos**: Reutiliza el servicio de datos actual para crear una base de datos independiente.
  * **Nueva conexión de datos**: Configura un servicio de base de datos completamente nuevo.
  * **Modo Schema**: Crea un Schema independiente para la sub-aplicación en PostgreSQL.
* **Actualizar**: Si la base de datos conectada contiene una versión anterior de la estructura de datos de NocoBase, se actualizará automáticamente a la versión actual.

### Ejecución y detención de sub-aplicaciones

Haga clic en el botón **Iniciar** para arrancar una sub-aplicación.  
> Si se marcó *"Iniciar al primer acceso"* durante la creación, se iniciará automáticamente en la primera visita.  

Haga clic en el botón **Ver** para abrir la sub-aplicación en una nueva pestaña.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)

### Estado de ejecución y registros (logs) de la sub-aplicación

Puede ver el uso de memoria y CPU de cada aplicación en la lista.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Haga clic en el botón **Logs** para ver los registros de ejecución de la sub-aplicación.  
> Si una sub-aplicación no es accesible después de iniciar (por ejemplo, debido a una base de datos dañada), puede realizar una resolución de problemas utilizando los registros.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)

### Eliminación de una sub-aplicación

Haga clic en el botón **Eliminar** para quitar una sub-aplicación.  
> Al eliminar, puede elegir si desea eliminar también la base de datos. Por favor, proceda con precaución, ya que esta acción es irreversible.

### Acceso a las sub-aplicaciones
Por defecto, utilice `/_app/:appName/admin/` para acceder a las sub-aplicaciones, por ejemplo:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Además, puede configurar subdominios independientes para las sub-aplicaciones. Necesita resolver el dominio a la dirección IP actual. Si utiliza Nginx, el dominio también debe añadirse a la configuración de Nginx.

### Gestión de sub-aplicaciones a través de la CLI

En el directorio raíz del proyecto, puede utilizar la línea de comandos para gestionar las instancias de las sub-aplicaciones a través de **PM2**:

```bash
yarn nocobase pm2 list              # Ver la lista de instancias en ejecución actualmente
yarn nocobase pm2 stop [appname]    # Detener un proceso de sub-aplicación específico
yarn nocobase pm2 delete [appname]  # Eliminar un proceso de sub-aplicación específico
yarn nocobase pm2 kill              # Terminar forzosamente todos los procesos iniciados (puede incluir la instancia de la aplicación principal)
```

### Migración de datos de la versión anterior de Multi-app

Vaya a la página de gestión de multi-app heredada y haga clic en el botón **Migrar datos a la nueva Multi-app** para realizar la migración.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)

## Preguntas frecuentes (FAQ)

#### 1. Gestión de plugins
Las sub-aplicaciones pueden usar los mismos plugins que la aplicación principal (incluyendo las versiones), pero los plugins pueden configurarse y usarse de forma independiente.

#### 2. Aislamiento de la base de datos
Las sub-aplicaciones pueden configurarse con bases de datos independientes. Si desea compartir datos entre aplicaciones, puede lograrse a través de fuentes de datos externas.

#### 3. Respaldo y migración de datos
Actualmente, el respaldo de datos en la aplicación principal no incluye los datos de las sub-aplicaciones (solo incluye información básica de las mismas). Los respaldos y migraciones deben realizarse manualmente dentro de cada sub-aplicación.

#### 4. Despliegue y actualizaciones
Las versiones de las sub-aplicaciones seguirán automáticamente las actualizaciones de la aplicación principal, garantizando la consistencia de versiones entre la aplicación principal y las secundarias.

#### 5. Gestión de recursos
El consumo de recursos de cada sub-aplicación es básicamente el mismo que el de la aplicación principal. Actualmente, el uso de memoria de una sola aplicación es de unos 500-600 MB.