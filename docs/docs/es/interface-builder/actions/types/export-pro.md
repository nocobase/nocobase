---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Exportar Pro

## Introducción

El plugin Exportar Pro ofrece funcionalidades mejoradas sobre la función de exportación estándar.

## Instalación

Este plugin depende del plugin de Gestión de Tareas Asíncronas. Antes de usarlo, debe habilitar el plugin de Gestión de Tareas Asíncronas.

## Mejoras de Funcionalidad

- Soporta operaciones de exportación asíncronas, ejecutadas en un hilo independiente, para exportar grandes volúmenes de datos.
- Soporta la exportación de archivos adjuntos.

## Guía de Usuario

### Configuración del Modo de Exportación

![20251029172829](https://static-docs.nocobase.com/20251029172829.png)

![20251029172914](https://static-docs.nocobase.com/20251029172914.png)

En el botón de exportación, puede configurar el modo de exportación. Hay tres modos opcionales:

- **Automático**: El modo de exportación se determina según el volumen de datos. Si la cantidad de registros es inferior a 1000 (o 100 para exportaciones de archivos adjuntos), se utiliza la exportación síncrona. Si es superior a 1000 (o 100 para exportaciones de archivos adjuntos), se utiliza la exportación asíncrona.
- **Síncrono**: Utiliza la exportación síncrona, que se ejecuta en el hilo principal. Es adecuado para volúmenes de datos pequeños. Exportar grandes cantidades de datos en modo síncrono puede provocar que el sistema se bloquee, se congele y no pueda procesar otras solicitudes de usuario.
- **Asíncrono**: Utiliza la exportación asíncrona, que se ejecuta en un hilo de fondo independiente y no bloquea el funcionamiento actual del sistema.

### Exportación Asíncrona

Después de iniciar una exportación, el proceso se ejecutará en un hilo de fondo independiente, sin necesidad de configuración manual por parte del usuario. En la interfaz de usuario, tras iniciar una operación de exportación, la tarea de exportación en curso se mostrará en la esquina superior derecha, mostrando el progreso en tiempo real.

![20251029173028](https://static-docs.nocobase.com/20251029173028.png)

Una vez completada la exportación, puede descargar el archivo exportado desde las tareas de exportación.

#### Exportaciones Concurrentes
Un gran número de tareas de exportación concurrentes puede verse afectado por la configuración del servidor, lo que ralentiza la respuesta del sistema. Por lo tanto, se recomienda que los desarrolladores del sistema configuren el número máximo de tareas de exportación concurrentes (el valor predeterminado es 3). Cuando el número de tareas concurrentes excede el límite configurado, las nuevas tareas se pondrán en cola.

![20250505171706](https://static-docs.nocobase.com/20250505171706.png)

Método de configuración de concurrencia: Variable de entorno `ASYNC_TASK_MAX_CONCURRENCY=número_de_concurrencia`

Basándose en pruebas exhaustivas con diferentes configuraciones y complejidades de datos, los recuentos de concurrencia recomendados son:
- CPU de 2 núcleos, concurrencia 3.
- CPU de 4 núcleos, concurrencia 5.

#### Sobre el Rendimiento
Cuando observe que el proceso de exportación es anormalmente lento (consulte la referencia a continuación), podría tratarse de un problema de rendimiento causado por la estructura de la **colección**.

| Características de los Datos | Tipo de Índice | Volumen de Datos | Duración de la Exportación |
|---------|---------|--------|---------|
| Sin Campos de Relación | Clave Primaria / Restricción Única | 1 millón | 3～6 minutos |
| Sin Campos de Relación | Índice Regular | 1 millón | 6～10 minutos |
| Sin Campos de Relación | Índice Compuesto (no único) | 1 millón | 30 minutos |
| Campos de Relación<br>(Uno a Uno, Uno a Muchos,<br>Muchos a Uno, Muchos a Muchos) | Clave Primaria / Restricción Única | 500.000 | 15～30 minutos | Los campos de relación reducen el rendimiento |

Para asegurar exportaciones eficientes, le recomendamos:
1. La **colección** debe cumplir las siguientes condiciones:

| Tipo de Condición | Condición Requerida | Otras Notas |
|---------|------------------------|------|
| Estructura de la **Colección** (cumplir al menos una) | Tiene una Clave Primaria<br>Tiene una Restricción Única<br>Tiene un Índice (único, regular, compuesto) | Prioridad: Clave Primaria > Restricción Única > Índice
| Características del Campo | La Clave Primaria / Restricción Única / Índice (uno de ellos) debe tener características de ordenación, como: ID autoincremental, ID Snowflake, UUID v1, marca de tiempo, número, etc.<br>(Nota: Los campos no ordenables como UUID v3/v4/v5, cadenas de texto normales, etc., afectarán el rendimiento) | Ninguna |

2. Reduzca el número de campos innecesarios a exportar, especialmente los campos de relación (los problemas de rendimiento causados por los campos de relación aún están siendo optimizados).
![20250506215940](https://static-docs.nocobase.com/20250506215940.png)
3. Si la exportación sigue siendo lenta después de cumplir las condiciones anteriores, puede analizar los registros o enviar sus comentarios al equipo oficial.
![20250505182122](https://static-docs.nocobase.com/20250505182122.png)

- [Regla de Enlace](/interface-builder/actions/action-settings/linkage-rule): Muestra/oculta el botón dinámicamente;
- [Editar botón](/interface-builder/actions/action-settings/edit-button): Edite el título, tipo e icono del botón;