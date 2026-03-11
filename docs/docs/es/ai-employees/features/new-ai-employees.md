:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/ai-employees/features/new-ai-employees).
:::

# Nuevo empleado de IA

Si los empleados de IA integrados no satisfacen sus necesidades, puede crear y personalizar su propio empleado de IA.

## Iniciar la creación

Acceda a la página de gestión de `AI employees` y haga clic en `New AI employee`.

## Configuración de información básica

Realice la configuración en la pestaña `Profile`:

- `Username`: identificador único.
- `Nickname`: nombre a mostrar.
- `Position`: descripción del puesto.
- `Avatar`: avatar del empleado.
- `Bio`: breve introducción.
- `About me`: prompt del sistema.
- `Greeting message`: mensaje de bienvenida del chat.

![ai-employee-create-without-model-settings-tab.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-create-without-model-settings-tab.png)

## Configuración del rol (Role setting)

En la pestaña `Role setting`, configure el prompt del sistema (System Prompt) del empleado. Este contenido define la identidad, los objetivos, los límites de trabajo y el estilo de respuesta del empleado durante las conversaciones.

Se recomienda incluir al menos:

- Definición del rol y alcance de responsabilidades.
- Principios de procesamiento de tareas y estructura de las respuestas.
- Prohibiciones, límites de información y tono o estilo.

Puede insertar variables según sea necesario (como usuario actual, rol actual, idioma actual o fecha y hora) para que el prompt se adapte automáticamente al contexto de las diferentes sesiones.

![ai-employee-role-setting-system-prompt.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-role-setting-system-prompt.png)

## Configuración de habilidades y conocimientos

Configure los permisos de las habilidades en la pestaña `Skills`; si la capacidad de base de conocimientos está habilitada, puede continuar con la configuración en las pestañas correspondientes a la base de conocimientos.

## Finalizar la creación

Haga clic en `Submit` para completar la creación.