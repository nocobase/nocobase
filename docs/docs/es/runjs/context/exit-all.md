:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/exit-all).
:::

# ctx.exitAll()

Termina el flujo de eventos actual y todos los flujos de eventos posteriores activados en el mismo despacho de eventos. Se utiliza comúnmente cuando es necesario abortar inmediatamente todos los flujos de eventos bajo el evento actual debido a un error global o a una falla en la validación de permisos.

## Escenarios de uso

`ctx.exitAll()` se utiliza generalmente en contextos donde se puede ejecutar JS y es necesario **abortar simultáneamente el flujo de eventos actual y los flujos de eventos posteriores activados por ese evento**:

| Escenario | Descripción |
|------|------|
| **Flujo de eventos** | La validación del flujo de eventos principal falla (por ejemplo, permisos insuficientes), lo que requiere la terminación del flujo principal y de cualquier flujo posterior bajo el mismo evento que aún no se haya ejecutado. |
| **Reglas de vinculación** | Cuando la validación de vinculación falla, se debe terminar la vinculación actual y las vinculaciones posteriores activadas por el mismo evento. |
| **Eventos de operación** | La validación previa a la operación falla (por ejemplo, verificación de permisos antes de eliminar), lo que requiere evitar la operación principal y los pasos posteriores. |

> Diferencia con `ctx.exit()`: `ctx.exit()` solo termina el flujo de eventos actual; `ctx.exitAll()` termina el flujo de eventos actual y cualquier flujo de eventos posterior **no ejecutado** en el mismo despacho de eventos.

## Definición de tipo

```ts
exitAll(): never;
```

Llamar a `ctx.exitAll()` lanza una excepción interna `FlowExitAllException`, que es capturada por el motor de flujos para detener la instancia del flujo de eventos actual y los flujos de eventos posteriores bajo el mismo evento. Una vez invocada, las sentencias restantes en el código JS actual no se ejecutarán.

## Comparación con ctx.exit()

| Método | Alcance |
|------|----------|
| `ctx.exit()` | Solo termina el flujo de eventos actual; los flujos de eventos posteriores no se ven afectados. |
| `ctx.exitAll()` | Termina el flujo de eventos actual y aborta los flujos de eventos posteriores ejecutados **secuencialmente** bajo el mismo evento. |

## Modo de ejecución

- **Ejecución secuencial (sequential)**: Los flujos de eventos bajo el mismo evento se ejecutan en orden. Después de que cualquier flujo de eventos llame a `ctx.exitAll()`, los flujos de eventos posteriores no se ejecutarán.
- **Ejecución paralela (parallel)**: Los flujos de eventos bajo el mismo evento se ejecutan en paralelo. Llamar a `ctx.exitAll()` en un flujo de eventos no interrumpirá otros flujos de eventos concurrentes (ya que son independientes).

## Ejemplos

### Terminar todos los flujos de eventos cuando falla la validación de permisos

```ts
// Abortar el flujo de eventos principal y los flujos posteriores cuando los permisos son insuficientes
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'Sin permiso de operación' });
  ctx.exitAll();
}
```

### Terminar cuando falla la validación previa global

```ts
// Ejemplo: Si se detecta que los datos asociados no se pueden eliminar antes de proceder, evitar el flujo principal y las acciones posteriores
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('Existen datos asociados, no se puede eliminar');
  ctx.exitAll();
}
```

### Elección entre ctx.exit() y ctx.exitAll()

```ts
// Solo el flujo de eventos actual necesita salir -> Use ctx.exit()
if (!params.valid) {
  ctx.message.error('Parámetros inválidos');
  ctx.exit();  // Los flujos de eventos posteriores no se ven afectados
}

// Es necesario terminar todos los flujos de eventos posteriores bajo el evento actual -> Use ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Permisos insuficientes' });
  ctx.exitAll();  // Tanto el flujo de eventos principal como los posteriores bajo el mismo evento se terminan
}
```

### Mostrar un aviso antes de terminar

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Por favor, corrija primero los errores en el formulario');
  ctx.exitAll();
}
```

## Notas

- Después de llamar a `ctx.exitAll()`, el código posterior en el JS actual no se ejecutará. Se recomienda explicar el motivo al usuario a través de `ctx.message`, `ctx.notification` o un modal antes de realizar la llamada.
- El código de negocio generalmente no necesita capturar `FlowExitAllException`; deje que el motor de flujos lo maneje.
- Si solo necesita detener el flujo de eventos actual sin afectar a los posteriores, use `ctx.exit()`.
- En modo paralelo, `ctx.exitAll()` solo termina el flujo de eventos actual y no interrumpe otros flujos de eventos concurrentes.

## Relacionado

- [ctx.exit()](./exit.md): Termina solo el flujo de eventos actual
- [ctx.message](./message.md): Mensajes de aviso
- [ctx.modal](./modal.md): Ventana modal de confirmación