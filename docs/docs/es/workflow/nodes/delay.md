:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Retraso

## Introducción

El nodo de Retraso le permite añadir una demora a su **flujo de trabajo**. Una vez finalizada la demora, puede configurarlo para que el **flujo de trabajo** continúe ejecutando los nodos siguientes o para que termine de forma anticipada, según sus preferencias.

Este nodo se utiliza con frecuencia junto con el nodo de Rama Paralela. Puede añadir un nodo de Retraso en una de las ramas para gestionar procesos que deben ocurrir después de un tiempo límite. Por ejemplo, si en una rama paralela una de las ramas implica una acción manual y la otra contiene un nodo de Retraso, cuando el procesamiento manual excede el tiempo límite, si lo configura para "fallar al expirar", significa que la acción manual debe completarse dentro del plazo establecido. Si lo configura para "continuar al expirar", la acción manual puede ignorarse una vez transcurrido el tiempo.

## Instalación

**Plugin** integrado, no requiere instalación.

## Crear nodo

En la interfaz de configuración del **flujo de trabajo**, haga clic en el botón de más ("+") dentro del flujo para añadir un nodo de "Retraso":

![Crear nodo de Retraso](https://static-docs.nocobase.com/d0816999c9f7acaec1c409bd8fb6cc36.png)

## Configuración del nodo

![Nodo de Retraso_Configuración del nodo](https://static-docs.nocobase.com/5fe8a36535f20a087a0148ffa1cd2aea.png)

### Tiempo de retraso

Para el tiempo de retraso, puede introducir un número y seleccionar una unidad de tiempo. Las unidades de tiempo admitidas son: segundos, minutos, horas, días y semanas.

### Estado al expirar

Para el estado al expirar el tiempo, puede elegir entre "Aprobar y continuar" o "Fallar y salir". La primera opción significa que, una vez finalizado el retraso, el **flujo de trabajo** continuará ejecutando los nodos siguientes. La segunda opción implica que, tras el retraso, el **flujo de trabajo** terminará de forma anticipada con un estado de fallo.

## Ejemplo

Tomemos como ejemplo un escenario en el que una orden de trabajo requiere una respuesta en un tiempo limitado después de ser iniciada. Necesitamos añadir un nodo manual en una de las dos ramas paralelas y un nodo de Retraso en la otra. Si el procesamiento manual no recibe una respuesta en 10 minutos, el estado de la orden de trabajo se actualizará a "tiempo excedido y sin procesar".

![Nodo de Retraso_Ejemplo_Organización del flujo](https://static-docs.nocobase.com/898c84adc376dc211b003a62e16e8e5b.png)