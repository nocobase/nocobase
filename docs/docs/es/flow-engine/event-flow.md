:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Flujo de Eventos

En FlowEngine, todos los componentes de la interfaz están **orientados por eventos (Event-driven)**. El comportamiento, la interacción y los cambios de datos de los componentes se activan mediante eventos y se ejecutan a través de un flujo.

## Flujo Estático vs. Flujo Dinámico

En FlowEngine, los flujos se pueden dividir en dos tipos:

### **1. Flujo Estático (Static Flow)**

- Definido por los desarrolladores en el código;
- Aplica a **todas las instancias de una clase Model**;
- Se utiliza comúnmente para manejar la lógica general de una clase Model;

### **2. Flujo Dinámico (Dynamic Flow)**

- Configurado por los usuarios en la interfaz;
- Solo tiene efecto en una instancia específica;
- Se utiliza comúnmente para comportamientos personalizados en escenarios específicos;

En resumen: **un flujo estático es una plantilla lógica definida en una clase, mientras que un flujo dinámico es una lógica personalizada definida en una instancia.**

## Reglas de Enlace vs. Flujo Dinámico

En el sistema de configuración de FlowEngine, existen dos formas de implementar la lógica de eventos:

### **1. Reglas de Enlace (Linkage Rules)**

- Son **encapsulaciones de pasos de flujo de eventos integrados**;
- Su configuración es más sencilla y tienen una semántica más fuerte;
- En esencia, siguen siendo una forma simplificada de un **flujo de eventos (Flow)**.

### **2. Flujo Dinámico (Dynamic Flow)**

- Capacidades completas de configuración de flujo;
- Personalizable:
  - **Disparador (on)**: Define cuándo se activa;
  - **Pasos de ejecución (steps)**: Define la lógica a ejecutar;
- Adecuado para una lógica de negocio más compleja y flexible.

Por lo tanto, las **Reglas de Enlace ≈ Flujo de Eventos Simplificado**, y sus mecanismos centrales son consistentes.

## Consistencia de FlowAction

Tanto las **Reglas de Enlace** como los **Flujos de Eventos** deberían usar el mismo conjunto de **FlowAction**. Es decir:

- **FlowAction** define las acciones que pueden ser llamadas por un Flujo;
- Ambos comparten un mismo sistema de acciones, en lugar de implementar dos separados;
- Esto asegura la reutilización de la lógica y una extensión consistente.

## Jerarquía Conceptual

Conceptualmente, la relación abstracta central de FlowModel es la siguiente:

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Eventos Globales
      │     └── Eventos Locales
      └── FlowActionDefinition
            ├── Acciones Globales
            └── Acciones Locales
```

### Descripción de la Jerarquía

- **FlowModel**
  Representa una entidad de modelo con lógica de flujo configurable y ejecutable.

- **FlowDefinition**
  Define un conjunto completo de lógica de flujo (incluyendo condiciones de activación y pasos de ejecución).

- **FlowEventDefinition**
  Define la fuente de activación del flujo, incluyendo:
  - **Eventos globales**: como el inicio de la aplicación, la finalización de la carga de datos;
  - **Eventos locales**: como cambios de campo, clics de botón.

- **FlowActionDefinition**
  Define las acciones ejecutables del flujo, incluyendo:
  - **Acciones globales**: como actualizar la página, notificaciones globales;
  - **Acciones locales**: como modificar valores de campo, cambiar el estado de los componentes.

## Resumen

| Concepto | Propósito | Alcance |
|---|---|---|
| **Flujo Estático (Static Flow)** | Lógica de flujo definida en el código | Todas las instancias de XXModel |
| **Flujo Dinámico (Dynamic Flow)** | Lógica de flujo definida en la interfaz | Una única instancia de FlowModel |
| **FlowEvent** | Define el disparador (cuándo activar) | Global o local |
| **FlowAction** | Define la lógica de ejecución | Global o local |
| **Regla de Enlace (Linkage Rule)** | Encapsulación simplificada de pasos de flujo de eventos | Nivel de bloque, nivel de operación |