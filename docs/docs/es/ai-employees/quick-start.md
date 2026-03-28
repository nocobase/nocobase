:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/ai-employees/quick-start).
:::

# Inicio rápido

Vamos a completar la configuración mínima viable de un empleado de IA en 5 minutos.

## Instalar el plugin

Los empleados de IA están integrados en NocoBase (`@nocobase/plugin-ai`), por lo que no es necesaria una instalación por separado.

## Configurar modelos

Usted puede configurar los servicios de LLM desde cualquiera de los siguientes accesos:

1. Acceso desde el panel de administración: `Configuración del sistema -> Empleados de IA -> Servicio LLM`.
2. Acceso directo desde el frontend: En el panel de chat de IA, use el `Selector de modelos` (Model Switcher) para elegir un modelo y luego haga clic en el acceso directo "Agregar servicio LLM" para ir directamente a la configuración.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

Por lo general, deberá confirmar lo siguiente:
1. Seleccionar el Proveedor (Provider).
2. Completar la clave API (API Key).
3. Configurar los `Modelos habilitados` (Enabled Models); simplemente use la opción recomendada (Recommend) por defecto.

## Habilitar empleados integrados

Los empleados de IA integrados están habilitados por defecto y, por lo general, no es necesario activarlos uno por uno manualmente.

Si necesita ajustar la disponibilidad (habilitar o deshabilitar un empleado específico), puede actualizar el interruptor `Habilitado` (Enabled) en la página de lista de `Configuración del sistema -> Empleados de IA`.

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## Comenzar a colaborar

En la página de la aplicación, pase el cursor sobre el acceso directo en la esquina inferior derecha y elija un empleado de IA.
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

Haga clic para abrir el cuadro de diálogo de chat de IA:

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

También puede:  
* Agregar bloques
* Agregar archivos adjuntos
* Activar búsqueda web
* Cambiar de empleado de IA
* Seleccionar modelos

Los empleados de IA también pueden obtener automáticamente la estructura de la página como contexto. Por ejemplo, Dex en un bloque de formulario puede obtener automáticamente la estructura de los campos del formulario y llamar a las habilidades adecuadas para realizar operaciones en la página.

## Tareas rápidas 

Usted puede predefinir tareas comunes para cada empleado de IA en la ubicación actual, de modo que pueda comenzar a trabajar con un solo clic, haciéndolo rápido y conveniente.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Vista general de empleados integrados

NocoBase ofrece varios empleados de IA integrados diseñados para escenarios específicos.

Usted solo necesita:

1. Configurar los servicios de LLM.
2. Ajustar el estado de habilitación de los empleados según sea necesario (habilitados por defecto).
3. Seleccionar el modelo en la sesión y comenzar a colaborar.

| Nombre del empleado | Rol / Posicionamiento | Capacidades principales |
| :--- | :--- | :--- |
| **Cole** | Asistente de NocoBase | Preguntas y respuestas sobre el uso del producto, recuperación de documentos |
| **Ellis** | Experto en correo electrónico | Redacción de correos, generación de resúmenes, sugerencias de respuesta |
| **Dex** | Experto en organización de datos | Traducción de campos, formateo, extracción de información |
| **Viz** | Analista de perspectivas | Perspectivas de datos, análisis de tendencias, interpretación de indicadores clave |
| **Lexi** | Asistente de traducción | Traducción multilingüe, asistencia en la comunicación |
| **Vera** | Analista de investigación | Búsqueda web, agregación de información, investigación profunda |
| **Dara** | Experto en visualización de datos | Configuración de gráficos, generación de informes visuales |
| **Orin** | Experto en modelado de datos | Asistencia en el diseño de estructuras de colecciones, sugerencias de campos |
| **Nathan** | Ingeniero frontend | Asistencia en la escritura de fragmentos de código frontend, ajustes de estilo |

**Notas**

Algunos empleados de IA integrados no aparecen en la lista de la esquina inferior derecha porque tienen escenarios de trabajo exclusivos:

- Orin: Páginas de modelado de datos.
- Dara: Bloques de configuración de gráficos.
- Nathan: JS Block y otros editores de código.