# La intención del diseño de `nb proxy`

Si solo hablamos del proceso central, basta con recordar estos 3 comandos:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

En la mayoría de los escenarios, lo que utiliza `nb proxy` para hacer son esencialmente estos tres pasos:

1. Primero use `use` para seleccionar el modo de ejecución del proveedor actual
2. Luego use `generate` para generar la configuración de entrada según el entorno y el nombre de dominio.
3. Finalmente use `reload` para que la configuración surta efecto.

Si está utilizando Caddy, simplemente reemplace `nginx` en el comando con `caddy`. Si Nginx está instalado directamente en la máquina, simplemente reemplace `docker` con `local`.

Esta es también la experiencia que esta capa de `nb proxy` más quiere brindar: no es necesario ingresar primero a los detalles de configuración de Nginx o Caddy, simplemente conecte la entrada de acuerdo con el proceso fijo.

## ¿Por qué es suficiente recordar estos 3 elementos primero?

Porque el problema resuelto por `nb proxy` es en realidad muy convergente: ** Dale a la aplicación una entrada de acceso externo estable. **

Si ya ha visto [Descripción general de la implementación del entorno de producción] (../production/index.md), puede recordarlo por separado de `nb app autostart` de esta manera:

- `nb app autostart` está a cargo de "cómo reanudar la ejecución de la aplicación después de reiniciar la máquina"
- `nb proxy` está a cargo de "cómo la aplicación puede proporcionar acceso externo estable a través de Nginx o Caddy"

Entonces, en el proceso de implementación más común, `nb proxy` no requiere mucha mente. La mayoría de las veces es:

- Seleccionar modo de funcionamiento
- Generar configuración
- La recarga tiene efecto

Suficiente.

## ¿Qué están haciendo estos tres pasos?

### `use`

`use` resuelve el problema de "cómo gestionar el agente actualmente".

Por ejemplo:

- `nb proxy nginx use docker`
- `nb proxy nginx use local`

Puede considerarlo como seleccionar primero el controlador predeterminado del proveedor actual. Los siguientes comandos `start`, `reload` y `status` funcionarán de esta manera.

### `generate`

`generate` resuelve el problema de "representar la configuración de entrada según el entorno actual".

Por ejemplo:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Este paso combinará la información en env con los parámetros requeridos por la capa de entrada para generar una configuración de proxy utilizable. La entrada más crítica aquí suele ser:

- `--env`: qué entorno gestionado por CLI exponer
- `--host`: a qué nombre de dominio vincularse

En otras palabras, `generate` gestiona los productos de configuración, no el estado del proceso.

### `reload`

`reload` resuelve el problema de "hacer que la configuración recién generada sea realmente efectiva".

```bash
nb proxy nginx reload
```

Esta separación tiene un beneficio directo: la generación de configuración y las acciones de proceso no se mezclan. Cuando cambie el nombre de dominio, el puerto o la ruta pública, regenere primero y luego decida hacerlo efectivo. Todo el proceso será más claro.

## ¿Por qué debería diseñarse como `use → generate → reload`?

Porque estos tres pasos corresponden justamente a las tres acciones más estables de la capa de entrada:

- Decide primero cómo ejecutar el agente.
- Luego decide qué entrada generar para qué entorno.
-Finalmente deja que la configuración surta efecto.

Si coloca todos estos pasos en un comando de cuadro negro, parecerá que hay menos comandos en la superficie. Sin embargo, una vez que ocurre un problema, es difícil determinar si el controlador se seleccionó incorrectamente, la configuración no se generó correctamente o el agente no se recargó.

Ahora, después de desmontarlo así, el camino de la investigación será más recto:

- `use` Si está mal, simplemente corta el controlador.
- `generate` es incorrecto, regenerar la configuración.
- La configuración es correcta pero aún no ha surtido efecto, solo `reload`

## ¿Por qué necesitamos un `nb proxy` separado?

Porque lo que `nb proxy` quiere unificar no es un determinado archivo de configuración de Nginx, sino las acciones comunes de la capa de entrada.

Lo que realmente te importa normalmente no es:

-¿En qué ruta se encuentra el archivo de configuración?
- Diferencias de comando entre Nginx y Caddy
- Diferencias operativas entre local y docker.

Lo que más te preocupa es:

- ¿Cómo expongo este entorno?
- ¿Cómo cambio mi nombre de dominio?
- ¿Cómo hago para que la nueva configuración surta efecto?

`nb proxy` es hacer converger estas acciones en el mismo conjunto de entradas CLI. De esta manera, si recuerda primero el proceso central, ya podrá cubrir la mayoría de los escenarios. Solo cuando desee continuar solucionando los detalles o necesite una configuración especial, simplemente mire la página del proveedor.

## En general

- `nb proxy` El uso principal de la mente es `use → generate → reload`
- Para la mayoría de los usuarios, recordar estos 3 comandos es suficiente
- El objetivo de su diseño no es ocultar todos los detalles, sino arreglar primero los procesos más comunes en el nivel de entrada.

Si desea continuar viendo los comandos específicos, puede ir directamente a [`nb proxy`](../../api/cli/proxy/index.md). Si está listo para conectarse a la entrada oficial, también puede continuar mirando [Proxy inverso] (../production/reverse-proxy/index.md).
