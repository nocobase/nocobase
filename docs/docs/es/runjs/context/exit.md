# ctx.exit()

Finaliza la ejecución del flujo de eventos actual; los pasos posteriores no se ejecutarán. Se utiliza comúnmente cuando no se cumplen las condiciones de negocio, el usuario cancela o ocurre un error irrecuperable.

## Casos de uso

`ctx.exit()` se utiliza generalmente en los siguientes contextos donde se puede ejecutar JS:

| Escenario | Descripción |
|------|------|
| **Flujo de eventos** | En flujos de eventos activados por el envío de formularios, clics en botones, etc., finaliza los pasos posteriores cuando no se cumplen las condiciones. |
| **Reglas de vinculación** | En vinculaciones de campos, vinculaciones de filtros, etc., finaliza el flujo de eventos actual cuando falla la validación o es necesario omitir la ejecución. |
| **Eventos de acción** | En acciones personalizadas (por ejemplo, confirmación de eliminación, validación previa al guardado), sale cuando el usuario cancela o la validación no es satisfactoria. |

> `ctx.exit()` / `ctx.exitAll()` — Ambas llamadas terminan el paso actual y omiten los flujos secuenciales pendientes del mismo evento. Los flujos que ya se ejecutan en paralelo continúan.

## Definición de tipo

```ts
exit(): never;
```

Al llamar a `ctx.exit()` se lanza una excepción interna `FlowExitAllException`, que es capturada por el motor de flujos para detener la ejecución del flujo de eventos actual. Una vez invocado, las sentencias restantes en el código JS actual no se ejecutarán.

## Ejemplos

### Salir al cancelar el usuario

```ts
// En una ventana modal de confirmación, finalizar el flujo de eventos si el usuario hace clic en cancelar
if (!confirmed) {
  ctx.message.info('Operación cancelada');
  ctx.exit();
}
```

### Salir cuando falla la validación de parámetros

```ts
// Notificar y finalizar cuando la validación falle
if (!params.value || params.value.length < 3) {
  ctx.message.error('Parámetros inválidos, la longitud debe ser al menos 3');
  ctx.exit();
}
```

### Salir cuando no se cumplen las condiciones de negocio

```ts
// Finalizar si no se cumplen las condiciones; los pasos posteriores no se ejecutarán
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'Solo se pueden enviar borradores' });
  ctx.exit();
}
```

### Salir según la elección del usuario tras la confirmación en una ventana modal

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Confirmar eliminación',
  content: 'Esta acción no se puede deshacer. ¿Desea continuar?',
});
if (!ok) {
  ctx.message.info('Cancelado');
  ctx.exit();
}
```

## Notas

- Después de llamar a `ctx.exit()`, el código posterior en el JS actual no se ejecutará; se recomienda explicar el motivo al usuario a través de `ctx.message`, `ctx.notification` o una ventana modal antes de llamarlo.
- Normalmente no es necesario capturar `FlowExitAllException` en el código de negocio; deje que el motor de flujos lo gestione.

## Relacionado

- [ctx.exitAll()](./exit-all.md)
- [ctx.message](./message.md): Mensajes de aviso.
- [ctx.modal](./modal.md): Ventanas modales de confirmación.
