# Cómo desplegar NocoBase más rápido

Muchos usuarios sienten que la velocidad de acceso al desplegar NocoBase no es la ideal. Esto suele deberse al entorno de red, a la configuración del servidor o a la arquitectura de despliegue. Antes de presentar las técnicas de optimización, mostraremos una referencia de la velocidad de acceso de NocoBase con una configuración normal, para evitar preocupaciones innecesarias.

### Referencia de velocidad de carga normal de NocoBase

A continuación se muestran las velocidades de carga medidas en el entorno de demostración de NocoBase:

- Introducir la URL y entrar por primera vez en la aplicación: aproximadamente 2 segundos.
- Cambiar de página dentro de la aplicación: aproximadamente 50-300 ms.

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/886b8e6afd4eea8fd1ff601fdbaecaf0.mp4">
</video>

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/c240cf4029820f0e4c2bbb58723e2d76.mp4">
</video>

A continuación compartiremos una serie de trucos de despliegue, sencillos pero eficaces. Estos métodos no requieren modificar el código; solo ajustando la configuración del despliegue podrá mejorar de forma notable la velocidad de acceso:

## I. Optimización de red e infraestructura

### 1. Versión del protocolo HTTP: adopte HTTP/2 con facilidad

【Requisitos previos】

- **Es necesario soporte HTTPS**: este es un punto importante. Casi todos los navegadores modernos solo admiten HTTP/2 sobre conexiones HTTPS, por lo que primero debe configurar su certificado SSL.
- **Requisitos del servidor**: necesita un software de servidor que admita HTTP/2, como Nginx 1.9.5+ o Apache 2.4.17+.
- **Versión TLS**: se recomienda usar TLS 1.2 o superior (TLS 1.3 es lo mejor); las versiones SSL antiguas no admiten HTTP/2.

【Aviso】

