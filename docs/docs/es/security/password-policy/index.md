---
pkg: '@nocobase/plugin-password-policy'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Política de Contraseñas

## Introducción

Configure reglas de contraseña, la caducidad de las contraseñas y políticas de seguridad de inicio de sesión para todos los usuarios, además de gestionar usuarios bloqueados.

## Reglas de Contraseña

![](https://static-docs.nocobase.com/202412281329313.png)

### Longitud Mínima de la Contraseña

Establezca el requisito de longitud mínima para las contraseñas, con un máximo de 64 caracteres.

### Requisitos de Complejidad de la Contraseña

Se admiten las siguientes opciones:

- Debe contener letras y números
- Debe contener letras, números y símbolos
- Debe contener números, y letras mayúsculas y minúsculas
- Debe contener números, letras mayúsculas y minúsculas, y símbolos
- Debe contener al menos 3 de los siguientes tipos de caracteres: números, letras mayúsculas, letras minúsculas y caracteres especiales
- Sin restricciones

![](https://static-docs.nocobase.com/202412281331649.png)

### La Contraseña No Puede Contener el Nombre de Usuario

Configure si la contraseña puede contener el nombre de usuario del usuario actual.

### Historial de Contraseñas

Recuerde el número de contraseñas utilizadas recientemente por el usuario. Los usuarios no podrán reutilizar estas contraseñas al cambiarlas. Un valor de 0 significa que no hay restricciones, y el número máximo es 24.

## Configuración de Caducidad de Contraseñas

![](https://static-docs.nocobase.com/202412281335588.png)

### Período de Validez de la Contraseña

Es el período de validez de la contraseña de un usuario. Los usuarios deben cambiar su contraseña antes de que caduque para que el período de validez se recalcule. Si la contraseña no se cambia antes de su caducidad, el usuario no podrá iniciar sesión con la contraseña antigua y requerirá la asistencia de un administrador para restablecerla. Si hay otros métodos de inicio de sesión configurados, el usuario podrá utilizarlos.

### Canal de Notificación de Caducidad de Contraseña

Se envía un recordatorio cada vez que el usuario inicia sesión, dentro de los 10 días previos a la caducidad de su contraseña. Por defecto, el recordatorio se envía a través del canal de mensajes internos "Recordatorio de caducidad de contraseña", que puede gestionar en la sección de gestión de notificaciones.

### Recomendaciones de Configuración

Dado que la caducidad de la contraseña puede impedir el inicio de sesión en una cuenta, incluidas las cuentas de administrador, le recomendamos que cambie las contraseñas a tiempo y que configure varias cuentas en el sistema con autoridad para modificar las contraseñas de los usuarios.

## Seguridad de Inicio de Sesión por Contraseña

Establezca límites para los intentos de inicio de sesión con contraseña inválida.

![](https://static-docs.nocobase.com/202412281339724.png)

### Número Máximo de Intentos de Inicio de Sesión con Contraseña Inválida

Configure el número máximo de intentos de inicio de sesión que un usuario puede realizar dentro de un intervalo de tiempo especificado.

### Intervalo Máximo de Tiempo para Intentos de Inicio de Sesión con Contraseña Inválida (Segundos)

Establezca el intervalo de tiempo (en segundos) para calcular el número máximo de intentos de inicio de sesión inválidos por parte de un usuario.

### Duración del Bloqueo (Segundos)

Establezca la duración durante la cual un usuario permanece bloqueado después de exceder el límite de intentos de inicio de sesión con contraseña inválida (0 significa sin restricciones). Durante el período de bloqueo, se prohibirá al usuario acceder al sistema mediante cualquier método de autenticación, incluidas las claves API. Si necesita desbloquear a un usuario manualmente, consulte [Bloqueo de Usuarios](./lockout.md).

### Escenarios

#### Sin Restricciones

No se restringe el número de intentos de contraseña inválida por parte de los usuarios.

![](https://static-docs.nocobase.com/202412281343226.png)

#### Limitar la Frecuencia de Intentos, No Bloquear al Usuario

Ejemplo: Un usuario puede intentar iniciar sesión hasta 5 veces cada 5 minutos.

![](https://static-docs.nocobase.com/202412281344412.png)

#### Bloquear al Usuario Después de Exceder el Límite

Ejemplo: Si un usuario realiza 5 intentos consecutivos de inicio de sesión con contraseña inválida en 5 minutos, el usuario será bloqueado durante 2 horas.

![](https://static-docs.nocobase.com/202412281344952.png)

### Recomendaciones de Configuración

- La configuración del número de intentos de inicio de sesión con contraseña inválida y el intervalo de tiempo se utilizan normalmente para limitar los intentos de inicio de sesión de alta frecuencia en un corto período, lo que ayuda a prevenir ataques de fuerza bruta.
- La decisión de bloquear o no a un usuario después de exceder el límite debe considerarse en función de los escenarios de uso reales. La configuración de la duración del bloqueo puede ser explotada maliciosamente, ya que los atacantes podrían introducir intencionadamente contraseñas incorrectas varias veces para una cuenta objetivo, forzando el bloqueo de la cuenta y dejándola inutilizable. Esto se puede mitigar combinando restricciones de IP, límites de frecuencia de API y otras medidas.
- Dado que el bloqueo de una cuenta impedirá el acceso al sistema, incluidas las cuentas de administrador, es aconsejable configurar varias cuentas en el sistema que tengan la autoridad para desbloquear usuarios.