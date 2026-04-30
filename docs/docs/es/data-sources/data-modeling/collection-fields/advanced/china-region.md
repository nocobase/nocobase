---
title: "Regiones administrativas de China"
description: "Campo de regiones administrativas de China, soporta selección en cascada de tres niveles (provincia, ciudad, distrito), aplicable a direcciones, lugares de origen, etc."
keywords: "regiones administrativas de China,provincia ciudad distrito,campo de divisiones administrativas,cascada de tres niveles,NocoBase"
---

# Regiones administrativas de China

<PluginInfo name="field-china-region"></PluginInfo>

## Introducción

El campo de regiones administrativas de China se utiliza para almacenar en las Collections información de divisiones administrativas chinas como provincias, ciudades y distritos. El campo se basa en la Collection `chinaRegions` integrada y proporciona un selector en cascada que permite al usuario seleccionar provincia, ciudad y distrito de forma jerárquica en el formulario.

Los escenarios aplicables incluyen:

- Ubicación de registros como clientes, contactos, tiendas, proyectos, etc.
- Información básica de direcciones como lugar de residencia, lugar de origen, región de envío, etc.
- Datos que necesitan ser filtrados o estadísticamente analizados por provincia, ciudad o distrito.

El valor del campo se almacena como un registro relacionado, vinculado por defecto a la Collection `chinaRegions`, y se muestra ordenado según la jerarquía de las divisiones administrativas. Por ejemplo, después de seleccionar "Pekín / Distritos municipales / Distrito de Dongcheng", se mostrará concatenado jerárquicamente como una ruta completa.

## Configuración del campo

![](https://static-docs.nocobase.com/data-source-manager-main-NocoBase-04-29-2026_04_52_PM.png)

Al crear el campo, seleccione "Regiones administrativas de China" como tipo de campo; podrá configurar las siguientes opciones:

| Opción | Descripción |
| --- | --- |
| Niveles de selección | Controla el nivel más profundo seleccionable. Actualmente soporta "Provincia", "Ciudad" y "Distrito"; por defecto es "Distrito". "Calle" y "Pueblo" están deshabilitados en la interfaz. |
| Debe seleccionar hasta el último nivel | Si está activado, el usuario debe seleccionar hasta el nivel más profundo configurado para poder enviar; si no está activado, se puede completar la selección en niveles intermedios. |

## Uso en la interfaz

En el formulario, el campo de regiones administrativas de China se muestra como un selector en cascada:

1. Al abrir el desplegable, se cargan los datos a nivel de provincia.
2. Al expandir una provincia, se cargan bajo demanda las ciudades subordinadas.
3. Al continuar expandiendo una ciudad, se cargan bajo demanda los distritos.
4. Tras guardar, en escenarios de visualización como detalles o tablas, se mostrará jerárquicamente como `Provincia/Ciudad/Distrito`.

El campo soporta configuraciones comunes de formulario, como título del campo, descripción, obligatoriedad, valor por defecto, modo de lectura, etc. En modo de lectura, el campo se mostrará como una ruta de texto, por ejemplo:

```text
Pekín / Distritos municipales / Distrito de Dongcheng
```

![](https://static-docs.nocobase.com/%E7%9C%81%E5%B8%82%E5%8C%BA-04-29-2026_04_54_PM.png)

## Notas

- Actualmente el campo de regiones administrativas de China solo admite la selección de una única ruta; no se admite selección múltiple.
- Por el momento están integrados y habilitados los datos de tres niveles (provincia, ciudad y distrito); las opciones de calle y pueblo no están disponibles temporalmente.
- Al importar, deben rellenarse los nombres exactamente coincidentes con los datos de divisiones administrativas integrados, separados por niveles con `/`.
- Este campo depende de la Collection `chinaRegions` proporcionada por el Plugin; asegúrese de que el Plugin "Campo de regiones administrativas de China" esté activado.