El protocolo tradicional HTTP/1.1 tiene limitaciones al manejar varias solicitudes: normalmente solo puede gestionar 6-8 conexiones simultáneas, lo que es como hacer cola para comprar entradas y provoca retrasos.
![250409http1](https://static-docs.nocobase.com/250409http1.png)

HTTP/2 emplea la "multiplexación", que permite gestionar varias solicitudes simultáneamente, acelerando enormemente la carga de recursos. El más reciente HTTP/3 ofrece un rendimiento aún mejor en redes inestables.

![250409http2](https://static-docs.nocobase.com/250409http2.png)

【Recomendaciones de optimización】

- Asegúrese de que su servidor web tiene activado el soporte para HTTP/2; en la mayoría de los servidores actuales (Nginx, Caddy, etc.) la configuración es muy sencilla.
- En Nginx basta con añadir el parámetro `http2` después de la directiva listen:

```nginx
listen 443 ssl http2;
```

【Verificación】

En el panel de desarrolladores del navegador, abra la pestaña "Red", haga clic con el botón derecho y marque "Protocolo"; podrá ver la versión del protocolo de la conexión actual:
![20250407145442](https://static-docs.nocobase.com/20250407145442.png)

Según nuestras pruebas, la velocidad mejora aproximadamente un 10 %, y cuando hay muchos bloques y recursos en el sistema la mejora es aún más notable.

### 2. Ancho de banda de red: cuanto más, mejor; con tarifa flexible

【Aviso】

Igual que las autopistas son más fluidas que las carreteras lentas, el ancho de banda determina la eficiencia de la transmisión de datos. La carga inicial de NocoBase requiere descargar un volumen considerable de recursos del frontend; si el ancho de banda es insuficiente, se forma fácilmente un cuello de botella.

【Recomendaciones de optimización】

- Elija un ancho de banda suficiente (si hay muchos usuarios, recomendamos al menos 50 Mbps); no escatime en este recurso clave.
- Recomendamos usar el modo de "facturación por tráfico": muchos proveedores en la nube ofrecen este modo flexible, que permite mayor ancho de banda en horas punta y controla el coste el resto del tiempo.

### 3. Latencia de red y ubicación geográfica del servidor: cerca y rápido

【Aviso】

La latencia es esencialmente el tiempo de espera de la transmisión de datos. Aun con suficiente ancho de banda, si el servidor está demasiado lejos del usuario (por ejemplo, el usuario en China y el servidor en EE. UU.), cada solicitud y respuesta se ralentiza por la distancia.

【Recomendaciones de optimización】

- Despliegue NocoBase tan cerca como sea posible de la región donde están sus principales usuarios.
- Si sus usuarios están repartidos por todo el mundo, considere usar servicios de aceleración global (como Alibaba Cloud Global Acceleration o AWS Global Accelerator) para optimizar el enrutamiento y reducir la latencia.

【Verificación】

Use el comando ping para medir la latencia a servidores en distintas regiones.
Esta es la mejora más significativa: según la región, la velocidad de acceso aumenta entre 1 y 3 veces o más.
12 husos horarios de distancia, 13 segundos:
![20250409130618](https://static-docs.nocobase.com/20250409130618.png)

2 husos horarios de distancia, 8 segundos:
![20250409131039](https://static-docs.nocobase.com/20250409131039.png)

Misma región, alrededor de 3 segundos:
![20250409130928](https://static-docs.nocobase.com/20250409130928.png)

## II. Optimización de la arquitectura de despliegue

### 4. Despliegue del servidor y modo de proxy: elija la arquitectura más adecuada

【Requisitos previos】

- **Permisos del servidor**: necesita permisos de root o sudo para configurar Nginx y servicios similares.
- **Conocimientos básicos**: se requiere algo de conocimiento básico de configuración de servidores; no se preocupe, aquí proporcionaremos ejemplos de configuración concretos.
- **Acceso a puertos**: asegúrese de que el cortafuegos permite el acceso a los puertos 80 (HTTP) y 443 (HTTPS).

【Aviso】

Cuando un usuario accede a NocoBase, la solicitud llega directamente a su servidor. Una forma de despliegue adecuada permite al servidor procesar las solicitudes con más eficiencia y, por tanto, ofrecer respuestas más rápidas.

【Distintas opciones y recomendaciones】

**Iniciar NocoBase sin usar proxy inverso para los recursos estáticos (no recomendado):**

- Desventaja: este método es sencillo, pero su rendimiento es bajo cuando hay alta concurrencia o muchos archivos estáticos; resulta apropiado para desarrollo y pruebas.
- Recomendación: evítelo en lo posible.

> Consulte la "[documentación de instalación](https://docs.nocobase.com/cn/get-started/quickstart)"

Sin proxy inverso, la página principal carga en aproximadamente 6,1 segundos.
![20250409131357](https://static-docs.nocobase.com/20250409131357.png)

**Usar Nginx / Caddy como proxy inverso (muy recomendado):**

- Ventajas: el servidor de proxy inverso gestiona eficazmente las conexiones concurrentes, sirve los archivos estáticos, permite balanceo de carga y configurar HTTP/2 es muy sencillo.
- Recomendación: en producción, una vez desplegada la aplicación (despliegue desde código, create-nocobase-app o imagen Docker), use Nginx o Caddy como proxy inverso.

> Consulte la "[documentación de despliegue](https://docs.nocobase.com/cn/get-started/deployment/production)"

Con proxy Nginx, la página principal carga en aproximadamente 3-4 segundos.
![20250409131541](https://static-docs.nocobase.com/20250409131541.png)

![20250407192453](https://static-docs.nocobase.com/20250407192453.png)

**Despliegue en clúster con balanceo de carga (apropiado para alta concurrencia y alta disponibilidad):**

- Ventajas: al desplegar varias instancias para procesar las solicitudes, se mejora notablemente la estabilidad y la capacidad de concurrencia del sistema.
- Para los detalles del despliegue consulte el **[modo clúster](https://docs-cn.nocobase.com/welcome/getting-started/deployment/cluster-mode)**.

### 5. Acelerar los recursos estáticos con CDN

【Requisitos previos】

- **Dominio**: necesita un dominio registrado y poder gestionar su DNS.
- **Certificado SSL**: la mayoría de los servicios CDN requieren un certificado SSL (puede usar uno gratuito de Let's Encrypt).
- **Selección del servicio**: elija un proveedor CDN apropiado a la región de los usuarios (los usuarios de China continental requieren un CDN con licencia ICP).

【Aviso】

Un CDN (Content Delivery Network) cachea sus recursos estáticos en nodos repartidos por todo el mundo, de modo que los usuarios obtienen los recursos del nodo más cercano, igual que tomar agua del pozo más próximo, reduciendo enormemente la latencia.

Además, la mayor ventaja del CDN es que **alivia notablemente la carga del servidor de aplicaciones y la presión del ancho de banda**. Cuando muchos usuarios acceden a NocoBase a la vez sin CDN, todas las solicitudes de recursos estáticos (JavaScript, CSS, imágenes, etc.) llegan directamente a su servidor, lo que puede provocar falta de ancho de banda, caída del rendimiento o incluso la caída del servidor. Al desviar esas solicitudes a través del CDN, su servidor puede centrarse en la lógica de negocio principal y ofrecer una experiencia más estable a los usuarios.

![202504071845_cdn](https://static-docs.nocobase.com/202504071845_cdn.png)

【Recomendaciones de optimización】 • Configure su servidor para que las solicitudes de recursos estáticos se distribuyan a través del CDN. • Elija un proveedor de CDN adecuado a la región del usuario:

- Usuarios globales: Cloudflare, Akamai, AWS CloudFront.
- Usuarios de China continental: Alibaba Cloud CDN, Tencent Cloud CDN, Baidu Cloud Acceleration. Ejemplo de configuración:

```nginx
# Redirigir los recursos estáticos al dominio CDN
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    rewrite ^(.*)$ https://your-cdn-domain.com$1 permanent;
}
```

Para proyectos pequeños, la versión gratuita de Cloudflare ofrece una buena aceleración CDN:

1. Cree una cuenta en Cloudflare y añada su dominio.
2. Modifique el DNS para que el dominio apunte a los servidores que indica Cloudflare.
3. Configure el nivel de caché adecuado en el panel de control.

**Aviso especial**: aunque sus usuarios estén todos en la misma región, le recomendamos encarecidamente usar un CDN, ya que reduce eficazmente la carga del servidor y mejora la estabilidad general del sistema, especialmente con un tráfico elevado.

## III. Optimización de los recursos estáticos

### 6. Compresión y configuración de caché en el servidor

【Requisitos previos】

- **Recursos de CPU**: la compresión incrementa la carga de CPU del servidor, así que su servidor debe tener capacidad de cómputo suficiente.
- **Soporte de módulos en Nginx**: la compresión Gzip suele estar incluida, pero la compresión Brotli puede requerir instalar un módulo adicional.
- **Permisos de configuración**: necesita poder modificar la configuración del servidor.

【Aviso】

Activando la compresión y una buena política de caché, se reduce significativamente la cantidad de datos transmitidos y las solicitudes repetidas; es como ponerles una "dieta" a sus recursos para que la carga vuele.
![20250409175241](https://static-docs.nocobase.com/20250409175241.png)

【Recomendaciones de optimización】

- La opción más sencilla: usar el CDN gratuito de Cloudflare, que activa Gzip automáticamente.
- Activar Gzip o Brotli; en Nginx la configuración sería:

```nginx
# Activar la compresión Gzip
gzip on;
gzip_comp_level 6;
gzip_min_length 1000;
gzip_proxied any;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Si se admite Brotli, actívelo para una compresión más eficiente
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

• Configurar cabeceras de caché adecuadas para los recursos estáticos, reduciendo las recargas:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
    access_log off;
}
```

### 7. Usar SSL/TLS y optimizar el rendimiento

【Requisitos previos】

- **Certificado SSL**: necesita un certificado SSL válido (puede usar uno gratuito de Let's Encrypt).
- **Permisos de configuración del servidor**: debe poder modificar la configuración SSL.
- **Configuración DNS**: configure resolutores DNS fiables para OCSP Stapling.

【Aviso】

La seguridad siempre es lo primero, pero una mala configuración HTTPS puede aumentar la latencia. He aquí algunos consejos de optimización para garantizar la seguridad sin perder rendimiento.

【Recomendaciones de optimización】

- Use TLS 1.3, la versión actual más rápida. Configuración en Nginx:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
```

- Active OCSP Stapling para reducir el tiempo de validación del certificado:

```nginx
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

- Reutilice la sesión para reducir el tiempo de los handshakes repetidos:

```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

【Resultados de optimización en escenarios transcontinentales】
**Aclaración**: a continuación se muestran los resultados en un escenario transcontinental / con 12 husos horarios de diferencia, esencialmente diferente al escenario local mencionado anteriormente (alrededor de 3 segundos). La latencia que provoca la distancia geográfica es inevitable, pero la optimización aún permite mejorar notablemente la velocidad:

Tras combinar HTTP/2 + caché en CDN + compresión Gzip + compresión Brotli:
Antes (acceso transcontinental), 13 segundos:
![20250409130618](https://static-docs.nocobase.com/20250409130618.png)
Después (acceso transcontinental), 8 segundos:
![20250409173528](https://static-docs.nocobase.com/20250409173528.png)

Este ejemplo muestra que, incluso con una distancia geográfica considerable, las medidas razonables de optimización reducen el tiempo de carga aproximadamente un 40 %, mejorando significativamente la experiencia del usuario.

## IV. Monitorización y diagnóstico de problemas

### 8. Monitorización y análisis básico del rendimiento

【Requisitos previos】

- **Accesibilidad**: el sitio debe ser de acceso público para usar la mayoría de las herramientas en línea de pruebas.
- **Conocimientos básicos**: hay que entender el significado básico de las métricas de rendimiento; no obstante, explicaremos cada métrica clave.

【Aviso】

Si no sabe dónde está el cuello de botella, es difícil optimizar con precisión. Recomendamos usar herramientas gratuitas para supervisar el rendimiento del sitio y localizar los problemas.

【Recomendaciones de optimización】

**Use las siguientes herramientas gratuitas para evaluar el rendimiento:**

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Pingdom](https://tools.pingdom.com/)

**Preste atención a las siguientes métricas clave:**

- Tiempo de carga de la página
- Tiempo de respuesta del servidor
- Tiempo de resolución DNS
- Tiempo del handshake SSL

**Cómo afrontar problemas habituales:**

- ¿La resolución DNS es lenta? Considere cambiar de DNS o activar la prerresolución DNS.
- ¿El handshake SSL es lento? Optimice la configuración SSL y active la reutilización de sesión.
- ¿La respuesta del servidor es lenta? Revise los recursos del servidor y, si es necesario, escale.
- ¿Los recursos estáticos se cargan despacio? Pruebe a implantar CDN y ajuste la política de caché.

## Lista rápida de comprobación para optimizar el despliegue

La siguiente lista le ayuda a comprobar y optimizar rápidamente el despliegue de NocoBase:

1. **Comprobación de la versión HTTP**

   - [ ]  HTTPS activado (requisito previo de HTTP/2)
   - [ ]  HTTP/2 activado
   - [ ]  Si las condiciones lo permiten, considere admitir HTTP/3
2. **Evaluación del ancho de banda**

   - [ ]  Ancho de banda suficiente del servidor (recomendado al menos 10 Mbps; mejor 50 Mbps o más)
   - [ ]  Considere facturar por tráfico en lugar de por ancho de banda fijo
3. **Selección de la ubicación del servidor**

   - [ ]  Ubique el servidor cerca de la región de los usuarios
   - [ ]  Para usuarios globales, considere servicios de aceleración global
4. **Arquitectura de despliegue**

   - [ ]  Use Nginx/Caddy como proxy inverso, separando recursos estáticos y API
   - [ ]  Si es necesario, despliegue varias instancias y use balanceo de carga
5. **Implantación de CDN**

   - [ ]  Acelere los recursos estáticos mediante un CDN
   - [ ]  Configure una política de caché adecuada
   - [ ]  Asegúrese de que el CDN admite HTTP/2 o HTTP/3
6. **Compresión y caché**

   - [ ]  Active la compresión Gzip o Brotli
   - [ ]  Configure cabeceras de caché del navegador adecuadas
7. **Optimización SSL/TLS**

   - [ ]  Use TLS 1.3 para acelerar el handshake
   - [ ]  Active OCSP Stapling
   - [ ]  Configure la reutilización de la sesión SSL
8. **Monitorización del rendimiento**

   - [ ]  Evalúe periódicamente el sitio con herramientas de pruebas
   - [ ]  Supervise las métricas clave (tiempos de carga, respuesta, resolución y handshake)
   - [ ]  Optimice según los problemas detectados

## Preguntas frecuentes

【Pregunta】Mi servidor está desplegado en el extranjero y los usuarios chinos acceden con lentitud, ¿qué puedo hacer?

【Respuesta】Lo mejor es elegir un servidor en la nube ubicado en China y volver a desplegar. Si no es posible cambiarlo, también puede:

1. Acelerar los recursos estáticos con un CDN doméstico chino.
2. Utilizar servicios de aceleración global para optimizar el enrutamiento de red.
3. Activar todas las medidas posibles de compresión y caché.

【Pregunta】¿Por qué la primera carga de mi NocoBase es lenta y luego es rápida?

【Respuesta】Que la primera carga sea lenta es bastante normal, ya que requiere descargar muchos recursos. En nuestra demo oficial, la primera carga suele tardar unos 3 segundos.

Posteriormente, en el día a día, escribir la URL y entrar en la aplicación tarda alrededor de 1-2 segundos, y cambiar de página dentro de la aplicación entre 50-300 ms; con muy poca latencia.

![20250416130719](https://static-docs.nocobase.com/20250416130719.png)

Para los casos en los que el tiempo de carga sea excesivo, todavía hay margen de optimización:

1. Asegurarse de que HTTP/2 está activado.
2. Implementar aceleración mediante CDN.
3. Activar la compresión Gzip/Brotli.
4. Comprobar que el ancho de banda del servidor es suficiente.

【Pregunta】Estoy usando un alojamiento compartido y no puedo modificar la configuración de Nginx, ¿qué hago?

【Respuesta】En este caso las opciones son limitadas, pero le recomendamos:

1. Probar un servicio CDN (como Cloudflare).
2. Optimizar los parámetros que pueda ajustar dentro de la aplicación.
3. Si las condiciones lo permiten, considere migrar a un VPS que admita más configuración personalizada.

---

Aplicando estas estrategias sencillas y prácticas de optimización del despliegue, podrá mejorar significativamente la velocidad de acceso a NocoBase y ofrecer una experiencia más fluida a los usuarios. Muchas medidas de optimización pueden completarse en pocas horas, sin tocar el código, y los resultados son inmediatos.
