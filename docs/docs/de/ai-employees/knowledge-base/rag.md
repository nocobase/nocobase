---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "RAG – Retrieval-Augmented Generation"
description: "Aktivieren Sie RAG für KI-Mitarbeiter, konfigurieren Sie Knowledge Base, Retrieval strategy, Top K und Score und steuern Sie den Zugriff auf Wissensdatenbanken über Benutzerrollen."
keywords: "RAG,Retrieval-Augmented Generation,Wissensdatenbank-Abruf,Retrieval strategy,Wissensdatenbank-Berechtigungen,Top K,NocoBase"
---

# RAG-Abruf

## Einführung

In NocoBase ermöglicht **RAG (Retrieval-Augmented Generation)** einem KI-Mitarbeiter, vor der Beantwortung einer Frage relevante Inhalte aus Wissensdatenbanken abzurufen.

Welche Wissensdatenbanken ein KI-Mitarbeiter tatsächlich verwenden kann, ergibt sich sowohl aus seiner `Knowledge Base`-Konfiguration als auch aus den Wissensdatenbank-Berechtigungen der Rollen des aktuellen Benutzers. Nur Wissensdatenbanken, die in beiden Bereichen enthalten sind, werden durchsucht.

## Wissensdatenbanken eines KI-Mitarbeiters konfigurieren

Öffnen Sie die Konfigurationsseite `AI employees`, wählen Sie den KI-Mitarbeiter aus, für den Sie RAG aktivieren möchten, und klicken Sie auf `Edit`. Öffnen Sie im Bearbeitungsbereich den Tab `Knowledge Base` und aktivieren Sie `Enable`.

![](https://static-docs.nocobase.com/ai-employee-knowledge-base-settings-202608171620.png)

Folgende Einstellungen stehen zur Verfügung:

- `Knowledge Base` — Optional. Wenn das Feld leer bleibt, durchsucht der KI-Mitarbeiter alle aktivierten Wissensdatenbanken, auf die die Rollen des aktuellen Benutzers zugreifen dürfen. Wenn Sie Wissensdatenbanken auswählen, werden nur die ausgewählten und für den Benutzer freigegebenen Wissensdatenbanken durchsucht
- `Retrieval strategy` — Legt fest, wann der Abruf aus Wissensdatenbanken ausgeführt wird:
  - `Retrieve on demand` — Der KI-Mitarbeiter ruft Inhalte nur dann ab, wenn er feststellt, dass sie für die aktuelle Frage benötigt werden. Neue KI-Mitarbeiter verwenden diese Strategie standardmäßig; sie wird für die meisten Anwendungsfälle empfohlen
  - `Automatically retrieve for every question` — Der Abruf wird vor jeder Benutzerfrage ausgeführt, bevor diese an den KI-Mitarbeiter gesendet wird. Verwenden Sie diese Option, wenn jede Interaktion von Inhalten aus Wissensdatenbanken abhängt
- `Knowledge Base Prompt` — Legt fest, wie die abgerufenen Inhalte an den KI-Mitarbeiter übergeben werden. `{knowledgeBaseData}` ist ein fester Platzhalter und darf nicht entfernt oder geändert werden
- `Top K` — Die maximale Anzahl der bei jedem Abruf zurückgegebenen Ergebnisse. Der Wertebereich ist 1–100, der Standardwert ist 3
- `Score` — Der minimale Ähnlichkeitswert, den ein Ergebnis erreichen muss. Der Wertebereich ist 0–1, der Standardwert ist 0,6. Ein höherer Wert liefert relevantere Inhalte, kann aber zu weniger Ergebnissen führen

Klicken Sie auf `Submit`, um die Konfiguration zu speichern.

## Berechtigungen für Wissensdatenbanken konfigurieren

Die Auswahl von Wissensdatenbanken für einen KI-Mitarbeiter gewährt nicht automatisch allen Benutzern Zugriff. Öffnen Sie `Users & Permissions / Roles & Permissions`, wählen Sie die dem Benutzer zugewiesene Rolle aus und öffnen Sie anschließend `Permissions / Knowledge bases`.

Aktivieren Sie `Available` für jede Wissensdatenbank, auf die die Rolle zugreifen darf. Um dieser Rolle automatisch Zugriff auf künftig erstellte Wissensdatenbanken zu gewähren, aktivieren Sie `New knowledge bases are allowed by default`.

![](https://static-docs.nocobase.com/knowledge-base-role-permissions-202608171620.png)

:::warning Hinweis

Der für einen KI-Mitarbeiter verfügbare Wissensdatenbank-Bereich ist die Schnittmenge aus seiner `Knowledge Base`-Konfiguration und den Rollenberechtigungen des aktuellen Benutzers. Nicht autorisierte Wissensdatenbanken werden automatisch ausgeschlossen.

:::

## Wenn der Benutzer keinen Zugriff auf Wissensdatenbanken hat

Wenn Wissensdatenbanken für einen KI-Mitarbeiter aktiviert sind, der konfigurierte Bereich sich jedoch nicht mit den Rollenberechtigungen des aktuellen Benutzers überschneidet, antwortet der KI-Mitarbeiter zunächst mit Informationen, die nicht von einer Wissensdatenbank abhängen. Anschließend fügt er einen deutlich sichtbaren Hinweis hinzu, dass wegen fehlender Zugriffsrechte keine Inhalte aus Wissensdatenbanken verwendet wurden und der Benutzer sich bei Bedarf an einen Administrator wenden soll.

![](https://static-docs.nocobase.com/ai-employee-no-knowledge-base-access-side-panel-202608171653.png)

Wenn der Benutzer auf mindestens eine Wissensdatenbank zugreifen kann, für die aktuelle Frage jedoch keine relevanten Inhalte gefunden werden, wird der Hinweis auf fehlende Berechtigungen nicht angezeigt.

## Verwandte Links

- [Wissensdatenbank](./knowledge-base/index.md) — Wissensdatenbanken für den RAG-Abruf erstellen und verwalten
- [Rollen und Berechtigungen](../../users-permissions/acl/permissions.md) — System-, Menü- und Datenzugriff für Rollen konfigurieren
