:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Erweitert

## Einführung

Große Sprachmodelle (LLMs) verfügen oft nicht über die neuesten Daten und haben daher eine schlechte Datenaktualität. Deshalb bieten Online-LLM-Dienstplattformen in der Regel eine Websuchfunktion an. Diese ermöglicht es der KI, vor der Beantwortung einer Anfrage Informationen mithilfe von Tools zu suchen und dann basierend auf diesen Suchergebnissen zu antworten.

Die KI-Mitarbeiter wurden an die Websuchfunktion verschiedener Online-LLM-Dienstplattformen angepasst. Sie können die Websuchfunktion in der Modellkonfiguration der KI-Mitarbeiter und in Unterhaltungen aktivieren.

## Websuchfunktion aktivieren

Gehen Sie zur Konfigurationsseite des KI-Mitarbeiter-Plugins und klicken Sie auf den Tab `AI employees`, um zur Verwaltungsseite der KI-Mitarbeiter zu gelangen.

![20251021225643](https://static-docs.nocobase.com/20251021225643.png)

Wählen Sie den KI-Mitarbeiter aus, für den Sie die Websuchfunktion aktivieren möchten, klicken Sie auf die Schaltfläche `Edit`, um die Bearbeitungsseite des KI-Mitarbeiters aufzurufen.

![20251022114043](https://static-docs.nocobase.com/20251022114043.png)

Im Tab `Model settings` aktivieren Sie den Schalter `Web Search` und klicken Sie auf die Schaltfläche `Submit`, um die Änderungen zu speichern.

![20251022114300](https://static-docs.nocobase.com/20251022114300.png)

## Websuchfunktion in Unterhaltungen nutzen

Nachdem ein KI-Mitarbeiter die Websuchfunktion aktiviert hat, erscheint ein „Web“-Symbol im Eingabefeld der Unterhaltung. Die Websuche ist standardmäßig aktiviert; Sie können darauf klicken, um sie zu deaktivieren.

![20251022115110](https://static-docs.nocobase.com/20251022115110.png)

Wenn die Websuche aktiviert ist, zeigt die Antwort des KI-Mitarbeiters die Websuchergebnisse an.

![20251022115502](https://static-docs.nocobase.com/20251022115502.png)

## Unterschiede bei den Websuch-Tools der verschiedenen Plattformen

Derzeit hängt die Websuchfunktion der KI-Mitarbeiter von der jeweiligen Online-LLM-Dienstplattform ab, weshalb die Benutzererfahrung variieren kann. Die spezifischen Unterschiede sind wie folgt:

| Plattform  | Websuche | Tools | Echtzeit-Antwort mit Suchbegriffen | Gibt externe Links als Referenzen in der Antwort zurück |
| --------- | -------- | ----- | -------------------------------- | ------------------------------------------------------ |
| OpenAI    | ✅        | ✅     | ✅                                | ✅                                                      |
| Gemini    | ✅        | ❌     | ❌                                | ✅                                                      |
| Dashscope | ✅        | ✅     | ❌                                | ❌                                                      |
| Deepseek  | ❌        | ❌     | ❌                                | ❌                                                      |