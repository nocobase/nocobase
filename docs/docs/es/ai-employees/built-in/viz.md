:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Empleado de IA · Viz: Analista de Insights

> Genere gráficos y obtenga insights con un solo clic, y deje que los datos hablen por sí mismos.

## 1. ¿Quién es Viz?

**Viz** es un **Analista de Insights de IA** integrado.
Él sabe cómo leer los datos de su página actual (como Leads, Oportunidades, Cuentas), generar automáticamente gráficos de tendencias, gráficos comparativos, tarjetas de KPI y conclusiones concisas, haciendo que el análisis de negocio sea fácil e intuitivo.

No es una herramienta de informes fría, sino un analista que puede entender preguntas y contar historias.

> 💡 ¿Quiere saber «por qué han disminuido las ventas recientemente»?
> Solo necesita decirle una frase a Viz, y él podrá indicarle dónde ocurrió la disminución, cuáles podrían ser las razones y qué pasos puede tomar a continuación.

## 2. Qué puede hacer con Viz

| Capacidad                         | Descripción                                     | Ejemplo                                        |
| :-------------------------------- | :---------------------------------------------- | :--------------------------------------------- |
| 📊 **Generar gráficos automáticamente** | Visualice datos con un solo clic, sin necesidad de escribir SQL | «Generar la tendencia de ventas de este mes»    |
| 🔍 **Descubrir cambios y anomalías**   | Analice las razones de aumentos o disminuciones | «¿En qué es mejor este mes que el anterior?»    |
| 🧭 **Asistir en la toma de decisiones** | Ofrezca sugerencias accionables basadas en datos | «¿En qué canal vale más la pena aumentar el presupuesto?» |
| 🧩 **Perspectivas de datos agregadas** | Compare en múltiples dimensiones como región, producto, fuente | «Mostrar comparación de ingresos por región»    |

Ya sea para revisiones mensuales de negocio, el ROI del canal o embudos de ventas, Viz puede generar gráficos e interpretaciones en segundos.

## 3. Cómo usarlo

### 3.1 Puntos de entrada en la página

*   **Botón superior derecho (Recomendado)**
    En la esquina superior derecha de páginas como Leads, Oportunidades y Cuentas, haga clic en el **icono de Viz** para seleccionar tareas preestablecidas, como:

    *   Conversión y tendencias por etapa
    *   Comparación de canales de origen
    *   Análisis de revisión mensual

    ![Ejemplo en la página de Leads](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

*   **Panel global inferior derecho**
    No importa en qué página se encuentre, puede abrir el panel global de IA y hablar directamente con Viz:

    ```
    Analizar los cambios de ventas en los últimos 90 días
    ```

    Viz utilizará automáticamente el contexto de datos de su página actual.

### 3.2 Método de interacción

Viz admite preguntas en lenguaje natural y puede entender preguntas de seguimiento de varias rondas.
Ejemplo:

```
Hola Viz, genere la tendencia de leads de este mes.
```

```
Mostrar solo el rendimiento de los canales de terceros.
```

```
Entonces, ¿qué región tiene el crecimiento más rápido?
```

Cada pregunta de seguimiento profundizará en los resultados del análisis anterior, sin necesidad de volver a introducir las condiciones de los datos.

## 4. Escenarios de análisis comunes

| Escenario                     | Lo que quiere saber                                 | Resultado de Viz                                  |
| :---------------------------- | :-------------------------------------------------- | :------------------------------------------------ |
| **Revisión mensual**          | ¿En qué es mejor este mes que el anterior?          | Tarjeta de KPI + Gráfico de tendencias + Tres sugerencias de mejora |
| **Desglose del crecimiento**  | ¿El aumento de ingresos se debe a un cambio en el volumen o en el precio? | Gráfico de descomposición de factores + Tabla comparativa |
| **Análisis de canal**         | ¿En qué canal vale más la pena seguir invirtiendo?  | Gráfico de ROI + Curva de retención + Sugerencias |
| **Análisis de embudo**        | ¿Dónde se está estancando el tráfico?               | Gráfico de embudo + Explicación de cuellos de botella |
| **Retención de clientes**     | ¿Qué clientes son los más valiosos?                 | Gráfico de segmentación RFM + Curva de retención  |
| **Evaluación de promociones** | ¿Qué tan efectiva fue la gran promoción?            | Gráfico comparativo + Análisis de elasticidad de precios |

> 📈 Todos los gráficos se generan en formato ECharts válido, con un punto clave por gráfico y acompañados de una breve conclusión.
> Si los datos son insuficientes, Viz lo indicará directamente en lugar de fabricar resultados.

## 5. Consejos para conversar con Viz

| Práctica                          | Efecto                                              |
| :-------------------------------- | :-------------------------------------------------- |
| ✅ **Especifique un rango de tiempo** | «Últimos 30 días», «mes anterior vs. este mes» para mayor precisión |
| ✅ **Especifique dimensiones**      | «Por región/canal/producto» ayuda a alinear las perspectivas |
| ✅ **Concéntrese en las tendencias, no en los detalles** | Viz se destaca en identificar la dirección del cambio y las razones clave |
| ✅ **Use lenguaje natural**       | No necesita sintaxis de comando, solo pregunte como si estuviera chateando |

## 6. ¿Para quién es más adecuado Viz?

| Rol                       | Uso                                             |
| :------------------------ | :---------------------------------------------- |
| **Gerente de ventas**     | Ver tasas de conversión por etapa, rendimiento del canal, resultados del equipo |
| **Especialista en marketing** | Analizar el ROI de la inversión publicitaria, la efectividad de las promociones, la retención de clientes |
| **Analista de operaciones** | Extraer datos rápidamente, descubrir anomalías, validar hipótesis |
| **Dirección**             | Comprender el estado del negocio de un vistazo, obtener señales para la toma de decisiones |

## 7. Sugerencias de uso

1.  **Comience con tareas preestablecidas**
    La demostración oficial tiene tareas comunes integradas, por lo que puede experimentar los resultados directamente sin necesidad de prompts.
    Por ejemplo: Página de Leads → Haga clic en **Viz → Conversión y tendencias por etapa**

2.  **Observe el estilo de salida**
    Cada punto de análisis tiene un gráfico separado y una breve descripción.
    Gráficos claros y texto conciso son la salida estándar de Viz.

3.  **Haga preguntas de seguimiento progresivamente**
    Después de leer el informe de análisis, continúe preguntando «por qué» y «cómo mejorar», y Viz le dará seguimiento automáticamente.

## 8. Resumen

*   Viz = Su asistente de insights de datos
*   No necesita escribir SQL ni configurar gráficos
*   Obtenga un informe de análisis con una sola frase en lenguaje natural
*   Todas las conclusiones se basan en datos reales, claras y creíbles

> Comience con **Leads → Viz → Conversión y tendencias por etapa**,
> ver el primer gráfico es el mejor punto de partida para comprender a este Empleado de IA.