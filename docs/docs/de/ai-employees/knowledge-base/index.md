:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Übersicht

## Einführung

Das AI-Wissensdatenbank-Plugin bietet AI-Mitarbeitern RAG-Abruffunktionen.

Durch RAG-Abruffunktionen können AI-Mitarbeiter bei der Beantwortung von Benutzerfragen genauere, professionellere und unternehmensrelevantere Antworten liefern.

Die Verwendung von Fachwissen und internen Unternehmensdokumenten aus der vom Administrator gepflegten Wissensdatenbank erhöht die Genauigkeit und Nachvollziehbarkeit der Antworten von AI-Mitarbeitern.

### Was ist RAG?

RAG (Retrieval Augmented Generation) steht für „Retrieval-Augmented-Generation“ (Abruf-Erweiterte-Generierung).

- **Abruf (Retrieval)**: Die Frage des Benutzers wird von einem Embedding-Modell (z. B. BERT) in einen Vektor umgewandelt. In der Vektordatenbank werden dann die Top-K relevanten Textblöcke durch dichte Suche (semantische Ähnlichkeit) oder dünne Suche (Schlüsselwortabgleich) abgerufen.
- **Erweiterung (Augmentation)**: Die Abrufergebnisse werden mit der ursprünglichen Frage zu einem erweiterten Prompt zusammengeführt und in das Kontextfenster des LLM injiziert.
- **Generierung (Generation)**: Das LLM kombiniert den erweiterten Prompt, um die endgültige Antwort zu generieren und so die Faktizität und Nachvollziehbarkeit sicherzustellen.

## Installation

1. Gehen Sie zur Seite „Plugin-Verwaltung“.
2. Suchen Sie das Plugin `AI: Knowledge base` und aktivieren Sie es.

![20251022224818](https://static-docs.nocobase.com/20251022224818.png)