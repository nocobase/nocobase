---
pkg: "@nocobase/plugin-block-reference"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Bloque de Referencia

## Introducción
El bloque de referencia le permite mostrar un bloque existente directamente en la página actual al especificar el UID del bloque de destino, eliminando la necesidad de reconfigurarlo.

## Habilitar el plugin
Este plugin está integrado, pero viene deshabilitado por defecto.
Abra el "Gestor de plugins" → busque "Bloque: Referencia" → haga clic en "Habilitar".

![Habilitar el bloque de referencia en el Gestor de plugins](https://static-docs.nocobase.com/block-reference-enable-20251102.png)

## Cómo agregar
1) Agregue un bloque → grupo "Otros bloques" → seleccione "Bloque de referencia".  
2) En la "Configuración del bloque de referencia", configure:
   - `UID del bloque`: el UID del bloque de destino
   - `Modo de referencia`: elija `Referencia` o `Copiar`

![Demostración de cómo agregar y configurar un bloque de referencia](https://static-docs.nocobase.com/20251102193949_rec_.gif)

### Cómo obtener el UID del bloque
- Abra el menú de configuración del bloque de destino y haga clic en `Copiar UID` para copiar su UID.  

![Ejemplo de cómo copiar el UID de un bloque](https://static-docs.nocobase.com/block-reference-copy-uid-20251102.png)

## Modos y comportamiento
- `Referencia` (predeterminado)
  - Comparte la misma configuración que el bloque original; las modificaciones realizadas en el bloque original o en cualquiera de sus referencias se actualizarán automáticamente en todas las instancias.

- `Copiar`
  - Genera un bloque independiente idéntico al original en ese momento; los cambios posteriores no se sincronizarán entre ellos.

## Configuración
- Bloque de referencia:
  - `Configuración del bloque de referencia`: se utiliza para especificar el UID del bloque de destino y seleccionar el modo "Referencia/Copiar".
  - También se mostrará la configuración completa del bloque referenciado (equivalente a configurar el bloque original directamente).

![Interfaz de configuración del bloque de referencia](https://static-docs.nocobase.com/block-reference-settings-20251102.png)

- Bloque copiado:
  - El bloque resultante de la copia tendrá el mismo tipo que el original y solo contendrá su propia configuración.
  - Ya no incluirá la `Configuración del bloque de referencia`.

## Errores y estados de reserva
- Cuando el destino falta o es inválido: se mostrará un mensaje de error. Puede volver a especificar el UID del bloque en la configuración del bloque de referencia (`Configuración del bloque de referencia` → `UID del bloque`) y guardar para restaurar la visualización.  

![Estado de error cuando el bloque de destino no es válido](https://static-docs.nocobase.com/block-reference-error-20251102.png)

## Notas y limitaciones
- Esta es una función experimental; úsela con precaución en entornos de producción.
- Al copiar un bloque, algunas configuraciones que dependen del UID de destino podrían necesitar ser reconfiguradas.
- Todas las configuraciones de un bloque de referencia se sincronizan automáticamente, incluyendo aspectos como el alcance de los datos. Sin embargo, un bloque de referencia puede tener su propia [configuración de flujo de eventos](/interface-builder/event-flow/). Esto significa que, a través de flujos de eventos y acciones de JavaScript personalizadas, usted puede lograr indirectamente diferentes alcances de datos o configuraciones relacionadas para cada referencia.