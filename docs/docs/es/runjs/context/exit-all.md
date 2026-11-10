# ctx.exitAll()

Termina el flujo de eventos actual y todos los flujos de eventos posteriores activados en el mismo despacho de eventos. Se utiliza comúnmente cuando es necesario abortar inmediatamente todos los flujos de eventos bajo el evento actual debido a un error global o a una falla en la validación de permisos.

## Escenarios de uso

`ctx.exitAll()` se utiliza generalmente en contextos donde se puede ejecutar JS y es necesario **abortar simultáneamente el flujo de eventos actual y los flujos de eventos posteriores activados por ese evento**:

| Escenario | Descripción |
|------|------|
| **Flujo de eventos** | La validación del flujo de eventos principal falla (por ejemplo, permisos insuficientes), lo que requiere la terminación del flujo principal y de cualquier flujo posterior bajo el mismo evento que aún no se haya ejecutado. |
| **Reglas de vinculación** | Cuando la validación de vinculación falla, se debe terminar la vinculación actual y las vinculaciones posteriores activadas por el mismo evento. |
| **Eventos de operación** | La validación previa a la operación falla (por ejemplo, verificación de permisos antes de eliminar), lo que requiere evitar la operación principal y los pasos posteriores. |

> `ctx.exit()` / `ctx.exitAll()` — Ambas llamadas terminan el paso actual y omiten los flujos secuenciales pendientes del mismo evento. Los flujos que ya se ejecutan en paralelo continúan.

## Definición de tipo

```ts
exitAll(): never;
```

Llamar a `ctx.exitAll()` lanza una excepción interna `FlowExitAllException`, que es capturada por el motor de flujos para detener la instancia del flujo de eventos actual y los flujos de eventos posteriores bajo el mismo evento. Una vez invocada, las sentencias restantes en el código JS actual no se ejecutarán.

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
- En modo paralelo, `ctx.exitAll()` solo termina el flujo de eventos actual y no interrumpe otros flujos de eventos concurrentes.

## Relacionado

- [ctx.exit()](./exit.md)
- [ctx.message](./message.md): Mensajes de aviso
- [ctx.modal](./modal.md): Ventana modal de confirmación
