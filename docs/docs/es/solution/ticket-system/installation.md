# Cómo instalar

> La versión actual utiliza la forma de **copia de seguridad y restauración** para el despliegue. En versiones posteriores, es posible que cambiemos a la forma de **migración incremental** para facilitar la integración de la solución en sus sistemas existentes.

> **El plugin Administrador de copias de seguridad ahora es de código abierto**: el plugin "[Administrador de copias de seguridad](https://docs-cn.nocobase.com/handbook/backups)" necesario para restaurar la solución ahora es de código abierto y está disponible para todas las versiones (incluida la Community). Recomendamos restaurar directamente a través de este plugin.

Antes de comenzar, asegúrese de que:

- Usted ya tiene un entorno de ejecución básico de NocoBase. Para la instalación del sistema principal, consulte la [documentación oficial de instalación](https://docs-cn.nocobase.com/welcome/getting-started/installation) más detallada.
- La versión de NocoBase sea **2.0.0-beta.5 y superior**.
- Usted ya ha descargado el archivo de copia de seguridad del sistema de tickets: [nocobase_tickets_v2_backup_260324.nbdata](https://static-docs.nocobase.com/nocobase_tickets_v2_backup_260324.nbdata)

**Nota importante**:
- Esta solución se basa en la base de datos **PostgreSQL 16**, asegúrese de que su entorno utilice PostgreSQL 16.
- **DB_UNDERSCORED no puede ser true**: Verifique su archivo `docker-compose.yml` y asegúrese de que la variable de entorno `DB_UNDERSCORED` no esté establecida en `true`; de lo contrario, entrará en conflicto con la copia de seguridad de la solución y la restauración fallará.

---

## Restaurar usando el Administrador de copias de seguridad

Este método se realiza a través del plugin integrado de NocoBase "[Administrador de copias de seguridad](https://docs-cn.nocobase.com/handbook/backups)" para una restauración con un solo clic, siendo la operación más sencilla. Este plugin ahora es de código abierto y está disponible para todas las versiones (incluida la Community).

### Características principales

* **Ventajas**:
  1. **Operación conveniente**: Se puede completar en la interfaz de usuario, permitiendo restaurar completamente todas las configuraciones, incluidos los plugins.
  2. **Restauración completa**: **Capaz de restaurar todos los archivos del sistema**, incluidos los archivos de impresión de plantillas, archivos subidos en campos de archivo de las tablas, etc., asegurando la integridad de las funciones.
* **Limitaciones**:
  1. **Requisitos de entorno estrictos**: Requiere que su entorno de base de datos (versión, configuración de sensibilidad a mayúsculas y minúsculas, etc.) sea altamente compatible con el entorno donde creamos la copia de seguridad.
  2. **Dependencia de plugins**: Si la solución incluye plugins comerciales que no tiene en su entorno local, la restauración fallará.

### Pasos a seguir

**Paso 1: [Altamente recomendado] Inicie la aplicación usando la imagen `full`**

Para evitar fallos en la restauración debido a la falta de clientes de base de datos, le recomendamos encarecidamente utilizar la versión `full` de la imagen de Docker. Esta incluye todos los programas de soporte necesarios, eliminando la necesidad de configuraciones adicionales.

Ejemplo de comando para descargar la imagen:

```bash
docker pull nocobase/nocobase:beta-full
```

Luego, use esta imagen para iniciar su servicio de NocoBase.

> **Nota**: Si no utiliza la imagen `full`, es posible que deba instalar manualmente el cliente de base de datos `pg_dump` dentro del contenedor, un proceso tedioso e inestable.

**Paso 2: Active el plugin "Administrador de copias de seguridad"**

1. Inicie sesión en su sistema NocoBase.
2. Vaya a **`Gestión de plugins`**.
3. Busque y active el plugin **`Administrador de copias de seguridad`**.

**Paso 3: Restaurar desde un archivo de copia de seguridad local**

1. Tras activar el plugin, actualice la página.
2. Vaya al menú de la izquierda **`Gestión del sistema`** -> **`Administrador de copias de seguridad`**.
3. Haga clic en el botón **`Restaurar desde copia de seguridad local`** en la esquina superior derecha.
4. Arrastre el archivo de copia de seguridad descargado al área de carga.
5. Haga clic en **`Enviar`** y espere pacientemente a que el sistema complete la restauración; este proceso puede tardar desde unos segundos hasta varios minutos.

### Notas

* **Compatibilidad de la base de datos**: Este es el punto más crítico de este método. La **versión, el conjunto de caracteres y la configuración de sensibilidad a mayúsculas y minúsculas** de su base de datos PostgreSQL deben coincidir con el archivo fuente de la copia de seguridad. En particular, el nombre del `schema` debe ser consistente.
* **Coincidencia de plugins comerciales**: Asegúrese de tener y haber activado todos los plugins comerciales requeridos por la solución; de lo contrario, la restauración se interrumpirá.

Esperamos que este tutorial le ayude a desplegar con éxito el sistema de tickets. Si encuentra algún problema durante el proceso, ¡no dude en ponerse en contacto con nosotros!
---

*Last updated: 2026-03-24*
