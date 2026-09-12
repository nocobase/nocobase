# Capítulo 1: Primer contacto con NocoBase

<iframe width="800" height="450" src="https://player.bilibili.com/player.html?isOutside=true&aid=113592322098790&bvid=BV18qzRYyErc&cid=27170310323&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

## 1.1 Experiencia rápida

Para empezar, le recomendamos probar NocoBase rápidamente para conocer su potencia. Puede acceder al [Demo en línea](https://demo-cn.nocobase.com/new), introducir su correo electrónico y la información solicitada y hacer clic en activar. Recibirá un sistema de prueba con una validez de 2 días que incluye todos los plugins comerciales:

![](https://static-docs.nocobase.com/Solution/202411052322391730820159.png)

![](https://static-docs.nocobase.com/Solution/202411052328231730820503.png)

Tras recibir el correo oficial de NocoBase, puede empezar a explorar y comprobar la flexibilidad y potencia de NocoBase. Sienta total libertad para experimentar dentro del sistema de prueba.

## 1.2 Interfaz básica de NocoBase

¡Bienvenido a NocoBase! La primera vez que acceda, la interfaz puede resultar algo desconocida. No se preocupe: vamos a recorrer las áreas funcionales principales paso a paso para ayudarle a familiarizarse rápidamente.

### 1.2.1 **Configuración de la interfaz (UI editor)**

Cuando acceda por primera vez a NocoBase, verá una interfaz principal limpia e intuitiva. En la esquina superior derecha encontrará el botón [**Configuración de la interfaz**](https://docs-cn.nocobase.com/handbook/ui/ui-editor): al hacer clic, el sistema entrará en modo de configuración. Esta es el área principal de trabajo para construir las páginas de su sistema.

![Modo de configuración de la interfaz](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152031029.png)

**Pasos:**

1. **Entrar en modo de configuración**: haga clic en el botón "Configuración de la interfaz" en la esquina superior derecha para entrar en el modo de configuración.
2. **Añadir una página al [menú](https://docs-cn.nocobase.com/handbook/ui/menus)**:
   - Haga clic en "Añadir elemento de menú".
   - Introduzca el nombre del menú (por ejemplo, "Página de prueba") y confirme.
   - El sistema creará y abrirá automáticamente la nueva página de prueba.

![demov4-001.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152032346.gif)

3. **Crear un [bloque](https://docs-cn.nocobase.com/handbook/ui/blocks)**:
   - En la página de prueba, haga clic en el botón "Crear bloque".
   - Seleccione un tipo de bloque de datos, por ejemplo "Bloque de tabla".
   - Conéctelo a una tabla, como la tabla "Usuarios" integrada en el sistema.
   - Elija los campos que desea mostrar y confirme.
4. ¡Listo! Ya tiene un bloque de tabla que muestra la lista de usuarios.

![Crear bloque](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152032964.gif)

¿Verdad que es muy sencillo? El diseño de bloques de NocoBase se inspira en Notion, pero ofrece más potencia para construir sistemas complejos. En los siguientes apartados profundizaremos en los distintos tipos de bloques.

### 1.2.2 **Gestor de plugins**

Los plugins son la herramienta clave para ampliar las funcionalidades de NocoBase. En el [**Gestor de plugins**](https://docs-cn.nocobase.com/handbook/plugin-manager) puede ver, instalar, activar o desactivar plugins según sus necesidades.

Mediante los plugins puede integrar funcionalidades cómodas o sorprendentes que facilitarán su creación y desarrollo.

![Gestor de plugins](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152034703.png)

**Pasos:**

1. **Ver los plugins instalados**: haga clic en "Gestor de plugins" para ver la lista de plugins instalados actualmente.
2. **Activar un plugin**:
   - Localice el plugin que necesita, por ejemplo "Editor de temas".
   - Haga clic en el botón "Activar" para habilitarlo.
3. **Probar la funcionalidad del plugin**:
   - Una vez activado el "Editor de temas", desde el centro personal de la esquina superior derecha podrá cambiar rápidamente el tema del sistema.
     ![Cambiar el tema del sistema](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152035380.gif)
   - En el centro de configuración encontrará la pantalla del editor de temas, donde puede personalizar el tema del sistema cambiando colores, fuentes, etc.
     ![Pantalla del editor de temas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152035889.png)

### 1.2.3 **Página de configuración**

La **página de configuración** integra los ajustes del sistema y de algunos plugins, para que pueda gestionar de forma global todos los aspectos de NocoBase.

![Página de configuración](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036847.png)

**Algunas configuraciones de plugin habituales son:**

- [**Gestión de fuentes de datos**](https://docs-cn.nocobase.com/handbook/data-source-manager): gestiona todas las tablas de datos y configura la base de datos principal o externas.
- [**Configuración del sistema**](https://docs-cn.nocobase.com/handbook/system-settings): permite cambiar el nombre del sistema, el logotipo, el idioma y otra información básica.
- [**Usuarios y permisos**](https://docs-cn.nocobase.com/handbook/users): gestión de cuentas de usuario y configuración de permisos por rol.
- [**Configuración de plugins**](https://docs-cn.nocobase.com/handbook/plugin-manager): configuración detallada y gestión de los plugins instalados.

### 1.2.4 **Información de versión y soporte**

En la esquina superior derecha de la interfaz puede consultar la **información de versión de NocoBase**. Si tiene alguna duda durante el uso, puede acudir a la **página principal** y al **manual de usuario** para obtener ayuda.

![Información de versión](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036065.png)

### 1.2.5 **Menú del centro personal**

El menú del centro personal se encuentra en la esquina superior derecha y permite **modificar la información personal** y **cambiar de rol**, además de algunas operaciones importantes del sistema.
Algunos plugins también amplían las capacidades disponibles aquí.

![Menú del centro personal](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036889.png)

## 1.3 Instalación de NocoBase

Una vez decida usar NocoBase de forma más profunda, deberá instalarlo en su equipo o servidor. NocoBase ofrece varias opciones de instalación: elija la que mejor se adapte y comience su viaje no-code.

### 1.3.1 **Métodos de instalación**

1. **Instalación con Docker (recomendado)**

   - **Ventajas**: rápida, sencilla y adecuada para usuarios familiarizados con Docker.
   - **Selección de versión**:
     - **Versión main & latest**: la más estable hasta el momento, recomendada para la mayoría de usuarios.
     - **Versión next**: versión beta interna, recomendada para usuarios que deseen probar nuevas funcionalidades. Tenga en cuenta que esta versión puede no ser totalmente estable; se recomienda hacer copias de seguridad de los datos importantes antes de usarla.
   - **Pasos**:
     - Consulte la [guía oficial de instalación](https://docs-cn.nocobase.com/welcome/getting-started/installation/docker-compose) para desplegar NocoBase con Docker Compose.
2. **Instalación con Create-NocoBase-App**

   - **Recomendado para**: desarrolladores frontend o usuarios familiarizados con npm.
   - **Pasos**:
     - Consulte la [guía de instalación](https://docs-cn.nocobase.com/welcome/getting-started/installation/create-nocobase-app) para instalarlo mediante un paquete npm.
3. **Instalación desde el código fuente**

   - **Recomendado para**: desarrolladores que necesiten personalizar NocoBase a fondo.
   - **Pasos**:
     - Consulte la [guía de instalación](https://docs-cn.nocobase.com/welcome/getting-started/installation/git-clone), clone el código desde GitHub e instálelo según sus necesidades.

### 1.3.2 **Guía detallada de instalación (ejemplo con Docker)**

Cualquiera que sea el método elegido, encontrará pasos detallados en la **documentación de instalación de NocoBase**. A continuación se describe brevemente la instalación con Docker:

1. **Instalar Docker**: asegúrese de que su sistema tiene Docker instalado. Si todavía no lo tiene, descárguelo desde el [sitio oficial de Docker](https://www.docker.com/).
2. **Obtener el archivo Docker Compose**:

   - Abra el terminal o la línea de comandos.
   - Cree el directorio `nocobase` y un archivo de configuración Docker Compose.

```bash
mkdir nocobase
cd nocobase
vim docker-compose.yml
```

3. Una vez dentro de `docker-compose.yml`, pegue la siguiente configuración, ajústela según sea necesario y guarde el archivo:

```bash
version: "3"

networks:
  nocobase:
        driver: bridge

services:
  app:
        image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
        networks:
          - nocobase
        depends_on:
          - postgres
        environment:
          # Clave secreta de la aplicación, usada para generar el token de usuario, etc.
          # Si se modifica APP_KEY, los tokens antiguos quedarán invalidados
          # Puede ser cualquier cadena aleatoria; asegúrese de no exponerla
          - APP_KEY=your-secret-key
          # Tipo de base de datos. Soporta postgres, mysql, mariadb, sqlite
          - DB_DIALECT=postgres
          # Host de la base de datos; puede sustituirlo por la IP de su servidor existente
          - DB_HOST=postgres
          # Nombre de la base de datos
          - DB_DATABASE=nocobase
          # Usuario de la base de datos
          - DB_USER=nocobase
          # Contraseña de la base de datos
          - DB_PASSWORD=nocobase
          # Zona horaria
          - TZ=Asia/Shanghai
        volumes:
          - ./storage:/app/nocobase/storage
        ports:
          - "13000:80"
        # init: true

  # Si utiliza un servicio de base de datos existente, no necesita iniciar postgres
  postgres:
        image: registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
        restart: always
        command: postgres -c wal_level=logical
        environment:
          POSTGRES_USER: nocobase
          POSTGRES_DB: nocobase
          POSTGRES_PASSWORD: nocobase
        volumes:
          - ./storage/db/postgres:/var/lib/postgresql/data
        networks:
          - nocobase
```

4. **Iniciar NocoBase**:
   - Desde el directorio `nocobase`, ejecute el siguiente comando para iniciar el servicio:

```bash
docker-compose up -d
```

- Esto descargará las imágenes necesarias e iniciará el servicio NocoBase.

5. **Acceder a NocoBase**:
   - Abra su navegador y acceda a `http://localhost:13000` (puede variar según la configuración) para ver la pantalla de inicio de sesión de NocoBase.

¡Una vez completados estos pasos habrá instalado e iniciado NocoBase con éxito! A continuación podrá seguir el tutorial para empezar a construir su propio sistema de aplicaciones.

---

Con estos pasos, esperamos que se haya familiarizado con la interfaz básica y el proceso de instalación de NocoBase. En el [siguiente capítulo (Capítulo 2: Diseño del sistema de gestión de tareas)](https://www.nocobase.com/cn/tutorials/task-tutorial-system-design) seguiremos explorando las potentes funciones de NocoBase y le ayudaremos a construir aplicaciones ricas en funcionalidades. ¡Adelante con el siguiente paso de su viaje no-code!
