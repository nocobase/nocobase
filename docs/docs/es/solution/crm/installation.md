:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/solution/crm/installation).
:::

# Cómo instalar

> La versión actual adopta la forma de **copia de seguridad y restauración** para su despliegue. En versiones posteriores, es posible que cambiemos a la forma de **migración incremental**, para facilitar la integración de la solución en sus sistemas existentes.

Para que pueda desplegar la solución CRM 2.0 en su propio entorno NocoBase de forma rápida y fluida, ofrecemos dos métodos de restauración. Elija el que mejor se adapte a su versión de usuario y formación técnica.

Antes de comenzar, asegúrese de que:

- Ya tiene un entorno de ejecución básico de NocoBase. Para la instalación del sistema principal, consulte la [documentación oficial de instalación](https://docs-cn.nocobase.com/welcome/getting-started/installation) más detallada.
- Versión de NocoBase **v2.1.0-beta.2 o superior**
- Ya ha descargado los archivos correspondientes del sistema CRM:
  - **Archivo de copia de seguridad**: [nocobase_crm_v2_backup_260327.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260327.nbdata) - Aplicable al Método uno
  - **Archivo SQL**: [nocobase_crm_v2_sql_260327.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260327.zip) - Aplicable al Método dos

**Nota importante**:
- Esta solución se basa en la base de datos **PostgreSQL 16**, asegúrese de que su entorno utilice PostgreSQL 16.
- **DB_UNDERSCORED no puede ser true**: Compruebe su archivo `docker-compose.yml` y asegúrese de que la variable de entorno `DB_UNDERSCORED` no esté establecida en `true`; de lo contrario, entrará en conflicto con la copia de seguridad de la solución y provocará un fallo en la restauración.

---

## Método uno: Restaurar usando el Administrador de copias de seguridad (Recomendado para usuarios de la versión Pro/Enterprise)

Este método realiza una restauración con un solo clic a través del plugin "[Administrador de copias de seguridad](https://docs-cn.nocobase.com/handbook/backups)" (versión Pro/Enterprise) integrado en NocoBase, siendo la operación más sencilla. Sin embargo, tiene ciertos requisitos en cuanto al entorno y la versión del usuario.

### Características principales

* **Ventajas**:
  1. **Operación conveniente**: Se puede completar en la interfaz de usuario, permitiendo restaurar completamente todas las configuraciones, incluidos los plugins.
  2. **Restauración completa**: **Capaz de restaurar todos los archivos del sistema**, incluidos los archivos de plantillas de impresión, archivos cargados en campos de archivos de las tablas, etc., asegurando la integridad funcional.
* **Limitaciones**:
  1. **Limitado a la versión Pro/Enterprise**: El "Administrador de copias de seguridad" es un plugin de nivel empresarial, disponible solo para usuarios de la versión Pro/Enterprise.
  2. **Requisitos de entorno estrictos**: Requiere que su entorno de base de datos (versión, configuración de sensibilidad a mayúsculas y minúsculas, etc.) sea altamente compatible con el entorno donde se creó la copia de seguridad.
  3. **Dependencia de plugins**: Si la solución incluye plugins comerciales que no tiene en su entorno local, la restauración fallará.

### Pasos a seguir

**Paso 1: 【Altamente recomendado】 Iniciar la aplicación usando la imagen `full`**

Para evitar fallos en la restauración debido a la falta de un cliente de base de datos, le recomendamos encarecidamente utilizar la versión `full` de la imagen de Docker. Esta incluye todos los programas de soporte necesarios, por lo que no requiere configuración adicional.

Ejemplo de comando para descargar la imagen:

```bash
docker pull nocobase/nocobase:beta-full
```

Luego, use esta imagen para iniciar su servicio NocoBase.

> **Nota**: Si no utiliza la imagen `full`, es posible que deba instalar manualmente el cliente de base de datos `pg_dump` dentro del contenedor, lo cual es un proceso tedioso e inestable.

**Paso 2: Activar el plugin "Administrador de copias de seguridad"**

1. Inicie sesión en su sistema NocoBase.
2. Entre en **`Gestión de plugins`**.
3. Busque y active el plugin **`Administrador de copias de seguridad`**.

**Paso 3: Restaurar desde un archivo de copia de seguridad local**

1. Tras activar el plugin, actualice la página.
2. Entre en el menú de la izquierda **`Administración del sistema`** -> **`Administrador de copias de seguridad`**.
3. Haga clic en el botón **`Restaurar desde copia de seguridad local`** en la esquina superior derecha.
4. Arrastre el archivo de copia de seguridad descargado al área de carga.
5. Haga clic en **`Enviar`** y espere pacientemente a que el sistema complete la restauración; este proceso puede tardar desde unas decenas de segundos hasta varios minutos.

### Notas

* **Compatibilidad de la base de datos**: Este es el punto más crítico de este método. La **versión, el juego de caracteres y la configuración de sensibilidad a mayúsculas y minúsculas** de su base de datos PostgreSQL deben coincidir con el archivo fuente de la copia de seguridad. Especialmente el nombre del `schema` debe ser consistente.
* **Coincidencia de plugins comerciales**: Asegúrese de tener y haber activado todos los plugins comerciales requeridos por la solución; de lo contrario, la restauración se interrumpirá.

---

## Método dos: Importar directamente el archivo SQL (Universal, más adecuado para la versión Community)

Este método restaura los datos operando directamente en la base de datos, omitiendo el plugin "Administrador de copias de seguridad", por lo que no tiene las restricciones de la versión Pro/Enterprise.

### Características principales

* **Ventajas**:
  1. **Sin restricciones de versión**: Aplicable a todos los usuarios de NocoBase, incluida la versión Community.
  2. **Alta compatibilidad**: No depende de la herramienta `dump` dentro de la aplicación; siempre que pueda conectarse a la base de datos, podrá operar.
  3. **Alta tolerancia a fallos**: Si la solución incluye plugins comerciales que no posee, las funciones relacionadas no se activarán, pero no afectará el uso normal de otras funciones y la aplicación podrá iniciarse con éxito.
* **Limitaciones**:
  1. **Requiere capacidad de operación de bases de datos**: El usuario debe tener conocimientos básicos de operación de bases de datos, como por ejemplo, cómo ejecutar un archivo `.sql`.
  2. **Pérdida de archivos del sistema**: **Este método perderá todos los archivos del sistema**, incluidos los archivos de plantillas de impresión, archivos cargados en campos de archivos de las tablas, etc.

### Pasos a seguir

**Paso 1: Preparar una base de datos limpia**

Prepare una base de datos completamente nueva y vacía para los datos que va a importar.

**Paso 2: Importar el archivo `.sql` a la base de datos**

Obtenga el archivo de base de datos descargado (normalmente en formato `.sql`) e importe su contenido en la base de datos que preparó en el paso anterior. Hay varias formas de ejecutarlo, dependiendo de su entorno:

* **Opción A: A través de la línea de comandos del servidor (ejemplo con Docker)**
  Si utiliza Docker para instalar NocoBase y la base de datos, puede subir el archivo `.sql` al servidor y luego usar el comando `docker exec` para realizar la importación. Suponiendo que su contenedor de PostgreSQL se llama `my-nocobase-db` y el nombre del archivo es `nocobase_crm_v2_sql_260327.sql`:

  ```bash
  # Copiar el archivo sql al interior del contenedor
  docker cp nocobase_crm_v2_sql_260327.sql my-nocobase-db:/tmp/
  # Entrar al contenedor y ejecutar la instrucción de importación
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_crm_v2_sql_260327.sql
  ```
* **Opción B: A través de un cliente de base de datos remoto (Navicat, etc.)**
  Si su base de datos tiene el puerto expuesto, puede usar cualquier cliente gráfico de base de datos (como Navicat, DBeaver, pgAdmin, etc.) para conectarse a la base de datos y luego:
  1. Haga clic derecho en la base de datos de destino.
  2. Seleccione "Ejecutar archivo SQL" o "Ejecutar script SQL".
  3. Seleccione el archivo `.sql` descargado y ejecútelo.

**Paso 3: Conectar la base de datos e iniciar la aplicación**

Configure los parámetros de inicio de su NocoBase (como las variables de entorno `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) para que apunten a la base de datos donde acaba de importar los datos. Luego, inicie el servicio NocoBase normalmente.

### Notas

* **Permisos de la base de datos**: Este método requiere que posea una cuenta y contraseña que puedan operar directamente la base de datos.
* **Estado de los plugins**: Tras una importación exitosa, aunque los datos de los plugins comerciales incluidos en el sistema existan, si no tiene instalados y activados los plugins correspondientes localmente, las funciones relacionadas no se mostrarán ni podrán usarse, pero esto no provocará que la aplicación falle.

---

## Resumen y comparación

| Característica | Método uno: Administrador de copias de seguridad | Método dos: Importación directa de SQL |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Usuarios aplicables** | Usuarios de la versión **Pro/Enterprise** | **Todos los usuarios** (incluida la versión Community) |
| **Facilidad de operación** | ⭐⭐⭐⭐⭐ (Muy sencillo, operación en UI) | ⭐⭐⭐ (Requiere conocimientos básicos de bases de datos) |
| **Requisitos de entorno** | **Estrictos**, la base de datos y la versión del sistema deben ser altamente compatibles | **Generales**, requiere compatibilidad de base de datos |
| **Dependencia de plugins** | **Dependencia fuerte**, se verifican los plugins al restaurar; la falta de cualquier plugin provocará el **fallo de la restauración**. | **Las funciones dependen fuertemente de los plugins**. Los datos se pueden importar de forma independiente y el sistema tendrá funciones básicas. Pero si faltan los plugins correspondientes, las funciones relacionadas serán **completamente inutilizables**. |
| **Archivos del sistema** | **Se conservan íntegramente** (plantillas de impresión, archivos cargados, etc.) | **Se perderán** (plantillas de impresión, archivos cargados, etc.) |
| **Escenario recomendado** | Usuarios empresariales, con entorno controlado y consistente, que necesitan la funcionalidad completa | Falta de algunos plugins, búsqueda de alta compatibilidad y flexibilidad, usuarios que no son Pro/Enterprise, pueden aceptar la falta de funciones de archivos |

Esperamos que este tutorial le ayude a desplegar con éxito el sistema CRM 2.0. Si encuentra algún problema durante el proceso, ¡no dude en ponerse en contacto con nosotros en cualquier momento!