:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Guía de Ingeniería de Prompts para Agentes de IA

> Desde "cómo escribir" hasta "escribir bien", esta guía le enseña a redactar prompts de alta calidad de forma sencilla, estable y reutilizable.

## 1. Por qué los prompts son cruciales

Un prompt es la "descripción del puesto" para un agente de IA, y determina directamente su estilo, límites y calidad de salida.

**Ejemplo comparativo:**

❌ Prompt poco claro:

```
Usted es un asistente de análisis de datos que ayuda a los usuarios a analizar datos.
```

✅ Prompt claro y controlable:

```
Usted es Viz, un experto en análisis de datos.

Definición del rol
- Estilo: Perspicaz, claro en la expresión, enfocado en la visualización
- Misión: Convertir datos complejos en "historias de gráficos" comprensibles

Flujo de trabajo
1) Comprender los requisitos
2) Generar SQL seguro (usando solo SELECT)
3) Extraer insights
4) Presentar con gráficos

Reglas estrictas
- DEBE: Usar solo SELECT, nunca modificar datos
- SIEMPRE: Generar visualizaciones de gráficos por defecto
- NUNCA: Fabricar o adivinar datos

Formato de salida
Conclusión breve (2-3 frases) + JSON de gráfico ECharts
```

**Conclusión**: Un buen prompt define claramente "quién es, qué debe hacer, cómo hacerlo y con qué estándar", haciendo que el rendimiento de la IA sea estable y controlable.

## 2. La "Fórmula de Oro" de los Nueve Elementos para Prompts

Una estructura probada y eficaz en la práctica:

```
Asignación de nombre + Instrucciones duales + Confirmación simulada + Repetición + Reglas estrictas
+ Información de contexto + Refuerzo positivo + Ejemplos de referencia + Ejemplos negativos (Opcional)
```

### 2.1 Descripción de los elementos

| Elemento                 | ¿Qué problema resuelve?                               | ¿Por qué es efectivo?                               |
| :----------------------- | :---------------------------------------------------- | :-------------------------------------------------- |
| Asignación de nombre     | Aclara la identidad y el estilo                       | Ayuda a la IA a establecer un "sentido de rol"      |
| Instrucciones duales     | Distingue "quién soy" de "qué debo hacer"             | Reduce la confusión de rol                          |
| Confirmación simulada    | Repite la comprensión antes de la ejecución           | Evita desviaciones                                  |
| Repetición               | Los puntos clave aparecen repetidamente               | Aumenta la prioridad                               |
| Reglas estrictas         | MUST/ALWAYS/NEVER                                     | Establece una base                                  |
| Información de contexto  | Conocimientos y restricciones necesarios             | Reduce malentendidos                                |
| Refuerzo positivo        | Guía las expectativas y el estilo                     | Tono y rendimiento más estables                     |
| Ejemplos de referencia   | Proporciona un modelo directo a imitar                | La salida se acerca más a las expectativas          |
| Ejemplos negativos       | Evita errores comunes                                 | Corrige errores, volviéndose más preciso con el uso |

### 2.2 Plantilla de inicio rápido

```yaml
# 1) Asignación de nombre
Usted es [Nombre], un(a) excelente [Rol/Especialidad].

# 2) Instrucciones duales
## Rol
Estilo: [Adjetivo x2-3]
Misión: [Resumen de una frase de la responsabilidad principal]

## Flujo de trabajo de la tarea
1) Comprender: [Punto clave]
2) Ejecutar: [Punto clave]
3) Verificar: [Punto clave]
4) Presentar: [Punto clave]

# 3) Confirmación simulada
Antes de la ejecución, repita su comprensión: "Entiendo que necesita... Lo lograré mediante..."

# 4) Repetición
Requisito principal: [1-2 puntos más críticos] (aparecen al menos dos veces al principio/flujo de trabajo/final)

# 5) Reglas estrictas
DEBE: [Regla inquebrantable]
SIEMPRE: [Principio a seguir siempre]
NUNCA: [Acción explícitamente prohibida]

# 6) Información de contexto
[Conocimiento de dominio necesario/contexto/errores comunes]

# 7) Refuerzo positivo
Usted sobresale en [Habilidad] y es experto en [Especialidad]. Por favor, mantenga este estilo para completar la tarea.

# 8) Ejemplos de referencia
[Proporcione un ejemplo conciso de la "salida ideal"]

# 9) Ejemplos negativos (Opcional)
- [Forma incorrecta] → [Forma correcta]
```

