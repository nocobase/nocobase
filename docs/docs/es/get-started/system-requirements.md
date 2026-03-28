:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/get-started/system-requirements).
:::

# Requisitos del sistema

Los requisitos del sistema descritos en este documento se aplican únicamente al **servicio de la aplicación NocoBase en sí**, y cubren los recursos de cómputo y memoria requeridos por los procesos de la aplicación. **No incluyen los servicios de terceros dependientes**, que incluyen, entre otros:

- Pasarelas API (API gateways) / proxies inversos
- Servicios de base de datos (por ejemplo, MySQL o PostgreSQL)
- Servicios de caché (por ejemplo, Redis)
- Middleware como colas de mensajes o almacenamiento de objetos

A excepción de los escenarios de validación de funciones o puramente experimentales, **se recomienda encarecidamente implementar los servicios de terceros mencionados anteriormente de forma independiente** en servidores o contenedores separados, o utilizar directamente servicios en la nube relacionados.

La configuración del sistema y la planificación de la capacidad de dichos servicios deben evaluarse y ajustarse por separado en función del **volumen de datos real, la carga de trabajo y la escala de concurrencia**.

## Modo de implementación de nodo único

El modo de implementación de nodo único significa que el servicio de la aplicación NocoBase se ejecuta en un solo servidor o instancia de contenedor.

### Requisitos mínimos de hardware

| Recurso | Requisito |
|---|---|
| CPU | 1 núcleo |
| Memoria | 2 GB |

**Escenarios de aplicación**:

- Micro negocios
- Prueba de concepto (POC)
- Entornos de desarrollo / prueba
- Escenarios con casi nulo acceso concurrente

:::info{title=Sugerencia}

- Esta configuración solo garantiza que el sistema pueda ejecutarse; no garantiza el rendimiento.
- A medida que aumenta el volumen de datos o las solicitudes concurrentes, los recursos del sistema pueden convertirse rápidamente en un cuello de botella.
- Para escenarios de **desarrollo de código fuente, desarrollo de plugins o construcción e implementación desde el código fuente**, se recomienda reservar **al menos 4 GB de memoria libre** para asegurar que los procesos de instalación de dependencias, compilación y construcción se completen correctamente.

:::

### Requisitos de hardware recomendados

| Recurso | Configuración recomendada |
|---|---|
| CPU | 2 núcleos |
| Memoria | ≥ 4 GB |

**Escenarios de aplicación**:

Adecuado para negocios de tamaño pequeño y mediano y entornos de producción con poca concurrencia.

:::info{title=Sugerencia}

- Con esta configuración, el sistema puede satisfacer las operaciones rutinarias del panel de administración y cargas de trabajo ligeras.
- Cuando la complejidad del negocio, el acceso concurrente o las tareas en segundo plano aumenten, considere actualizar las especificaciones de hardware o migrar al modo clúster.

:::

## Modo clúster

Adecuado para escenarios de negocio de mediana y gran escala con mayor concurrencia. Puede escalar horizontalmente para mejorar la disponibilidad del sistema y el rendimiento del negocio (para más detalles, consulte: [Modo clúster](/cluster-mode)).

### Requisitos de hardware por nodo

En el modo clúster, se recomienda que la configuración de hardware de cada nodo de aplicación (Pod / instancia) sea la misma que en el modo de implementación de nodo único.

**Configuración mínima por nodo:**

- CPU: 1 núcleo
- Memoria: 2 GB

**Configuración recomendada por nodo:**

- CPU: 2 núcleos
- Memoria: 4 GB

### Planificación del número de nodos

- El número de nodos en el clúster se puede ampliar según sea necesario (2–N).
- El número real de nodos necesarios depende de:
  - Volumen de acceso concurrente
  - Complejidad de la lógica de negocio
  - Carga de tareas en segundo plano y procesamiento asíncrono
  - Capacidad de respuesta de los servicios externos dependientes

Recomendaciones para entornos de producción:

- Ajustar dinámicamente la escala de los nodos basándose en métricas de monitoreo (CPU, memoria, latencia de solicitudes, etc.).
- Reservar cierta redundancia de recursos para hacer frente a las fluctuaciones de tráfico.