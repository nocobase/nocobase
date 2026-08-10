---
title: "Tabla de expresiones"
description: "La tabla de expresiones se utiliza para realizar cálculos mediante expresiones dinámicas en los flujos de trabajo. Almacena reglas de cálculo y fórmulas, admite campos de diferentes modelos de datos como variables y permite asociarlos con los datos del negocio."
keywords: "tabla de expresiones,expresiones dinámicas,expresiones de flujo de trabajo,reglas de cálculo,fórmulas,NocoBase"
---

# Tabla de expresiones

## Crear una tabla plantilla de "expresiones"

Antes de utilizar el nodo de cálculo mediante expresiones dinámicas en un flujo de trabajo, es necesario crear primero una tabla plantilla de "expresiones" en la herramienta de gestión de tablas de datos, que se utilizará para almacenar diferentes expresiones:

![Crear una tabla plantilla de expresiones](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Introducir datos de expresiones

A continuación, crea un bloque de tabla para añadir varias fórmulas a la tabla plantilla. Cada fila de la tabla plantilla de "expresiones" puede entenderse como una regla de cálculo para un modelo de datos de tabla específico. En cada fila de fórmulas se pueden utilizar como variables los valores de los campos de los modelos de datos de distintas tablas y escribir diferentes expresiones como reglas de cálculo. Por supuesto, también se pueden utilizar diferentes motores de cálculo.

![Introducir datos de expresiones](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Nota}
Después de crear las fórmulas, también es necesario asociar los datos del negocio con ellas. Como asociar directamente cada fila de datos del negocio con una fila de datos de fórmulas sería bastante laborioso, normalmente se utiliza una tabla de metadatos similar a una tabla de categorías para establecer una relación de muchos a uno (o de uno a uno) con la tabla de fórmulas, y luego se establece una relación de muchos a uno entre los datos del negocio y los metadatos de categoría. De este modo, al crear datos del negocio solo es necesario especificar los metadatos de categoría correspondientes; posteriormente, se pueden encontrar y utilizar los datos de fórmulas asociados siguiendo esta ruta de relación.
:::

## Cargar los datos correspondientes en el flujo de trabajo

Tomemos como ejemplo un evento de tabla de datos: crea un flujo de trabajo que se active cuando se cree un pedido y que precargue los datos de los productos asociados al pedido, así como los datos de las expresiones relacionadas con esos productos:

![Configuración del disparador del evento de tabla de datos](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)