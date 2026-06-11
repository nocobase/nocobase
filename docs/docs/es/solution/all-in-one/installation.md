---
title: "Sistema de Gestión Integral - Cómo instalar"
description: "Instalación y despliegue del Sistema de Gestión Integral: restauración con un clic del archivo de backup .nbdata mediante el Gestor de copias de seguridad. Requiere NocoBase v2.1.0-alpha.40 o superior, PostgreSQL 16 y DB_UNDERSCORED no puede ser true."
keywords: "Sistema de Gestión Integral instalación, All-in-One, restauración de backup, gestor de copias de seguridad, nbdata, PostgreSQL, NocoBase"
---

# Instalación

El Sistema de Gestión Integral cubre seis módulos: **CRM, Gestión de ventas, Help desk (tickets), Gestión de proyectos, Gestión de activos y Recursos humanos**. Con el plugin «Gestor de copias de seguridad» integrado en NocoBase puedes restaurar el archivo de backup `.nbdata` con un solo clic y obtener el conjunto de datos completo.

:::tip Requisitos previos

- Tienes un entorno base de NocoBase en funcionamiento. Para la instalación del sistema principal, consulta la [documentación oficial de instalación](https://docs-cn.nocobase.com/welcome/getting-started/installation)
- Versión de NocoBase **v2.1.0-alpha.40 o superior** (de código abierto desde esta versión, disponible en la edición community)
- Has descargado el archivo de backup: [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata)

:::

:::warning Atención

- La solución está construida sobre **PostgreSQL 16**; tu entorno debe ser PostgreSQL 16
- **`DB_UNDERSCORED` no puede ser `true`** — revisa tu `docker-compose.yml`; si está en `true` la restauración fallará
- **La restauración sobrescribe TODOS los datos de la aplicación de destino** — si el entorno de destino ya tiene datos, haz primero una copia de seguridad de la aplicación actual y ejecuta la restauración con cuidado

:::

La versión actual se despliega mediante **restauración de copia de seguridad**; versiones futuras pasarán a migración incremental para facilitar la integración en sistemas NocoBase ya existentes.

---

## Pasos

### Paso 1: arranca la aplicación con la imagen `full`

Se recomienda firmemente usar la versión `full` de la imagen Docker: trae integrado el cliente de base de datos y todas las herramientas auxiliares, sin configuración adicional:

```bash
docker pull nocobase/nocobase:alpha-full
```

A continuación, arranca tu servicio NocoBase con esta imagen.

:::tip

Si no usas la imagen `full`, puede que tengas que instalar manualmente el cliente `pg_dump` dentro del contenedor, un proceso engorroso e inestable.

:::

### Paso 2: activa el plugin Gestor de copias

1. Inicia sesión en tu sistema NocoBase
2. Ve a **Gestión de plugins**
3. Localiza y activa el plugin **Gestor de copias de seguridad**

### Paso 3: restaura desde un archivo de backup local

1. Tras activar el plugin, refresca la página
2. En el menú de la izquierda, ve a **Administración del sistema / Gestor de copias de seguridad**

   ![Interfaz principal del Backup Manager](https://static-docs.nocobase.com/202510302154966.png)

3. Haz clic en **Restaurar desde backup local** en la esquina superior derecha
4. Arrastra el archivo descargado `nocobase_all_in_one_backup_260521.nbdata` a la zona de carga

   ![Restaurar desde archivo de copia local (diálogo de carga)](https://static-docs.nocobase.com/202510302155602.png)

5. Pulsa **Enviar** y espera a que termine la restauración: suele tardar de varios segundos a unos minutos

---

## Notas

- **Compatibilidad de la base de datos** — la versión de PostgreSQL, el conjunto de caracteres y la configuración de sensibilidad a mayúsculas deben coincidir con el origen del backup; el nombre del `schema` debe ser idéntico
- **Coincidencia de plugins comerciales** — activa previamente todos los plugins comerciales que usa el backup, o la restauración se interrumpirá. Los plugins comerciales de la solución integral incluyen: Gestión de correo, Auditoría, Empleados de AI, entre otros. Si la edición Community no los tiene, las entradas correspondientes no aparecerán, pero no afecta al resto de módulos

---

## Configuración necesaria tras la instalación

Una vez restaurado el sistema ya se puede abrir, pero hay dos puntos de configuración que **apuntan a nuestro entorno de demostración** y debes cambiar a los tuyos.

### 1. Motor de almacenamiento (OSS / local)

El motor de almacenamiento por defecto en el backup demo apunta a nuestro OSS de Alibaba Cloud de demostración, cuyo Access Key no es público; cualquier carga de archivos en campos de adjunto, plantillas de impresión o avatares de empleados de AI fallará.

Por norma general, cambiar a almacenamiento local es suficiente; usa tu propio OSS solo si necesitas aceleración CDN o cargas de archivos grandes.

**Pasos para cambiarlo:**

1. Ve a **Gestión de plugins / Gestor de archivos** (o accede directamente a `/admin/settings/file-manager`)

2. **Opción A — usar almacenamiento local** (lo más sencillo, ideal para autodespliegue):

   - Localiza el elemento **Local Storage (almacenamiento local)** creado automáticamente
   - Pulsa **Editar**, en la parte inferior del panel marca **Establecer como motor por defecto** y envía

   ![Configuración común del motor de almacenamiento (parte inferior: «Establecer como motor por defecto»)](https://static-docs.nocobase.com/20240529115151.png)

   :::warning Atención

   En despliegues con Docker el almacenamiento local vive dentro del contenedor: si se borra el contenedor se pierden los archivos. En producción, monta un volumen o usa almacenamiento en la nube.

   :::

3. **Opción B — usar tu propio OSS / S3 / COS**:

   - Pulsa **Añadir nuevo** y elige el tipo correspondiente (Alibaba Cloud OSS / Amazon S3 / Tencent Cloud COS / S3 Pro)
   - Rellena Access Key, Bucket, Region, dominio, etc., marca **Establecer como motor por defecto** y envía

   ![Ejemplo de configuración del motor OSS de Alibaba Cloud](https://static-docs.nocobase.com/20240712220011.png)

4. Elimina o desactiva el OSS demo preconfigurado para evitar usarlo por error

Para los parámetros detallados consulta [Visión general del motor de almacenamiento](../../file-manager/storage/index.md).

### 2. Claves de servicio LLM de AI Employees

El backup demo trae preconfigurados varios servicios LLM (OpenAI, Claude, Gemini, DeepSeek, Qwen, Kimi, etc.) con nuestras API Keys, que **no funcionan fuera de nuestro entorno**. La funcionalidad de AI Employees no estará disponible hasta que las sustituyas.

**Pasos de configuración:**

1. Ve a **Configuración del sistema / AI Employees / LLM service** (o accede a `/admin/settings/ai/llm-services`)

   ![Acceso a la página de configuración de LLM service](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

2. En la lista de servicios preconfigurados puedes arrastrar para reordenar y activar/desactivar con el conmutador **Enabled**

   ![Lista de servicios LLM (activación + orden)](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

3. Para cada servicio que vayas a utilizar:

   - Pulsa **Editar**
   - Sustituye **API Key** por la tuya (obtenida desde la cuenta del proveedor correspondiente: OpenAI, Anthropic, Google AI Studio, DeepSeek, Qwen, Kimi, etc.)
   - Si usas proxy o un relé doméstico, ajusta **Base URL**
   - En **Enabled Models** conserva los modelos que quieras usar y elimina el resto

   ![Edición del servicio LLM (API Key, Base URL, Enabled Models)](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

4. Pulsa **Test flight** abajo para probar la conexión y, si funciona, **Submit** para guardar

   ![Prueba de conexión con Test flight](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

5. Los servicios que no vayas a usar basta con dejarlos en Disabled; no hace falta borrarlos

Para la configuración detallada consulta [Configurar servicio LLM](../../ai-employees/features/llm-service.md).

:::tip

Estos son los dos ajustes obligatorios tras restaurar la demo. El resto (logo del sitio, SMTP, plugins de versión empresarial, etc.) se ajusta según necesidad.

:::

---

## Preguntas frecuentes

### ¿La edición Community vale? ¿Da error?

Sí, se puede usar directamente y no da error. El Gestor de copias de seguridad es de código abierto desde `v2.1.0-alpha.40` y se puede instalar en la edición Community. La demo utiliza algunos plugins Enterprise (Gestión de correo, Auditoría, Empleados de AI, etc.); si la edición Community no los tiene, esas entradas no aparecerán, pero no afecta al resto de módulos. Por ejemplo, desaparecerá la entrada de Auditoría, pero los módulos centrales de CRM, Ventas, Tickets, Proyectos, Activos y RRHH funcionarán con normalidad.

### ¿Qué versión usar tras la restauración?

Se recomienda la última imagen `alpha-full` (`nocobase/nocobase:alpha-full`). La imagen `full` trae integrado el cliente de base de datos y demás dependencias, evitando fallos por falta de herramientas durante la restauración.

### ¿No aparece el logo tras restaurar?

El logo de la demo oficial tiene restricción de dominio y no se carga desde dominios locales. Entra en **Configuración del sistema** y vuelve a subir tu propio logo.

### ¿Errores al subir archivos (OSS Key incorrecta)?

El motor de almacenamiento preconfigurado en el backup demo apunta a nuestro OSS de demostración, cuya Key no es pública. Entra en **Gestión de plugins / Gestor de archivos** y define **Local Storage (almacenamiento local)** como almacenamiento por defecto; guarda y la subida funcionará con normalidad.

Para más detalle consulta la sección [Motor de almacenamiento](#1-motor-de-almacenamiento-oss--local) más arriba.

### ¿Cambio de idioma?

La solución integral ya está localizada a más de 20 idiomas (namespace `nb_demo`). Tras restaurar, el idioma por defecto es chino; para cambiar a otro: **Configuración del sistema / activar el idioma correspondiente**.

### ¿Y las actualizaciones incrementales?

La versión actual se actualiza por reemplazo total y las personalizaciones se sobrescriben. Haz siempre una copia de seguridad antes de actualizar. Está en planificación un esquema de migración incremental.
