---
pkg: '@nocobase/plugin-ai'
title: 'Usar Lina y HY-MT1.5-1.8B local para traducir entradas de localización'
description: 'Desplegar HY-MT1.5 GGUF con llama-server y configurarlo para que Lina traduzca entradas de localización de NocoBase por lotes.'
keywords: 'Lina,localization,HY-MT,GGUF,llama-server,OpenAI compatible,AI translation,NocoBase'
---

# Usar Lina y HY-MT1.5-1.8B local para traducir entradas de localización

Esta guía describe una práctica de traducción de localización: desplegar localmente un modelo pequeño especializado en traducción, exponerlo como servicio compatible con OpenAI y configurarlo para que Lina traduzca entradas de localización de NocoBase por lotes.

## Resumen

Esta guía usa:

- Modelo: `tencent/HY-MT1.5-1.8B-GGUF`
- Servicio de inferencia: `llama-server`
- Integración: OpenAI-compatible API
- Empleado de IA: Lina
- Punto de entrada: Localization Management

:::info{title=Nota}
HY-MT1.5-1.8B es un modelo pequeño especializado en traducción. Es más adecuado para entradas cortas, textos de interfaz y traducción por lotes que un modelo de chat general.
:::

## Requisitos previos

- El plugin **Gestión de Localización** está habilitado.
- El idioma de destino está habilitado.
- Las entradas de localización se han sincronizado.
- La máquina local o servidor puede ejecutar `llama-server`.
- El servicio NocoBase puede acceder a la dirección HTTP de `llama-server`.

## Desplegar HY-MT GGUF

### Instalar llama.cpp

En macOS puede usar Homebrew:

```bash
brew install llama.cpp
```

También puede usar un binario precompilado o compilar llama.cpp desde el código fuente. Lo importante es que `llama-server` esté disponible.

### Iniciar un servicio compatible con OpenAI

Inicie el servicio con el modelo GGUF de Hugging Face:

```bash
llama-server \
  -hf tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M \
  --host 0.0.0.0 \
  --port 8000 \
  -c 2048 \
  -np 4
```

| Parámetro | Descripción |
| --- | --- |
| `-hf` | Carga el modelo desde Hugging Face. |
| `--host` | Dirección de escucha del servicio. |
| `--port` | Puerto HTTP del servicio. |
| `-c` | Longitud de contexto. Las entradas suelen ser cortas, por lo que `2048` suele bastar. |
| `-np` | Número de slots paralelos. Ajuste según la máquina. |

## Probar el servicio del modelo

Después de iniciar, compruebe el estado del servicio:

```bash
curl http://127.0.0.1:8000/health
```

Luego pruebe la traducción mediante la API compatible con OpenAI:

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M",
    "messages": [
      {
        "role": "user",
        "content": "Translate the following text into Chinese. Output only the translated result without any additional explanation:\n\nSave"
      }
    ]
  }'
```

Si usa un archivo local, cambie `model` al nombre real del modelo expuesto por el servicio.

## Configurar un servicio LLM en NocoBase

Vaya a `System Settings -> AI Employees -> LLM service` y agregue un servicio LLM.

| Ajuste | Ejemplo |
| --- | --- |
| Proveedor | OpenAI (completions) |
| Título | HY-MT Local |
| Base URL | `http://127.0.0.1:8000/v1` |
| API Key | Si `llama-server` no usa autenticación, puede usar `dummy`. |
| Modelos habilitados | `tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M` |

Después de configurar, use `Test flight` para verificar el modelo.

:::info{title=Consejo}
Si NocoBase se ejecuta en Docker, `127.0.0.1` apunta al propio contenedor. Use la IP del host, la red del contenedor o `host.docker.internal`.
:::

## Configurar el modelo dedicado de Lina

Abra Lina en `System Settings -> AI Employees -> AI employees` y cambie a `Model settings`.

1. Active `Enable dedicated model configuration`.
2. Seleccione el modelo HY-MT local en `Models`.
3. Guarde la configuración.

