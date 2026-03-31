:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Visión General

## Introducción

El plugin de Base de Conocimiento de IA proporciona capacidades de recuperación RAG para los agentes de IA.

Las capacidades de recuperación RAG permiten a los agentes de IA ofrecer respuestas más precisas, profesionales y relevantes para la empresa al responder a las preguntas de los usuarios.

Al utilizar documentos de dominio profesional y empresariales internos, provenientes de la base de conocimiento mantenida por el administrador, se mejora la precisión y la trazabilidad de las respuestas de los agentes de IA.

### ¿Qué es RAG?

RAG (Retrieval Augmented Generation) significa "Generación Aumentada por Recuperación".

-   **Recuperación:** La pregunta del usuario se convierte en un vector mediante un modelo de Embedding (por ejemplo, BERT). Los fragmentos de texto más relevantes (Top-K) se recuperan de la biblioteca de vectores a través de una recuperación densa (similitud semántica) o una recuperación dispersa (coincidencia de palabras clave).
-   **Aumento:** Los resultados de la recuperación se concatenan con la pregunta original para formar un *prompt* aumentado, que luego se inyecta en la ventana de contexto del LLM.
-   **Generación:** El LLM combina el *prompt* aumentado para generar la respuesta final, asegurando su veracidad y trazabilidad.

## Instalación

1.  Vaya a la página de gestión de plugins.
2.  Busque el plugin `AI: Knowledge base` y actívelo.

![20251022224818](https://static-docs.nocobase.com/20251022224818.png)