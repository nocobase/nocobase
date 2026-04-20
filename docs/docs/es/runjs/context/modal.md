:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/modal).
:::

# ctx.modal

Una API de acceso rápido basada en Ant Design Modal, utilizada para abrir activamente cuadros modales (avisos de información, ventanas emergentes de confirmación, etc.) en RunJS. Es implementada por `ctx.viewer` / el sistema de vistas.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSBlock / JSField** | Mostrar resultados de operaciones, avisos de error o confirmaciones secundarias tras la interacción del usuario. |
| **Flujo de trabajo / Eventos de acción** | Ventana emergente de confirmación antes del envío; termina los pasos posteriores mediante `ctx.exit()` si el usuario cancela. |
| **Reglas de enlace** | Avisos emergentes para el usuario cuando falla la validación. |

> Nota: `ctx.modal` está disponible en entornos RunJS con un contexto de vista (como JSBlocks dentro de una página, flujos de trabajo, etc.); es posible que no exista en el backend o en contextos sin interfaz de usuario (UI). Se recomienda utilizar el encadenamiento opcional (`ctx.modal?.confirm?.()`) al llamarlo.

## Definición de tipos

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // Devuelve true si el usuario hace clic en Aceptar, false si cancela
};
```

`ModalConfig` es consistente con la configuración de los métodos estáticos de `Modal` en Ant Design.

## Métodos comunes

| Método | Valor de retorno | Descripción |
|------|--------|------|
| `info(config)` | `Promise<void>` | Modal de aviso de información |
| `success(config)` | `Promise<void>` | Modal de aviso de éxito |
| `error(config)` | `Promise<void>` | Modal de aviso de error |
| `warning(config)` | `Promise<void>` | Modal de aviso de advertencia |
| `confirm(config)` | `Promise<boolean>` | Modal de confirmación; devuelve `true` si el usuario hace clic en Aceptar y `false` si cancela |

## Parámetros de configuración

Consistente con `Modal` de Ant Design, los campos comunes incluyen:

| Parámetro | Tipo | Descripción |
|------|------|------|
| `title` | `ReactNode` | Título |
| `content` | `ReactNode` | Contenido |
| `okText` | `string` | Texto del botón de aceptar |
| `cancelText` | `string` | Texto del botón de cancelar (solo para `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Se ejecuta al hacer clic en Aceptar |
| `onCancel` | `() => void` | Se ejecuta al hacer clic en Cancelar |

## Relación con ctx.message y ctx.openView

| Uso | Uso recomendado |
|------|----------|
| **Aviso temporal ligero** | `ctx.message`, desaparece automáticamente |
| **Modal de información/éxito/error/advertencia** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Confirmación secundaria (requiere elección del usuario)** | `ctx.modal.confirm`, usado con `ctx.exit()` para controlar el flujo |
| **Interacciones complejas como formularios o listas** | `ctx.openView` para abrir una vista personalizada (página/cajón/modal) |

## Ejemplos

### Modal de información simple

```ts
ctx.modal.info({
  title: 'Aviso',
  content: 'Operación completada',
});
```

### Modal de confirmación y control de flujo

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Confirmar eliminación',
  content: '¿Está seguro de que desea eliminar este registro?',
  okText: 'Confirmar',
  cancelText: 'Cancelar',
});
if (!confirmed) {
  ctx.exit();  // Termina los pasos posteriores si el usuario cancela
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Modal de confirmación con onOk

```ts
await ctx.modal.confirm({
  title: 'Confirmar envío',
  content: 'Los cambios no podrán modificarse después del envío. ¿Desea continuar?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Aviso de error

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Éxito', content: 'Operación completada' });
} catch (e) {
  ctx.modal.error({ title: 'Error', content: e.message });
}
```

## Relacionado

- [ctx.message](./message.md): Aviso temporal ligero, desaparece automáticamente.
- [ctx.exit()](./exit.md): Comúnmente utilizado como `if (!confirmed) ctx.exit()` para terminar el flujo cuando un usuario cancela la confirmación.
- [ctx.openView()](./open-view.md): Abre una vista personalizada, adecuada para interacciones complejas.