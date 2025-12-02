:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Modo de Clúster

## Introducción

A partir de la versión v1.6.0, NocoBase permite ejecutar aplicaciones en modo de clúster. Cuando una aplicación se ejecuta en este modo, puede mejorar su rendimiento al manejar accesos concurrentes utilizando múltiples instancias y un modo multinúcleo.

## Arquitectura del Sistema

![20251031221530](https://static-docs.nocobase.com/20251031221530.png)

*   **Clúster de aplicaciones**: Un clúster compuesto por múltiples instancias de la aplicación NocoBase. Puede desplegarse en varios servidores o ejecutar múltiples procesos en modo multinúcleo en un único servidor.
*   **Base de datos**: Almacena los datos de la aplicación. Puede ser una base de datos de nodo único o distribuida.
*   **Almacenamiento compartido**: Se utiliza para almacenar los archivos y datos de la aplicación, permitiendo el acceso de lectura/escritura desde múltiples instancias.
*   **Middleware**: Incluye componentes como caché, señales de sincronización, colas de mensajes y bloqueos distribuidos, que facilitan la comunicación y coordinación dentro del clúster de aplicaciones.
*   **Balanceador de carga**: Se encarga de distribuir las solicitudes de los clientes a las diferentes instancias del clúster de aplicaciones, además de realizar comprobaciones de estado y conmutación por error.

## Más información

Este documento solo presenta los conceptos básicos y los componentes del modo de clúster de NocoBase. Para obtener detalles específicos sobre la implementación y más opciones de configuración, consulte los siguientes documentos:

- Despliegue
  - [Preparativos](./preparations)
  - [Despliegue en Kubernetes](./kubernetes)
  - [Operaciones](./operations)
- Avanzado
  - [División de servicios](./services-splitting)
- [Referencia de desarrollo](./development)