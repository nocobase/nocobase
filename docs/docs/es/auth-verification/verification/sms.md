---
pkg: '@nocobase/plugin-verification'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Verificación: SMS

## Introducción

El código de verificación por SMS es un tipo de verificación integrado que se utiliza para generar una contraseña dinámica de un solo uso (OTP) y enviarla al usuario a través de un mensaje SMS.

## Añadir un verificador SMS

Diríjase a la página de gestión de verificaciones.

![](https://static-docs.nocobase.com/202502271726791.png)

Añadir - OTP por SMS

![](https://static-docs.nocobase.com/202502271726056.png)

## Configuración del administrador

![](https://static-docs.nocobase.com/202502271727711.png)

Actualmente, los proveedores de servicios SMS compatibles son:

- <a href="https://www.aliyun.com/product/sms" target="_blank">SMS de Aliyun</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">SMS de Tencent Cloud</a>

Al configurar la plantilla de SMS en el panel de administración del proveedor de servicios, necesitará reservar un parámetro para el código de verificación por SMS.

- Ejemplo de configuración para Aliyun: `Su código de verificación es: ${code}`

- Ejemplo de configuración para Tencent Cloud: `Su código de verificación es: {1}`

Los desarrolladores también pueden extender el soporte a otros proveedores de servicios SMS en forma de plugins. Consulte: [Extender proveedores de servicios SMS](./dev/sms-type)

## Vinculación de usuario

Después de añadir el verificador, los usuarios pueden vincular un número de teléfono para verificación en su gestión personal de verificaciones.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

Una vez que la vinculación sea exitosa, podrá realizar la verificación de identidad en cualquier escenario que utilice este verificador.

![](https://static-docs.nocobase.com/202502271739607.png)

## Desvinculación de usuario

Para desvincular un número de teléfono, se requiere una verificación a través de un método ya vinculado.

![](https://static-docs.nocobase.com/202502282103205.png)