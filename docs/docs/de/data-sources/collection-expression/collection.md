---
title: "Ausdruckstabelle"
description: "Die Ausdruckstabelle dient zur Berechnung dynamischer Ausdrücke in Workflows. Sie speichert Berechnungsregeln und Formeln, unterstützt Felder aus verschiedenen Datenmodellen als Variablen und kann mit Geschäftsdaten verknüpft verwendet werden."
keywords: "Ausdruckstabelle,dynamische Ausdrücke,Workflow-Ausdrücke,Berechnungsregeln,Formeln,NocoBase"
---

# Ausdruckstabelle

## Eine „Ausdruck“-Vorlagentabelle erstellen

Bevor Sie den Knoten für die Berechnung dynamischer Ausdrücke in einem Workflow verwenden, müssen Sie zunächst im Datenbankverwaltungstool eine „Ausdruck“-Vorlagentabelle erstellen, in der verschiedene Ausdrücke gespeichert werden:

![Ausdruck-Vorlagentabelle erstellen](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Ausdrucksdaten eingeben

Erstellen Sie anschließend einen Tabellenblock für diese Vorlagentabelle und fügen Sie einige Formeldaten hinzu. Jede Datenzeile in der „Ausdruck“-Vorlagentabelle kann als eine Berechnungsregel für ein bestimmtes Tabellendatenmodell verstanden werden. Für jede Formeldatenzeile können Feldwerte aus den Datenmodellen verschiedener Datentabellen als Variablen verwendet und unterschiedliche Ausdrücke als Berechnungsregeln formuliert werden. Selbstverständlich können auch unterschiedliche Berechnungs-Engines verwendet werden.

![Ausdrucksdaten eingeben](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Hinweis}
Nach dem Erstellen der Formeln müssen die Geschäftsdaten noch mit den Formeln verknüpft werden. Da es umständlich wäre, jede Zeile mit Geschäftsdaten direkt mit einer Formeldatenzeile zu verknüpfen, verwenden wir normalerweise eine Metadatentabelle mit Kategorien und verknüpfen diese mit der Formeltabelle in einer Viele-zu-eins-Beziehung (oder Eins-zu-eins-Beziehung). Anschließend werden die Geschäftsdaten in einer Viele-zu-eins-Beziehung mit den Kategorie-Metadaten verknüpft. Beim Erstellen von Geschäftsdaten muss dann nur noch ein bestimmter Kategorie-Metadatensatz angegeben werden, woraufhin die entsprechenden Formeldaten bei der späteren Verwendung über diesen Verknüpfungspfad gefunden und verwendet werden können.
:::

## Die entsprechenden Daten im Workflow laden

Erstellen Sie am Beispiel eines Datensatzereignisses einen Workflow, der beim Erstellen einer Bestellung ausgelöst wird und die mit der Bestellung verknüpften Produktdaten sowie die zugehörigen Ausdrucksdaten vorladen muss:

![Triggerkonfiguration für Datensatzereignis](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)