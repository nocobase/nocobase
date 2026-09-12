---
title: "Vorlagendruck – Formatierung von Medienfeldern"
description: "Formatierer für Medienfelder im Vorlagendruck: attachment und signature dienen zur Ausgabe von Anhang-Bildern und Handschriftunterschriften in Vorlagen."
keywords: "Vorlagendruck,Medienfelder,attachment,signature,NocoBase"
---

### Formatierung von Medienfeldern

#### 1. :attachment

##### Syntaxbeschreibung

Gibt Bilder aus einem Anhangsfeld aus. Die Variable kann üblicherweise direkt aus der „Feldliste" kopiert werden.

##### Beispiel

```text
{d.contractFiles[0].id:attachment()}
```

##### Ergebnis

Gibt das entsprechende Anhangsbild aus.

#### 2. :signature

##### Syntaxbeschreibung

Gibt das mit dem Handschriftunterschriftsfeld verknüpfte Unterschriftsbild aus. Die Variable kann üblicherweise direkt aus der „Feldliste" kopiert werden.

##### Beispiel

```text
{d.customerSignature:signature()}
```

##### Ergebnis

Gibt das entsprechende Handschriftunterschriftsbild aus.

> **Hinweis:** Für Anhangsfelder und Handschriftunterschriftsfelder wird empfohlen, die Variable direkt aus der Feldliste in der „Vorlagenkonfiguration" zu kopieren, um Tippfehler zu vermeiden.
