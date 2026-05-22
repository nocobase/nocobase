---
title: "Sistema de Gestión Integral - Cómo instalar"
description: "Instalación y despliegue del Sistema de Gestión Integral: restauración con el gestor de copias de seguridad (versión Pro / Enterprise) o importación de archivo SQL (versión Community). Requiere PostgreSQL 16 y DB_UNDERSCORED no puede ser true."
keywords: "Sistema de Gestión Integral instalación, All-in-One, restauración de backup, gestor de copias de seguridad, importación SQL, PostgreSQL, NocoBase"
---

# Cómo instalar

> La versión actual se despliega mediante **restauración de copia de seguridad**. Versiones futuras pueden cambiar a un formato de **migración incremental** que facilite integrar la solución en un NocoBase ya existente.

El Sistema de Gestión Integral cubre seis módulos: **CRM (Gestión de Clientes), Gestión de Ventas, Help Desk (Tickets), Gestión de Proyectos, Gestión de Activos y Recursos Humanos**. Para que el despliegue en tu propio entorno NocoBase sea rápido y sencillo, ofrecemos dos métodos de restauración; elige el más adecuado según tu versión y tu perfil técnico.

Antes de empezar, asegúrate de que:

- Tienes ya un entorno base de NocoBase en funcionamiento. Para la instalación del sistema principal, consulta la [documentación oficial de instalación](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- Versión de NocoBase **v2.1.0-alpha.34 o superior**.
- Has descargado los archivos correspondientes de la solución integral:
  - **Archivo de backup**: [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata) — para el método 1.
  - **Archivo SQL**: [nocobase_all_in_one_sql_260521.zip](https://static-docs.nocobase.com/nocobase_all_in_one_sql_260521.zip) — para el método 2.

**Notas importantes**:

- La solución se ha construido sobre **PostgreSQL 16**; asegúrate de usar PostgreSQL 16 en tu entorno.
- **DB_UNDERSCORED no puede ser true**: revisa tu `docker-compose.yml` y comprueba que la variable de entorno `DB_UNDERSCORED` no esté en `true`, de lo contrario entrará en conflicto con el backup de la solución y la restauración fallará.

---

## Método 1: Restaurar con el gestor de copias de seguridad (recomendado para usuarios Pro / Enterprise)

Este método usa el plugin "[Gestor de copias de seguridad](https://docs-cn.nocobase.com/handbook/backups)" integrado en NocoBase (versión Pro / Enterprise) para restaurar con un clic. Es la opción más sencilla, pero tiene requisitos sobre el entorno y la versión.

### Características principales

* **Ventajas**:
  1. **Operación cómoda**: se hace todo desde la UI, permite restaurar toda la configuración, plugins incluidos.
  2. **Restauración completa**: **restaura todos los archivos del sistema**, incluyendo plantillas de impresión, archivos subidos a campos de tipo archivo, avatares de empleados de AI, etc.
* **Limitaciones**:
  1. **Solo Pro / Enterprise**: el "Gestor de copias de seguridad" es un plugin empresarial, solo disponible para usuarios Pro / Enterprise.
  2. **Requisitos estrictos del entorno**: el entorno de base de datos (versión, sensibilidad a mayúsculas, etc.) tiene que ser muy compatible con el que se usó para crear el backup.
  3. **Dependencia de plugins**: si la solución incluye plugins comerciales que no tengas en local, la restauración fallará.

### Pasos

**Paso 1: [muy recomendado] arranca la aplicación con la imagen `full`**

Para evitar fallos de restauración por falta del cliente de base de datos, recomendamos firmemente usar la versión `full` de la imagen Docker. Trae integrados todos los programas necesarios y no requiere configuración adicional.

Ejemplo del comando para descargar la imagen:

```bash
docker pull nocobase/nocobase:alpha-full
```

A continuación, arranca tu servicio NocoBase con esta imagen.

> **Nota**: si no usas la imagen `full`, puede que tengas que instalar manualmente el cliente `pg_dump` dentro del contenedor, un proceso engorroso e inestable.

**Paso 2: activa el plugin "Gestor de copias de seguridad"**

1. Inicia sesión en tu sistema NocoBase.
2. Ve a **`Gestión de plugins`**.
3. Localiza y activa el plugin **`Gestor de copias de seguridad`**.

**Paso 3: restaura desde un archivo de backup local**

1. Tras activar el plugin, refresca la página.
2. En el menú de la izquierda, ve a **`Administración del sistema`** → **`Gestor de copias de seguridad`**.
3. Haz clic en el botón **`Restaurar desde backup local`** en la esquina superior derecha.
4. Arrastra el archivo descargado `nocobase_all_in_one_backup_260521.nbdata` a la zona de carga.
5. Pulsa **`Enviar`** y espera con paciencia a que el sistema complete la restauración: puede tardar desde decenas de segundos hasta varios minutos.

### Avisos

* **Compatibilidad de la base de datos**: este es el punto más crítico. La **versión, el conjunto de caracteres y la configuración de sensibilidad a mayúsculas** de tu PostgreSQL deben coincidir con las del backup original; en particular, el nombre del `schema` debe ser idéntico.
* **Coincidencia de plugins comerciales**: asegúrate de tener ya instalados y activados todos los plugins comerciales que requiere la solución; de lo contrario la restauración se interrumpirá. Los plugins comerciales que utiliza la solución integral son: Gestor de copias de seguridad, Gestión de correo, Auditoría y Empleados de AI, entre otros.

---

## Método 2: Importar el archivo SQL directamente (universal, recomendado para Community)

Este método restaura los datos operando directamente sobre la base de datos, sin pasar por el plugin "Gestor de copias de seguridad", por lo que no tiene la limitación de Pro / Enterprise.

### Características principales

* **Ventajas**:
  1. **Sin restricción de versión**: válido para todos los usuarios de NocoBase, incluida la versión Community.
  2. **Gran compatibilidad**: no depende de la herramienta `dump` de la aplicación; basta con poder conectar a la base de datos.
  3. **Alta tolerancia a fallos**: si la solución incluye plugins comerciales que no tienes, las funciones correspondientes no se activarán, pero esto no impedirá usar el resto ni que la aplicación arranque.
* **Limitaciones**:
  1. **Requiere conocimientos de base de datos**: el usuario debe tener nociones básicas, por ejemplo cómo ejecutar un archivo `.sql`.
  2. **Pérdida de archivos del sistema**: **este método pierde todos los archivos del sistema**, incluyendo plantillas de impresión, archivos subidos a campos de tipo archivo, avatares de empleados de AI, etc.

### Pasos

**Paso 1: prepara una base de datos limpia**

Prepara una base de datos nueva y vacía (PostgreSQL 16) donde se importarán los datos.

**Paso 2: importa el archivo `.sql` a la base de datos**

Descomprime `nocobase_all_in_one_sql_260521.zip` para obtener el archivo `.sql` e impórtalo en la base de datos preparada en el paso anterior. Hay varias formas de hacerlo según tu entorno:

* **Opción A: por línea de comandos del servidor (ejemplo con Docker)**

  Si usas Docker para NocoBase y la base de datos, sube el archivo `.sql` al servidor y usa `docker exec` para importarlo. Suponiendo que tu contenedor de PostgreSQL se llama `my-nocobase-db`:

  ```bash
  # Copiar el archivo SQL al contenedor
  docker cp nocobase_all_in_one_sql_260521.sql my-nocobase-db:/tmp/
  # Entrar al contenedor y ejecutar la importación
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_all_in_one_sql_260521.sql
  ```

* **Opción B: con un cliente de base de datos remoto (Navicat, etc.)**

  Si tu base de datos tiene el puerto expuesto, puedes usar cualquier cliente gráfico (Navicat, DBeaver, pgAdmin, etc.) para conectarte y:

  1. Haz clic derecho en la base de datos de destino.
  2. Selecciona "Ejecutar archivo SQL" o "Ejecutar script SQL".
  3. Selecciona el archivo `.sql` descargado y ejecútalo.

**Paso 3: conecta la base de datos y arranca la aplicación**

Configura los parámetros de arranque de NocoBase (variables de entorno como `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`) para apuntar a la base de datos donde acabas de importar los datos y arranca normalmente el servicio NocoBase.

### Avisos

* **Permisos de base de datos**: este método exige tener un usuario y contraseña con permisos para operar directamente sobre la base de datos.
* **Estado de los plugins**: aunque los datos de los plugins comerciales se importen correctamente, si no tienes instalados y activados los plugins correspondientes, sus funciones no aparecerán ni podrán usarse, pero esto no provocará un fallo de la aplicación.

---

## Resumen y comparativa

| Característica | Método 1: Gestor de copias de seguridad | Método 2: Importación directa de SQL |
| :--- | :--- | :--- |
| **Usuarios aplicables** | Usuarios **Pro / Enterprise** | **Todos los usuarios** (Community incluida) |
| **Facilidad de uso** | ⭐⭐⭐⭐⭐ (muy sencillo, todo por UI) | ⭐⭐⭐ (requiere nociones básicas de base de datos) |
| **Requisitos de entorno** | **Estrictos**, base de datos y versión deben ser muy compatibles | **Normales**, basta con compatibilidad de base de datos |
| **Dependencia de plugins** | **Fuerte**, la restauración valida los plugins y faltar cualquiera provoca **fallo de restauración** | **Funcionalmente fuerte**: los datos se importan igual y el sistema mantiene funciones básicas, pero si falta un plugin sus funciones quedan **totalmente inutilizables** |
| **Archivos del sistema** | **Conservados** (plantillas de impresión, archivos subidos, avatares, etc.) | **Se pierden** (plantillas de impresión, archivos subidos, avatares, etc.) |
| **Escenario recomendado** | Usuarios empresariales, con entornos controlados y coherentes, que necesitan todas las funciones | Sin algunos plugins, con prioridad por la compatibilidad y la flexibilidad, no Pro / Enterprise, que pueden asumir la pérdida de funciones de archivos |

---

## Preguntas frecuentes

### ¿La versión Professional vale? ¿Da error?

Se puede usar directamente y no da error. La demo utiliza algunos plugins Enterprise (como Gestión de correo, Auditoría, Empleados de AI, etc.); si la versión Professional no los tiene, esas entradas no aparecerán, pero **no afecta al resto de módulos**. Por ejemplo desaparecerá la entrada de Auditoría, pero los módulos centrales de CRM, Ventas, Tickets, Proyectos, Activos y RRHH funcionarán con normalidad.

### ¿Qué versión usar tras la restauración?

Recomendamos la última imagen `alpha-full` (por ejemplo `nocobase/nocobase:alpha-full`). La imagen `full` trae integrado el cliente de base de datos y otras dependencias, evitando fallos por falta de herramientas durante la restauración.

### ¿No aparece el logo tras restaurar?

El logo de la demo oficial tiene restricción de dominio y no se carga desde dominios locales. Entra en **Configuración del sistema** y vuelve a subir tu propio logo.

### ¿Errores al subir archivos (OSS Key incorrecta)?

Tras instalar con el método SQL, la subida de archivos puede fallar con errores relacionados con OSS. Solución: entra en **Gestión de plugins → Gestor de archivos** y define **Local Storage (almacenamiento local)** como almacenamiento por defecto; guarda y la subida funcionará con normalidad.

### ¿Cambio de idioma?

La solución integral ya está localizada a más de 20 idiomas (namespace `nb_demo`). Tras restaurar, el idioma por defecto es chino; para cambiar a otros: **Configuración del sistema → activar el idioma correspondiente** (evita activar `ar-SA`, hoy provoca problemas de renderizado en NocoBase).

### ¿Y las actualizaciones incrementales?

La versión actual se actualiza por reemplazo total y las personalizaciones se sobrescriben. Haz siempre una copia de seguridad antes de actualizar. Estamos planeando un esquema de migración incremental, que soportará primero las versiones Pro / Enterprise. La versión Community, al carecer del plugin de gestión de migraciones, será más difícil de soportar por ahora.

Esperamos que esta guía te ayude a desplegar el Sistema de Gestión Integral sin problemas. Si te encuentras con cualquier dificultad durante el proceso, no dudes en contactarnos.
