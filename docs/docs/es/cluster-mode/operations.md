:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Procedimientos de Mantenimiento

## Primer Inicio de la Aplicación

Cuando inicie la aplicación por primera vez, debe iniciar un nodo primero. Espere a que los **plugins** se instalen y se activen, y luego inicie los demás nodos.

## Actualización de Versión

Cuando necesite actualizar la versión de NocoBase, siga este procedimiento.

:::warning{title=Atención}
En un **entorno de producción** en clúster, las funciones como la gestión de **plugins** y las actualizaciones de versión deben usarse con precaución o incluso prohibirse.

Actualmente, NocoBase no admite actualizaciones en línea para versiones en clúster. Para garantizar la coherencia de los datos, es necesario suspender los servicios externos durante el proceso de actualización.
:::

Pasos a seguir:

1.  Detenga el servicio actual

    Detenga todas las instancias de la aplicación NocoBase y redirija el tráfico del balanceador de carga a una página de estado 503.

2.  Realice una copia de seguridad de los datos

    Antes de actualizar, se recomienda encarecidamente hacer una copia de seguridad de la base de datos para evitar cualquier problema durante el proceso de actualización.

3.  Actualice la versión

    Consulte [Actualización de Docker](../get-started/upgrading/docker) para actualizar la versión de la imagen de la aplicación NocoBase.

4.  Inicie el servicio

    1.  Inicie un nodo en el clúster y espere a que la actualización se complete y el nodo se inicie correctamente.
    2.  Verifique que la funcionalidad sea correcta. Si hay algún problema que no se pueda resolver mediante la resolución de problemas, puede revertir a la versión anterior.
    3.  Inicie los demás nodos.
    4.  Redirija el tráfico del balanceador de carga al clúster de la aplicación.

## Mantenimiento dentro de la Aplicación

El mantenimiento dentro de la aplicación se refiere a la realización de operaciones relacionadas con el mantenimiento mientras la aplicación está en ejecución, incluyendo:

*   Gestión de **plugins** (instalación, activación, desactivación de **plugins**, etc.)
*   Copia de seguridad y restauración
*   Gestión de migración de entornos

Pasos a seguir:

1.  Reduzca el número de nodos

    Reduzca a un solo nodo los nodos de la aplicación en ejecución dentro del clúster, y detenga el servicio en los demás nodos.

2.  Realice operaciones de mantenimiento dentro de la aplicación, como instalar y activar **plugins**, hacer copias de seguridad de datos, etc.

3.  Restaure los nodos

    Una vez que las operaciones de mantenimiento se hayan completado y la funcionalidad se haya verificado, inicie los demás nodos. Cuando los nodos se hayan iniciado correctamente, restaure el estado operativo del clúster.