:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Vektorspeicher

## Einführung

Beim Speichern von Dokumenten in einer Wissensdatenbank werden diese vektorisiert. Ebenso werden beim Abrufen von Dokumenten die Suchbegriffe vektorisiert. Für beide Vorgänge ist ein `Embedding model` erforderlich, um den ursprünglichen Text zu vektorisieren.

Im AI Wissensdatenbank Plugin stellt ein Vektorspeicher die Verknüpfung zwischen einem `Embedding model` und einer Vektordatenbank dar.

## Vektorspeicher-Verwaltung

Um zur Vektorspeicher-Verwaltungsseite zu gelangen, navigieren Sie zur Konfigurationsseite des AI Employees Plugins, klicken Sie auf die Registerkarte `Vector store` und wählen Sie dort `Vector store` aus.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

Klicken Sie auf die Schaltfläche `Add new` oben rechts, um einen neuen Vektorspeicher hinzuzufügen:

- Geben Sie im Eingabefeld `Name` den Namen des Vektorspeichers ein;
- Wählen Sie unter `Vector store` eine bereits konfigurierte Vektordatenbank aus. Siehe auch: [Vektordatenbank](/ai-employees/knowledge-base/vector-database);
- Wählen Sie unter `LLM service` einen bereits konfigurierten LLM Dienst aus. Siehe auch: [LLM Dienst Verwaltung](/ai-employees/quick-start/llm-service);
- Geben Sie im Eingabefeld `Embedding model` den Namen des zu verwendenden `Embedding` Modells ein;

Klicken Sie auf die Schaltfläche `Submit`, um die Vektorspeicher-Informationen zu speichern.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)