## 3. Ejemplo práctico: Viz (Análisis de datos)

A continuación, combinemos los nueve elementos para crear un ejemplo completo y "listo para usar".

```text
# Asignación de nombre
Usted es Viz, un experto en análisis de datos.

# Instrucciones duales
【Rol】
Estilo: Perspicaz, claro y orientado visualmente
Misión: Convertir datos complejos en "historias de gráficos"

【Flujo de trabajo de la tarea】
1) Comprender: Analizar los requisitos de datos del usuario y el alcance de las métricas
2) Consultar: Generar SQL seguro (consultar solo datos reales, solo SELECT)
3) Analizar: Extraer insights clave (tendencias/comparaciones/proporciones)
4) Presentar: Elegir un gráfico apropiado para una expresión clara

# Confirmación simulada
Antes de la ejecución, repita: "Entiendo que desea analizar [objeto/alcance], y presentaré los resultados mediante [método de consulta y visualización]."

# Repetición
Reiterar: La autenticidad de los datos es la prioridad, calidad sobre cantidad; si no hay datos disponibles, indíquelo con veracidad.

# Reglas estrictas
DEBE: Usar solo consultas SELECT, no modificar ningún dato
SIEMPRE: Generar un gráfico visual por defecto
NUNCA: Fabricar o adivinar datos

# Información de contexto
- ECharts requiere configuración "JSON puro", sin comentarios/funciones
- Cada gráfico debe centrarse en un tema, evite acumular múltiples métricas

# Refuerzo positivo
Usted es experto en extraer conclusiones accionables de datos reales y expresarlas con los gráficos más sencillos.

# Ejemplos de referencia
Descripción (2-3 frases) + JSON de gráfico

Descripción de ejemplo:
Este mes se añadieron 127 nuevos leads, un aumento del 23% mes a mes, principalmente de canales de terceros.

Gráfico de ejemplo:
{
  "title": {"text": "Tendencia de Leads de Este Mes"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Semana1","Semana2","Semana3","Semana4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Ejemplos negativos (Opcional)
- Mezclar idiomas → Mantener la coherencia del idioma
- Gráficos sobrecargados → Cada gráfico debe expresar solo un tema
- Datos incompletos → Indicar con veracidad "No hay datos disponibles"
```

**Puntos clave de diseño**

*   La "autenticidad" aparece varias veces en las secciones de flujo de trabajo, repetición y reglas (recordatorio fuerte).
*   Elija una salida de dos partes "descripción + JSON" para una fácil integración con el frontend.
*   Especifique "SQL de solo lectura" para reducir riesgos.

## 4. Cómo mejorar los prompts con el tiempo

### 4.1 Iteración en cinco pasos

```
Comience con una versión funcional → Pruebe a pequeña escala → Registre problemas → Añada reglas/ejemplos para abordar problemas → Pruebe de nuevo
```

<img src="https://static-docs.nocobase.com/prompt-engineering-guide-2025-11-02-20-19-54.png" alt="Proceso de optimización" width="50%">

Se recomienda probar de 5 a 10 tareas típicas a la vez, completando una ronda en 30 minutos.

### 4.2 Principios y proporciones

*   **Priorizar la guía positiva**: Primero, dígale a la IA lo que debe hacer.
*   **Mejora impulsada por problemas**: Añada restricciones solo cuando surjan problemas.
*   **Restricciones moderadas**: No acumule "prohibiciones" desde el principio.

Proporción empírica: **80% Positivo : 20% Negativo**.

### 4.3 Una optimización típica

**Problema**: Gráficos sobrecargados, poca legibilidad.
**Optimización**:

1.  En "Información de contexto", añada: un tema por gráfico.
2.  En "Ejemplos de referencia", proporcione un "gráfico de una sola métrica".
3.  Si el problema persiste, añada una restricción estricta en "Reglas estrictas/Repetición".

## 5. Técnicas avanzadas

### 5.1 Uso de XML/etiquetas para una estructura más clara (recomendado para prompts largos)

Cuando el contenido supera los 1000 caracteres o puede ser confuso, usar etiquetas para la partición es más estable:

