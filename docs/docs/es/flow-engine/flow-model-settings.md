:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# FlowModel: Flujo de Eventos y Configuración

FlowModel ofrece un enfoque basado en el **flujo de eventos (Flow)** para implementar la lógica de configuración de componentes. Esto hace que el comportamiento y la configuración de los componentes sean más extensibles y visuales.

## Modelos Personalizados

Usted puede crear un modelo de componente personalizado extendiendo `FlowModel`. El modelo debe implementar el método `render()` para definir la lógica de renderizado del componente.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Registro de un Flow (Flujo de Eventos)

Cada modelo puede registrar uno o varios **Flows** para describir la lógica de configuración y los pasos de interacción del componente.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Configuración del Botón',
  steps: {
    general: {
      title: 'Configuración General',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Título del Botón',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

Descripción

-   `key`: El identificador único para el Flow.
-   `title`: El nombre del Flow, utilizado para la visualización en la interfaz de usuario.
-   `steps`: Define los pasos de configuración (Step). Cada paso incluye:
    -   `title`: El título del paso.
    -   `uiSchema`: La estructura del formulario de configuración (compatible con Formily Schema).
    -   `defaultParams`: Parámetros predeterminados.
    -   `handler(ctx, params)`: Se activa al guardar para actualizar el estado del modelo.

## Renderizado del Modelo

Al renderizar un modelo de componente, usted puede usar el parámetro `showFlowSettings` para controlar si se habilita la función de configuración. Si `showFlowSettings` está habilitado, aparecerá automáticamente una entrada de configuración (como un icono de ajustes o un botón) en la esquina superior derecha del componente.

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Abrir el Formulario de Configuración Manualmente con `openFlowSettings`

Además de abrir el formulario de configuración a través de la entrada de interacción integrada, también puede llamar manualmente a `openFlowSettings()` en su código.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Definición de Parámetros

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Obligatorio, la instancia del modelo al que pertenece
  preset?: boolean;               // Renderiza solo los pasos marcados como preset=true (por defecto, false)
  flowKey?: string;               // Especifica un único Flow
  flowKeys?: string[];            // Especifica varios Flows (se ignora si también se proporciona flowKey)
  stepKey?: string;               // Especifica un único paso (normalmente usado con flowKey)
  uiMode?: 'dialog' | 'drawer';   // Contenedor para mostrar el formulario, por defecto 'dialog'
  onCancel?: () => void;          // Callback al hacer clic en cancelar
  onSaved?: () => void;           // Callback después de guardar la configuración correctamente
}
```

### Ejemplo: Abrir el Formulario de Configuración de un Flow Específico en Modo Drawer

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Configuración del botón guardada');
  },
});
```