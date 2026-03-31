:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Configurar Reglas de Validación

## Introducción

Las reglas de validación se utilizan para asegurar que los datos ingresados por el usuario cumplan con las expectativas.

## ¿Dónde configurar las reglas de validación de campos?

### Configurar reglas de validación para los campos de la colección

La mayoría de los campos permiten configurar reglas de validación. Una vez que un campo tiene reglas de validación configuradas, al enviar los datos se activará una validación en el backend. Los diferentes tipos de campos admiten distintas reglas de validación.

- **Campo de fecha**

  ![20251028225946](https://static-docs.nocobase.com/20251028225946.png)

- **Campo numérico**

  ![20251028230418](https://static-docs.nocobase.com/20251028230418.png)

- **Campo de texto**

  Además de limitar la longitud del texto, los campos de texto también admiten expresiones regulares personalizadas para una validación más precisa.

  ![20251028230554](https://static-docs.nocobase.com/20251028230554.png)

### Validación frontend en la configuración del campo

Las reglas de validación que se configuran en el campo activarán una validación en el frontend para asegurar que la entrada del usuario cumpla con las especificaciones.

![20251028230105](https://static-docs.nocobase.com/20251028230105.png)

![20251028230255](https://static-docs.nocobase.com/20251028230255.png)

Los **campos de texto** también admiten validación con expresiones regulares personalizadas para cumplir con requisitos de formato específicos.

![20251028230903](https://static-docs.nocobase.com/20251028230903.png)