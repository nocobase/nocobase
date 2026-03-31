:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Gestión de versiones

Una vez que un `flujo de trabajo` configurado se ha activado al menos una vez, si desea modificar su configuración o sus nodos, deberá crear una nueva versión antes de realizar cualquier cambio. Esto también asegura que, al revisar el historial de ejecución de `flujos de trabajo` activados previamente, este no se vea afectado por futuras modificaciones.

En la página de configuración del `flujo de trabajo`, puede ver las versiones existentes desde el menú de versiones en la esquina superior derecha:

![Ver versiones del flujo de trabajo](https://static-docs.nocobase.com/ad93d2c08166b0e3e643fb148713a63f.png)

En el menú de más acciones ("...") a su derecha, puede elegir copiar la versión que está viendo actualmente a una nueva versión:

![Copiar flujo de trabajo a una nueva versión](https://static-docs.nocobase.com/280798e6caca2af004893390a744256.png)

Después de copiar a una nueva versión, haga clic en el interruptor "Activar"/"Desactivar" para cambiar la versión correspondiente al estado activado. Una vez hecho esto, la nueva versión del `flujo de trabajo` entrará en vigor.

Si necesita volver a seleccionar una versión antigua, cámbiela desde el menú de versiones y luego haga clic de nuevo en el interruptor "Activar"/"Desactivar" para cambiarla al estado activado. La versión que está viendo actualmente entrará en vigor, y las activaciones posteriores ejecutarán el proceso de esa versión.

Cuando necesite desactivar el `flujo de trabajo`, haga clic en el interruptor "Activar"/"Desactivar" para cambiarlo al estado desactivado, y el `flujo de trabajo` ya no se activará.

:::info{title=Consejo}
A diferencia de la opción "Copiar" un `flujo de trabajo` desde la lista de gestión de `flujos de trabajo`, un `flujo de trabajo` "copiado a una nueva versión" sigue agrupado dentro del mismo conjunto de `flujos de trabajo`, diferenciándose únicamente por la versión. Sin embargo, copiar un `flujo de trabajo` se considera un `flujo de trabajo` completamente nuevo, sin relación con las versiones del `flujo de trabajo` anterior, y su contador de ejecuciones se restablecerá a cero.
:::