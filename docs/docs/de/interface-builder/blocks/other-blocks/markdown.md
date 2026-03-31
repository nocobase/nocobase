:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Markdown-Block

## Einführung

Ein Markdown-Block kann ohne Bindung an eine Datenquelle verwendet werden. Er nutzt die Markdown-Syntax, um Textinhalte zu definieren, und eignet sich zur Anzeige formatierter Texte.

## Block hinzufügen

Sie können einen Markdown-Block zu einer Seite oder einem Pop-up hinzufügen.

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

Sie können auch einen Inline-Markdown-Block (inline-block) innerhalb von Formular- und Detailblöcken hinzufügen.

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## Template-Engine

Es verwendet die **[Liquid Template-Engine](https://liquidjs.com/tags/overview.html)**, die leistungsstarke und flexible Template-Rendering-Funktionen bietet und es ermöglicht, Inhalte dynamisch zu generieren und individuell anzuzeigen. Mit der Template-Engine können Sie:

- **Dynamische Interpolation**: Verwenden Sie Platzhalter im Template, um Variablen zu referenzieren. Zum Beispiel wird `{{ ctx.user.userName }}` automatisch durch den entsprechenden Benutzernamen ersetzt.
- **Bedingtes Rendering**: Unterstützt Bedingungsanweisungen (`{% if %}...{% else %}`), um je nach Datenstatus unterschiedliche Inhalte anzuzeigen.
- **Schleifen**: Verwenden Sie `{% for item in list %}...{% endfor %}`, um Arrays oder Sammlungen zu durchlaufen und Listen, Tabellen oder wiederholende Module zu generieren.
- **Integrierte Filter**: Bietet eine Vielzahl von Filtern (wie `upcase`, `downcase`, `date`, `truncate` usw.), um Daten zu formatieren und zu verarbeiten.
- **Erweiterbarkeit**: Unterstützt benutzerdefinierte Variablen und Funktionen, wodurch die Templatelogik wiederverwendbar und wartbar wird.
- **Sicherheit und Isolation**: Das Template-Rendering wird in einer Sandbox-Umgebung ausgeführt, um die direkte Ausführung von gefährlichem Code zu verhindern und die Sicherheit zu erhöhen.

Mithilfe der Liquid Template-Engine können Entwickler und Content-Ersteller **auf einfache Weise dynamische Inhalte anzeigen, personalisierte Dokumente generieren und Templates für komplexe Datenstrukturen rendern**, was die Effizienz und Flexibilität erheblich verbessert.

## Variablen verwenden

Markdown auf einer Seite unterstützt gängige Systemvariablen (wie den aktuellen Benutzer, die aktuelle Rolle usw.).

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

Markdown in einem Pop-up für Blockreihenaktionen (oder einer Unterseite) unterstützt hingegen weitere Datenkontextvariablen (wie den aktuellen Datensatz, den aktuellen Pop-up-Datensatz usw.).

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

## QR-Code

QR-Codes können in Markdown konfiguriert werden.

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```