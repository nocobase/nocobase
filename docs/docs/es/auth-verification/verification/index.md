---
pkg: "@nocobase/plugin-verification"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



pkg: '@nocobase/plugin-verification'
---

# Verificación

:::info{title=Nota}
A partir de la versión `1.6.0-alpha.30`, la función original de **código de verificación** se ha actualizado a **Gestión de Verificación**, que permite gestionar e integrar diferentes métodos de verificación de identidad de usuario. Una vez que los usuarios vinculan el método de verificación correspondiente, pueden realizar la verificación de identidad cuando sea necesario. Esta función está planificada para ser compatible de forma estable a partir de la versión `1.7.0`.
:::



## Introducción

**El Centro de Gestión de Verificación permite gestionar e integrar diversos métodos de verificación de identidad de usuario.** Por ejemplo:

- Código de verificación por SMS — Proporcionado por el plugin de verificación por defecto. Consulte: [Verificación: SMS](./sms)
- Autenticador TOTP — Consulte: [Verificación: Autenticador TOTP](../verification-totp/)

Los desarrolladores también pueden extender otros tipos de verificación a través de plugins. Consulte: [Extensión de tipos de verificación](./dev/type)

**Los usuarios pueden realizar la verificación de identidad cuando sea necesario, después de vincular el método de verificación correspondiente.** Por ejemplo:

- Inicio de sesión con código de verificación por SMS — Consulte: [Autenticación: SMS](./sms)
- Autenticación de dos factores (2FA) — Consulte: [Autenticación de dos factores (2FA)](../2fa)
- Verificación secundaria para operaciones de riesgo — Soporte futuro

Los desarrolladores también pueden integrar la verificación de identidad en otros escenarios necesarios mediante la extensión de plugins. Consulte: [Extensión de escenarios de verificación](./dev/scene)

**Diferencias y relación entre el módulo de Verificación y el módulo de Autenticación de Usuario:** El módulo de Autenticación de Usuario es el principal responsable de la autenticación de identidad en escenarios de inicio de sesión de usuario, donde procesos como el inicio de sesión por SMS y la autenticación de dos factores dependen de los verificadores proporcionados por el módulo de Verificación; mientras que el módulo de Verificación se encarga de la verificación de identidad para diversas operaciones de riesgo, siendo el inicio de sesión de usuario uno de esos escenarios de riesgo.

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)