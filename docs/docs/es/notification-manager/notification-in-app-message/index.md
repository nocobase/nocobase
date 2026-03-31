---
pkg: '@nocobase/plugin-notification-in-app-message'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Notificación: Mensaje en la aplicación

## Introducción

Permite a los usuarios recibir notificaciones de mensajes en tiempo real directamente dentro de la aplicación NocoBase.

## Instalación

Este plugin es un plugin integrado, por lo que no requiere instalación adicional.

## Cómo añadir un canal de mensajes en la aplicación

Vaya a Gestión de notificaciones, haga clic en el botón "Añadir" y seleccione "Mensaje en la aplicación".
![2024-11-08-08-33-26-20241108083326](https://static-docs.nocobase.com/2024-11-08-08-33-26-20241108083326.png)

Después de introducir el nombre y la descripción del canal, haga clic en "Enviar".
![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

El nuevo canal aparecerá ahora en la lista.

![2024-11-08-08-34-52-20241108083452](https://static-docs.nocobase.com/2024-11-08-08-34-52-20241108083452.png)

## Ejemplo de caso de uso

Para ayudarle a comprender mejor cómo utilizar los mensajes en la aplicación, a continuación, le presentamos un ejemplo de "Seguimiento de clientes potenciales de marketing".

Imagine que su equipo está llevando a cabo una importante campaña de marketing cuyo objetivo es hacer un seguimiento de las respuestas y necesidades de los clientes potenciales. Utilizando los mensajes en la aplicación, usted puede:

**Crear un canal de notificación**: Primero, en Gestión de notificaciones, configure un canal de mensajes en la aplicación llamado "Marketing Clue" para asegurarse de que los miembros del equipo puedan identificar claramente su propósito.

![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

**Configurar un flujo de trabajo**: Cree un flujo de trabajo que active automáticamente una notificación cuando se genere un nuevo cliente potencial de marketing. Puede añadir un nodo de notificación al flujo de trabajo, seleccionar el canal "Marketing Clue" que creó y configurar el contenido del mensaje según sus necesidades. Por ejemplo:

![image-1-2024-10-27-14-07-17](https://static-docs.nocobase.com/image-1-2024-10-27-14-07-17.png)

**Recibir notificaciones en tiempo real**: Una vez que se active el flujo de trabajo, todo el personal relevante recibirá notificaciones en tiempo real, lo que garantiza que el equipo pueda responder y actuar con rapidez.

![image-2-2024-10-27-14-07-22](https://static-docs.nocobase.com/image-2-2024-10-27-14-07-22.png)

**Gestión y seguimiento de mensajes**: Los mensajes en la aplicación se agrupan por el nombre de su canal. Puede filtrar los mensajes por su estado de leído y no leído para ver rápidamente la información importante. Al hacer clic en el botón "Ver", se le redirigirá a la página del enlace configurado para que pueda tomar medidas adicionales.

![20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41](https://static-docs.nocobase.com/20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41.png)