Después de esto, Lina usará este modelo para la traducción de localización y evitará cambiar a modelos de chat generales.

## Configurar la concurrencia de traducción

La concurrencia de traducción se controla con `AI_LOCALIZATION_CONCURRENCY`:

```bash
AI_LOCALIZATION_CONCURRENCY=10
```

- Predeterminado: `10`
- Mínimo: `1`
- Máximo: `20`
- Los valores fuera del rango usan el predeterminado.

La mejor concurrencia depende de CPU, GPU, memoria, cuantización y `llama-server -np`. Empiece bajo y aumente solo si es estable.

## Ejecutar la traducción de localización

Vaya a `System Management -> Localization Management`.

1. Cambie al idioma de destino.
2. Haga clic en `Synchronize` para sincronizar entradas.
3. Haga clic en el avatar de Lina.
4. Elija según sea necesario:
   - `Incremental translation`: traduce entradas que aún no tienen traducción.
   - `Selected translation`: traduce las entradas seleccionadas en la tabla.
   - `Full translation`: traduce todas las entradas del idioma actual.
5. Revise cantidad, proveedor y modelo en el diálogo de confirmación.
6. Si elige traducción incremental o completa, seleccione el alcance de traducción:
   - `All`
   - `Built-in entries`: entradas del sistema y plugins.
   - `Custom entries`: nombres de rutas, nombres de colecciones y campos, y contenido de UI.
7. Ajuste los idiomas de traducción de referencia si es necesario. La traducción incremental y completa configuran idiomas de referencia por separado para entradas integradas y personalizadas; la traducción seleccionada solo muestra una configuración general de idiomas de referencia.
8. Confirme para crear la tarea asíncrona.
9. Al finalizar, revise y publique las traducciones.

Empiece con `Selected translation` para algunas entradas y compruebe estilo y velocidad.

## Cómo Lina construye solicitudes de traducción

Lina construye solicitudes a partir de entradas y traducciones de referencia. Para entradas cortas usa referencias existentes para mejorar la consistencia:

- Las entradas integradas usan traducciones chinas como referencia predeterminada y japonés como referencia alternativa.
- Las entradas personalizadas usan el idioma predeterminado del sistema como referencia predeterminada y chino como referencia alternativa.
- Los usuarios pueden ajustar el idioma predeterminado y el idioma alternativo en el diálogo de confirmación de la tarea.
- El sistema usa primero la traducción de referencia en el idioma predeterminado. Si no existe, intenta usar el idioma alternativo.
- Los resultados se escriben en el idioma de destino, pero no se publican automáticamente.

La semántica del prompt es similar a:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Solución de problemas

- Si no hay progreso, compruebe si `llama-server` recibió solicitudes. Si tarda demasiado, reduzca `AI_LOCALIZATION_CONCURRENCY`, `llama-server -np` y `llama-server -c`.
- Si el modelo devuelve explicaciones en lugar de traducciones, pruebe el mismo prompt con `curl` y reduzca parámetros de muestreo como temperature.
- Si NocoBase no puede conectar, compruebe `/v1` en Base URL, red, firewall, dirección del contenedor y que `llama-server` siga ejecutándose.

## Revisión antes de publicar

Después de la traducción con IA, revise antes de publicar:

- Filtre por módulo y revise menús, botones, campos y estados.
- Revise variables, marcadores, etiquetas HTML y símbolos de formato.
- Compruebe la consistencia de términos de negocio.
- Si se sobrescriben traducciones integradas, resincronice y seleccione `Reset system built-in entry translations`. Para contribuir traducciones, consulte [Translation Contribution](/get-started/translations).
- Publique primero en un entorno de prueba y luego sincronice a producción.

## Referencias

- [tencent/HY-MT1.5-1.8B-GGUF](https://huggingface.co/tencent/HY-MT1.5-1.8B-GGUF)
- [llama-server documentation](https://www.mintlify.com/ggml-org/llama.cpp/inference/server)
- [Lina](/ai-employees/built-in/lina)
