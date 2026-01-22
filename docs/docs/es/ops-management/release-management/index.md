:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Gestión de Lanzamientos

## Introducción

En aplicaciones reales, para garantizar la seguridad de los datos y la estabilidad de la aplicación, es habitual desplegar múltiples entornos, como un entorno de desarrollo, uno de pre-producción y uno de producción. Este documento le mostrará dos procesos comunes de desarrollo sin código y le explicará en detalle cómo implementar la gestión de lanzamientos en NocoBase.

## Instalación

Para la gestión de lanzamientos, son indispensables tres plugins. Asegúrese de que los siguientes plugins estén activados.

### Variables y Claves de Entorno

- Plugin integrado, instalado y activado por defecto.
- Permite la configuración y gestión centralizada de variables y claves de entorno, utilizadas para el almacenamiento de datos sensibles, la reutilización de datos de configuración, el aislamiento de configuraciones por entorno, entre otros fines ([Ver Documentación](#)).

### Gestor de Copias de Seguridad

- Este plugin solo está disponible en la edición Profesional o superior ([Más información](https://www.nocobase.com/en/commercial)).
- Ofrece funciones de copia de seguridad y restauración, incluyendo copias de seguridad programadas, garantizando la seguridad de los datos y una recuperación rápida ([Ver Documentación](../backup-manager/index.mdx)).

### Gestor de Migraciones

- Este plugin solo está disponible en la edición Profesional o superior ([Más información](https://www.nocobase.com/en/commercial)).
- Se utiliza para migrar configuraciones de aplicaciones de un entorno de aplicación a otro ([Ver Documentación](../migration-manager/index.md)).

## Procesos Comunes de Desarrollo Sin Código

### Entorno de Desarrollo Único, Lanzamiento Unidireccional

Este enfoque es adecuado para procesos de desarrollo sencillos. Hay un único entorno de desarrollo, uno de pre-producción y uno de producción. Los cambios fluyen desde el entorno de desarrollo hacia el de pre-producción y, finalmente, se despliegan en el entorno de producción. En este proceso, solo el entorno de desarrollo puede modificar las configuraciones; los entornos de pre-producción y producción no permiten modificaciones.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

Al configurar las reglas de migración, seleccione la regla **"Sobrescribir"** para las tablas integradas del núcleo y los plugins si es necesario; para todas las demás, puede mantener la configuración predeterminada si no hay requisitos especiales.

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

### Múltiples Entornos de Desarrollo, Lanzamiento Fusionado

Este enfoque es adecuado para la colaboración entre varias personas o para proyectos complejos. Varios entornos de desarrollo paralelos pueden utilizarse de forma independiente, y todos los cambios se fusionan en un único entorno de pre-producción para su prueba y verificación antes de ser desplegados en producción. En este proceso, también solo el entorno de desarrollo puede modificar las configuraciones; los entornos de pre-producción y producción no permiten modificaciones.

![20250107103829](https://static-docs.nocobase.com/20250107103829.png)

Al configurar las reglas de migración, seleccione la regla **"Insertar o Actualizar"** para las tablas integradas del núcleo y los plugins si es necesario; para todas las demás, puede mantener la configuración predeterminada si no hay requisitos especiales.

![20250105194942](https://static-docs.nocobase.com/20250105194942.png)

## Reversión

Antes de ejecutar una migración, el sistema crea automáticamente una copia de seguridad de la aplicación actual. Si la migración falla o los resultados no son los esperados, puede realizar una reversión y restaurar a través del [Gestor de Copias de Seguridad](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)