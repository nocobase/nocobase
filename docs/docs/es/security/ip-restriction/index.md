---
pkg: "@nocobase/plugin-ip-restriction"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Restricciones de IP

## Introducción

NocoBase permite a los administradores configurar listas blancas o negras para las IP de acceso de los usuarios, con el fin de restringir conexiones de red externas no autorizadas o bloquear direcciones IP maliciosas conocidas, reduciendo así los riesgos de seguridad. También permite a los administradores consultar los registros de denegación de acceso para identificar IP de riesgo.

## Reglas de configuración

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

### Modos de filtrado de IP

- **Lista negra**: Cuando la IP de acceso de un usuario coincide con una IP de la lista, el sistema **denegará** el acceso; las IP no coincidentes se **permiten** por defecto.
- **Lista blanca**: Cuando la IP de acceso de un usuario coincide con una IP de la lista, el sistema **permitirá** el acceso; las IP no coincidentes se **deniegan** por defecto.

### Lista de IP

Se utiliza para definir las direcciones IP a las que se permite o deniega el acceso al sistema. Su función específica depende del modo de filtrado de IP seleccionado. Permite introducir direcciones IP o segmentos de red CIDR, separando varias direcciones con comas o saltos de línea.

## Consultar registros

Después de que se deniega el acceso a un usuario, la IP de acceso se escribe en los registros del sistema, y el archivo de registro correspondiente se puede descargar para su análisis.

![2025-01-17-13-33-51-20250117133351](https://static-docs.nocobase.com/2025-01-17-13-33-51-20250117133351.png)

Ejemplo de registro:

![2025-01-14-14-42-06-20250114144205](https://static-docs.nocobase.com/2025-01-14-14-42-06-20250114144205.png)

## Recomendaciones de configuración

### Recomendaciones para el modo de lista negra

- Añada direcciones IP maliciosas conocidas para prevenir posibles ataques de red.
- Revise y actualice regularmente la lista negra, eliminando las direcciones IP no válidas o que ya no necesiten ser bloqueadas.

### Recomendaciones para el modo de lista blanca

- Añada direcciones IP de redes internas de confianza (como segmentos de red de oficina) para garantizar un acceso seguro a los sistemas centrales.
- Evite incluir direcciones IP asignadas dinámicamente en la lista blanca para evitar interrupciones en el acceso.

### Recomendaciones generales

- Utilice segmentos de red CIDR para simplificar la configuración, como usar 192.168.0.0/24 en lugar de añadir direcciones IP individuales.
- Realice copias de seguridad periódicas de las configuraciones de la lista de IP para recuperarse rápidamente de operaciones erróneas o fallos del sistema.
- Supervise regularmente los registros de acceso para identificar IP anómalas y ajuste la lista negra o blanca de inmediato.