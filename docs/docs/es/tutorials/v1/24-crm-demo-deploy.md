# Guía de despliegue de la Demo CRM

Para que pueda desplegar esta Demo en su propio entorno NocoBase de forma rápida y sin contratiempos, ofrecemos dos métodos de restauración. Elija el más adecuado según su versión y su perfil técnico.

Antes de empezar, asegúrese de:

- Tener un entorno básico de NocoBase en funcionamiento. Para la instalación del sistema principal, consulte la [documentación oficial de instalación](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- Haber descargado los archivos correspondientes de nuestra Demo CRM (versión en chino):
  - **Archivo de copia de seguridad** (aprox. 21,2 MB): [nocobase_crm_demo_cn.nbdata](https://static-docs.nocobase.com/nocobase_crm_demo_cn.nbdata) — para el método 1.
  - **Archivo SQL** (aprox. 9 MB comprimido): [nocobase_crm_demo_cn.zip](https://static-docs.nocobase.com/nocobase_crm_demo_cn.zip) — para el método 2.

**Nota importante**: la Demo se ha creado con una base de datos **PostgreSQL**, asegúrese de que su entorno utiliza PostgreSQL.

---

### Método 1: restaurar con el gestor de copias de seguridad (recomendado para usuarios Pro/Enterprise)

Este método utiliza el plugin "[Gestor de copias de seguridad](https://docs-cn.nocobase.com/handbook/backups)" integrado en NocoBase (versiones Pro/Enterprise) para restaurar con un clic; es la operación más sencilla, pero tiene ciertos requisitos sobre el entorno y la versión.

#### Características principales

* **Ventajas**:
  1. **Operación cómoda**: se realiza desde la interfaz UI y permite restaurar todas las configuraciones, incluidos los plugins.
  2. **Restauración completa**: **permite restaurar todos los archivos del sistema**, incluidas plantillas de impresión, archivos subidos en campos de archivo, etc., garantizando la integridad funcional de la Demo.
* **Limitaciones**:
  1. **Solo para Pro/Enterprise**: el "Gestor de copias de seguridad" es un plugin empresarial, solo disponible para usuarios Pro/Enterprise.
  2. **Requisitos estrictos del entorno**: requiere que su entorno de base de datos (versión, sensibilidad a mayúsculas/minúsculas, etc.) sea altamente compatible con el entorno en el que se creó la copia de seguridad.
  3. **Dependencia de plugins**: si la Demo incluye plugins comerciales que su entorno no tiene, la restauración fallará.

#### Pasos

**Paso 1: [muy recomendado] iniciar la aplicación con la imagen `full`**

Para evitar fallos de restauración por la falta del cliente de base de datos, le recomendamos encarecidamente usar la versión `full` de la imagen Docker, que incluye todos los programas necesarios sin configuración adicional. (Atención: nuestra imagen se creó a partir de la 1.9.0-alpha.1, tenga en cuenta la compatibilidad de versiones.)

Ejemplo de comando para descargar la imagen:

```bash
docker pull nocobase/nocobase:1.9.0-alpha.3-full
```

A continuación, inicie su servicio NocoBase con esta imagen.

> **Nota**: si no usa la imagen `full`, posiblemente tenga que instalar manualmente el cliente `pg_dump` dentro del contenedor, lo que es complejo y poco fiable.

**Paso 2: activar el plugin "Gestor de copias de seguridad"**

1. Inicie sesión en su sistema NocoBase.
2. Vaya a **`Gestión de plugins`**.
3. Busque y active el plugin **`Gestor de copias de seguridad`**.

![20250711014113](https://static-docs.nocobase.com/20250711014113.png)

**Paso 3: restaurar desde un archivo de copia de seguridad local**

1. Tras activar el plugin, actualice la página.
2. Vaya al menú lateral **`Administración del sistema`** -\> **`Gestor de copias de seguridad`**.
3. Haga clic en el botón **`Restaurar desde copia local`** en la esquina superior derecha.
   ![20250711014216](https://static-docs.nocobase.com/20250711014216.png)
4. Arrastre el archivo de copia de seguridad de la Demo (normalmente con extensión `.zip`) al área de carga.
5. Haga clic en **`Enviar`** y espere pacientemente a que el sistema termine la restauración. Este proceso puede llevar entre decenas de segundos y varios minutos.
   ![20250711014250](https://static-docs.nocobase.com/20250711014250.png)

#### Atención

* **Compatibilidad de la base de datos**: este es el punto más importante de este método. La **versión, el conjunto de caracteres y la sensibilidad a mayúsculas/minúsculas** de su PostgreSQL deben coincidir con los del archivo de copia de seguridad de la Demo. En particular, el nombre del `schema` debe ser el mismo.
* **Coincidencia de plugins comerciales**: asegúrese de que dispone y tiene activados todos los plugins comerciales que requiere la Demo; de lo contrario, la restauración se interrumpirá.

---

### Método 2: importar directamente el archivo SQL (universal, más adecuado para la versión Community)

Este método restaura los datos operando directamente sobre la base de datos, sin pasar por el plugin "Gestor de copias de seguridad", por lo que no tiene las limitaciones de los plugins Pro/Enterprise.

#### Características principales

* **Ventajas**:
  1. **Sin restricción de versión**: válido para todos los usuarios de NocoBase, incluida la versión Community.
  2. **Alta compatibilidad**: no depende de la herramienta `dump` de la aplicación; basta con poder conectarse a la base de datos.
  3. **Alta tolerancia a errores**: si la Demo contiene plugins comerciales que usted no tiene (como los gráficos ECharts), las funciones correspondientes simplemente no se activarán, pero no afectará al resto y la aplicación arrancará correctamente.
* **Limitaciones**:
  1. **Requiere capacidad de operar la base de datos**: el usuario debe tener conocimientos básicos de operación de bases de datos, por ejemplo cómo ejecutar un archivo `.sql`.
  2. **Atención: se pierden los archivos del sistema**: **este método pierde todos los archivos del sistema**, como las plantillas de impresión y los archivos subidos en campos de archivo. Esto significa que:
     - Las funciones de plantillas de impresión podrían no funcionar correctamente.
     - Las imágenes, documentos y otros archivos ya subidos se perderán.
     - Las funcionalidades que utilicen campos de archivo se verán afectadas.

#### Pasos

**Paso 1: preparar una base de datos limpia**

Prepare una base de datos nueva y vacía para los datos que vamos a importar de la Demo.

**Paso 2: importar el archivo `.sql` en la base de datos**

Tome el archivo de base de datos que le proporcionamos (normalmente con extensión `.sql`) e importe su contenido en la base de datos preparada en el paso anterior. Hay varias formas de hacerlo según su entorno:

* **Opción A: línea de comandos en el servidor (ejemplo con Docker)**
  Si ha instalado NocoBase y la base de datos con Docker, puede subir el archivo `.sql` al servidor y luego usar `docker exec` para ejecutar la importación. Suponiendo que su contenedor PostgreSQL se llama `my-nocobase-db` y que el archivo es `crm_demo.sql`:

  ```bash
  # Copiar el archivo sql al contenedor
  docker cp crm_demo.sql my-nocobase-db:/tmp/
  # Entrar en el contenedor y ejecutar el comando de importación
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/crm_demo.sql
  ```
* **Opción B: cliente de base de datos remoto**
  Si la base de datos expone un puerto, puede usar cualquier cliente gráfico (DBeaver, Navicat, pgAdmin, etc.), conectarse a la base de datos, abrir una nueva ventana de consulta, pegar el contenido completo del archivo `.sql` y ejecutarlo.

**Paso 3: conectar la base de datos y arrancar la aplicación**

Configure los parámetros de arranque de NocoBase (variables de entorno como `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) para que apunten a la base de datos en la que acaba de importar los datos. A continuación, arranque NocoBase con normalidad.

![img_v3_02o3_eb637bd2-88c3-400b-8421-1ac2057d1aag](https://static-docs.nocobase.com/img_v3_02o3_eb637bd2-88c3-400b-8421-1ac2057d1aag.png)

#### Atención

* **Permisos de la base de datos**: este método requiere disponer de una cuenta y contraseña que permitan operar directamente sobre la base de datos.
* **Estado de los plugins**: tras una importación exitosa, aunque los datos de los plugins comerciales existan, si su entorno local no tiene instalados y activados dichos plugins, las funciones correspondientes (como gráficos ECharts, campos específicos, etc.) no se mostrarán ni podrán usarse, pero esto no provocará la caída de la aplicación.

---

### Resumen y comparación


| Característica           | Método 1: Gestor de copias de seguridad                                  | Método 2: Importación directa de SQL                                                                                                                              |
| :----------------------- | :----------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Usuarios destinatarios** | Usuarios **Pro/Enterprise**                                              | **Todos los usuarios** (incluida la versión Community)                                                                                                             |
| **Facilidad operativa**  | ⭐⭐⭐⭐⭐ (muy sencillo, operación UI)                                  | ⭐⭐⭐ (requiere conocimientos básicos de base de datos)                                                                                                            |
| **Requisitos del entorno** | **Estrictos**: la base de datos y la versión del sistema deben ser muy compatibles | **Intermedios**: solo se requiere compatibilidad con la base de datos                                                                                              |
| **Dependencia de plugins** | **Fuerte dependencia**: la restauración valida los plugins; si falta alguno, la restauración **falla**. | **Las funciones dependen mucho de los plugins**. Los datos pueden importarse independientemente y el sistema mantiene las funciones básicas. Pero si faltan los plugins, las funciones correspondientes **no podrán usarse**. |
| **Archivos del sistema** | **✅ Se conservan en su totalidad** (plantillas de impresión, archivos subidos, etc.) | **❌ Se pierden** (plantillas de impresión, archivos subidos, etc.)                                                                                                |
| **Escenario recomendado** | Usuarios empresariales con un entorno controlado y coherente que necesitan una demostración funcional completa | Falta de algunos plugins, búsqueda de alta compatibilidad y flexibilidad, usuarios que no son Pro/Enterprise y aceptan la pérdida de archivos                       |

Esperamos que este tutorial le ayude a desplegar la Demo CRM con éxito. Si encuentra algún problema durante el proceso, ¡no dude en contactarnos!