```xml
<Rol>Usted es Dex, un experto en organización de datos.</Rol>
<Estilo>Meticuloso, preciso y organizado.</Estilo>

<Tarea>
Debe completarse en los siguientes pasos:
1. Identificar campos clave
2. Extraer valores de campo
3. Estandarizar formato (Fecha AAAA-MM-DD)
4. Generar JSON
</Tarea>

<Reglas>
DEBE: Mantener la precisión de los valores de campo
NUNCA: Adivinar información faltante
SIEMPRE: Marcar elementos inciertos
</Rules>

<Ejemplo>
{"Nombre":"Juan Pérez","Fecha":"2024-01-15","Monto":5000,"Estado":"Confirmado"}
</Ejemplo>
```

### 5.2 Enfoque en capas de "Contexto + Tarea" (una forma más intuitiva)

*   **Contexto** (estabilidad a largo plazo): Quién es este agente, cuál es su estilo y qué capacidades tiene.
*   **Tarea** (bajo demanda): Qué hacer ahora, en qué métricas centrarse y cuál es el alcance predeterminado.

Esto coincide naturalmente con el modelo "Agente + Tarea" de NocoBase: un contexto fijo con tareas flexibles.

### 5.3 Reutilización modular

Divida las reglas comunes en módulos para combinarlos según sea necesario:

**Módulo de seguridad de datos**

```
DEBE: Usar solo SELECT
NUNCA: Ejecutar INSERT/UPDATE/DELETE
```

**Módulo de estructura de salida**

```
La salida debe incluir:
1) Descripción breve (2-3 frases)
2) Contenido principal (gráfico/datos/código)
3) Sugerencias opcionales (si las hay)
```

## 6. Reglas de oro (conclusiones prácticas)

1.  Una IA debe realizar un solo tipo de trabajo; la especialización es más estable.
2.  Los ejemplos son más efectivos que los eslóganes; proporcione modelos positivos primero.
3.  Use MUST/ALWAYS/NEVER para establecer límites.
4.  Utilice un enfoque orientado a procesos para reducir la incertidumbre.
5.  Comience poco a poco, pruebe más, modifique menos e itere continuamente.
6.  No restrinja demasiado; evite "codificar" el comportamiento.
7.  Registre los problemas y los cambios para crear versiones.
8.  80/20: Primero, explique "cómo hacerlo bien", luego restrinja "qué no hacer mal".

## 7. Preguntas frecuentes

**P1: ¿Cuál es la longitud ideal?**

*   Agente básico: 500–800 caracteres
*   Agente complejo: 800–1500 caracteres
*   No se recomienda >2000 caracteres (puede ser lento y redundante).
    Estándar: Cubra los nueve elementos, pero sin rodeos.

**P2: ¿Qué hacer si la IA no sigue las instrucciones?**

1.  Use MUST/ALWAYS/NEVER para aclarar los límites.
2.  Repita los requisitos clave 2–3 veces.
3.  Use etiquetas/particiones para mejorar la estructura.
4.  Proporcione más ejemplos positivos, menos principios abstractos.
5.  Evalúe si se necesita un modelo más potente.

**P3: ¿Cómo equilibrar la guía positiva y negativa?**
Primero, escriba las partes positivas (rol, flujo de trabajo, ejemplos), luego añada restricciones basándose en los errores, y solo restrinja los puntos que son "repetidamente incorrectos".

**P4: ¿Debería actualizarse con frecuencia?**

*   Contexto (identidad/estilo/capacidades principales): Estabilidad a largo plazo.
*   Tarea (escenario/métricas/alcance): Ajuste según las necesidades del negocio.
*   Cree una nueva versión para cualquier cambio y registre "por qué se cambió".

## 8. Próximos pasos

**Práctica**

*   Elija un rol simple (por ejemplo, asistente de servicio al cliente), escriba una "versión funcional" utilizando los nueve elementos y pruébela con 5 tareas típicas.
*   Encuentre un agente existente, recopile de 3 a 5 problemas reales y realice una pequeña iteración.

**Lectura adicional**

*   [Guía de configuración del administrador de agentes de IA](./admin-configuration.md): Implemente los prompts en la configuración real.
*   Manuales dedicados para cada agente de IA: Consulte las plantillas completas de roles/tareas.

## Conclusión

**Primero, hágalo funcionar; luego, perfeccione.**
Comience con una versión "funcional" y recopile continuamente problemas, añada ejemplos y refine reglas en tareas reales.
Recuerde: **Primero, dígale cómo hacer las cosas bien (guía positiva), luego restrínjale de hacer las cosas mal (restricción moderada).**