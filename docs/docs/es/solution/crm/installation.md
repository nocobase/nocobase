# Cómo instalar

> La versión actual adopta la forma de **copia de seguridad y restauración** para su despliegue. En versiones posteriores, es posible que cambiemos a la forma de **migración incremental**, para facilitar la integración de la solución en sus sistemas existentes.

> **El plugin Administrador de copias de seguridad ahora es de código abierto**: el plugin "[Administrador de copias de seguridad](https://docs-cn.nocobase.com/handbook/backups)" necesario para restaurar la solución ahora es de código abierto y está disponible para todas las versiones (incluida la Community). Recomendamos restaurar directamente a través de este plugin.

Antes de comenzar, asegúrese de que:

- Ya tiene un entorno de ejecución básico de NocoBase. Para la instalación del sistema principal, consulte la [documentación oficial de instalación](https://docs-cn.nocobase.com/welcome/getting-started/installation) más detallada.
- Versión de NocoBase **v2.1.0-beta.2 o superior**
- Ya ha descargado el archivo de copia de seguridad del sistema CRM: [nocobase_crm_v2_backup_260523.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260523.nbdata)

**Nota importante**:
- Esta solución se basa en la base de datos **PostgreSQL 16**, asegúrese de que su entorno utilice PostgreSQL 16.
- **DB_UNDERSCORED no puede ser true**: Compruebe su archivo `docker-compose.yml` y asegúrese de que la variable de entorno `DB_UNDERSCORED` no esté establecida en `true`; de lo contrario, entrará en conflicto con la copia de seguridad de la solución y provocará un fallo en la restauración.

---

## Restaurar usando el Administrador de copias de seguridad

Este método realiza una restauración con un solo clic a través del plugin "[Administrador de copias de seguridad](https://docs-cn.nocobase.com/handbook/backups)" integrado en NocoBase, siendo la operación más sencilla. Este plugin ahora es de código abierto y está disponible para todas las versiones (incluida la Community).

### Características principales

* **Ventajas**:
  1. **Operación conveniente**: Se puede completar en la interfaz de usuario, permitiendo restaurar completamente todas las configuraciones, incluidos los plugins.
  2. **Restauración completa**: **Capaz de restaurar todos los archivos del sistema**, incluidos los archivos de plantillas de impresión, archivos cargados en campos de archivos de las tablas, etc., asegurando la integridad funcional.
* **Limitaciones**:
  1. **Requisitos de entorno estrictos**: Requiere que su entorno de base de datos (versión, configuración de sensibilidad a mayúsculas y minúsculas, etc.) sea altamente compatible con el entorno donde se creó la copia de seguridad.
  2. **Dependencia de plugins**: Si la solución incluye plugins comerciales que no tiene en su entorno local, la restauración fallará.

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

Esperamos que este tutorial le ayude a desplegar con éxito el sistema CRM 2.0. Si encuentra algún problema durante el proceso, ¡no dude en ponerse en contacto con nosotros en cualquier momento!
---

*Last updated: 2026-04-02*
