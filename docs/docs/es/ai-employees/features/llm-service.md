:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/ai-employees/features/llm-service).
:::

# Configurar el servicio LLM

Antes de utilizar los Empleados de IA, debe configurar los servicios LLM disponibles.

Actualmente se admiten OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi y modelos locales de Ollama.

## Crear servicio

Diríjase a `Configuración del sistema -> Empleados de IA -> Servicio LLM`.

1. Haga clic en `Add New` para abrir el cuadro de diálogo de creación.
2. Seleccione el `Provider` (Proveedor).
3. Complete el `Title` (Título), la `API Key` y la `Base URL` (opcional).
4. Configure los `Enabled Models` (Modelos habilitados):
   - `Recommended models`: utilice los modelos recomendados oficialmente.
   - `Select models`: seleccione de la lista devuelta por el proveedor.
   - `Manual input`: ingrese manualmente el ID del modelo y el nombre a mostrar.
5. Haga clic en `Submit` para guardar.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## Habilitación y ordenación de servicios

En la lista de servicios LLM, puede directamente:

- Utilizar el interruptor `Enabled` para activar o desactivar el servicio.
- Arrastrar para reordenar los servicios (esto afecta el orden de visualización de los modelos).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Prueba de disponibilidad

Utilice `Test flight` en la parte inferior del cuadro de diálogo de configuración para verificar la disponibilidad del servicio y del modelo.

Se recomienda realizar esta prueba antes de poner el servicio en producción.