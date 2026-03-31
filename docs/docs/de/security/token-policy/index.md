---
pkg: '@nocobase/plugin-auth'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Token-Sicherheitsrichtlinie

## Einführung

Die Token-Sicherheitsrichtlinie ist eine funktionale Konfiguration, die zum Schutz der Systemsicherheit und zur Verbesserung der Benutzererfahrung dient. Sie umfasst drei Hauptkonfigurationselemente: „Sitzungsgültigkeitsdauer“, „Token-Gültigkeitsdauer“ und „Zeitlimit für die Aktualisierung abgelaufener Tokens“.

## Konfigurationszugang

Den Konfigurationszugang finden Sie unter `Plugin-Einstellungen` - `Sicherheit` - `Token-Richtlinie`:

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

## Sitzungsgültigkeitsdauer

**Definition:**

Die Sitzungsgültigkeitsdauer bezeichnet die maximale Zeitspanne, die das System einem Benutzer nach dem Login erlaubt, eine aktive Sitzung aufrechtzuerhalten.

**Funktion:**

Wird die Sitzungsgültigkeitsdauer überschritten, erhält der Benutzer beim nächsten Zugriff auf das System eine 401-Fehlerantwort. Anschließend leitet das System den Benutzer zur erneuten Authentifizierung auf die Login-Seite weiter.
Beispiel:
Ist die Sitzungsgültigkeitsdauer auf 8 Stunden eingestellt, läuft die Sitzung 8 Stunden nach dem Login des Benutzers ab, sofern keine weiteren Interaktionen stattfinden.

**Empfohlene Einstellungen:**

- Für Szenarien mit kurzfristigen Operationen: Empfohlen sind 1-2 Stunden, um die Sicherheit zu erhöhen.
- Für Szenarien mit langfristiger Arbeit: Kann auf 8 Stunden eingestellt werden, um den geschäftlichen Anforderungen gerecht zu werden.

## Token-Gültigkeitsdauer

**Definition:**

Die Token-Gültigkeitsdauer bezeichnet die Lebensdauer jedes Tokens, das das System während der aktiven Sitzung eines Benutzers ausstellt.

**Funktion:**

Wenn ein Token abläuft, stellt das System automatisch ein neues Token aus, um die Sitzungsaktivität aufrechtzuerhalten.
Jedes abgelaufene Token darf nur einmal aktualisiert werden.

**Empfohlene Einstellungen:**

Aus Sicherheitsgründen wird empfohlen, die Dauer auf 15 bis 30 Minuten einzustellen.
Anpassungen können je nach Szenario vorgenommen werden. Zum Beispiel:
- Für Szenarien mit hoher Sicherheit: Die Token-Gültigkeitsdauer kann auf 10 Minuten oder weniger verkürzt werden.
- Für Szenarien mit geringem Risiko: Die Token-Gültigkeitsdauer kann angemessen auf 1 Stunde verlängert werden.

## Zeitlimit für die Aktualisierung abgelaufener Tokens

**Definition:**

Das Zeitlimit für die Aktualisierung abgelaufener Tokens bezeichnet das maximale Zeitfenster, innerhalb dessen ein Benutzer nach Ablauf eines Tokens durch eine Aktualisierungsoperation ein neues Token erhalten kann.

**Merkmale:**

Wird das Aktualisierungszeitlimit überschritten, muss sich der Benutzer erneut anmelden, um ein neues Token zu erhalten.
Die Aktualisierungsoperation verlängert nicht die Sitzungsgültigkeitsdauer, sondern generiert lediglich ein neues Token.

**Empfohlene Einstellungen:**

Aus Sicherheitsgründen wird empfohlen, die Dauer auf 5 bis 10 Minuten einzustellen.