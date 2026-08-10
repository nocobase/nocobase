# Multi-App, Multi-Portal und Multi-Space

NocoBase bietet drei Fähigkeiten: Multi-Portal, Multi-App und Multi-Space.

Sie lösen Probleme auf unterschiedlichen Ebenen und können einzeln oder kombiniert verwendet werden.

## Zentrale Unterschiede

| Fähigkeit | Multi-Portal | Multi-App | Multi-Space |
|------|------|------|------|
| Welches Problem wird gelöst | Mehrere Zugriffseinstiege bereitstellen | Mehrere Geschäftssysteme aufteilen | Geschäftsdaten isolieren |
| Kernfokus | Wo Benutzer einsteigen | Wie das System aufgeteilt wird | Wem die Daten gehören |
| Daten | Gemeinsam genutzt | Standardmäßig unabhängig | Isoliert |
| Seiten und Menüs | Unabhängig | Unabhängig | Gemeinsam genutzt |
| Plugin-Konfiguration | Gemeinsam genutzt | Unabhängig | Gemeinsam genutzt |
| Benutzersystem | Gemeinsam genutzt | Kann über SSO geteilt werden | Gemeinsam genutzt |
| Typische Szenarien | Unterschiedliche Rollen benötigen unterschiedliche Einstiege | Unterschiedliche Geschäftsbereiche werden getrennt verwaltet | Mehrere Organisationen, Filialen oder Mandanten |
| Kombinierbar | Ja | Ja | Ja |

## Multi-Portal

Multi-Portal stellt innerhalb derselben Anwendung mehrere Zugriffseinstiege bereit.

Zum Beispiel:

```text
ERP-Anwendung

├─ Admin-Portal (/v/admin)
├─ Filial-Portal (/v/store)
├─ Händler-Portal (/v/dealer)
└─ Mobiles Portal (/v/mobile)
```

Merkmale:

- Nutzung derselben Anwendung
- Gemeinsame Datennutzung
- Gemeinsame Plugin-Konfiguration
- Seiten und Menüs können unabhängig konfiguriert werden

Geeignet für Szenarien, in denen unterschiedliche Rollen unterschiedliche Einstiege benötigen, zum Beispiel:

- Administratoren
- Mitarbeitende
- Kunden
- Händler

## Multi-App

Multi-App teilt das Geschäft in mehrere unabhängige Anwendungen auf.

Zum Beispiel:

```text
Konzernsystem

├─ CRM
├─ ERP
├─ OA
└─ Analyse
```

Merkmale:

- Jede Anwendung wird unabhängig verwaltet
- Unabhängige Plugin-Konfiguration
- Unabhängige Datenbankverbindung
- Unabhängige Upgrades und Wartung

Geeignet für:

- Die Aufteilung großer Geschäftssysteme
- Kollaborative Entwicklung durch mehrere Teams
- Stapelweise Erstellung von Anwendungen für SaaS-Plattformen
- Unabhängige Anwendungen für verschiedene Kunden

## Multi-Space

Multi-Space isoliert Geschäftsdaten innerhalb derselben Anwendung.

Zum Beispiel:

```text
Filialverwaltungsanwendung

Spaces
├─ Filiale Peking
├─ Filiale Shanghai
└─ Filiale Shenzhen
```

Merkmale:

- Gemeinsame Seiten
- Gemeinsame Menüs
- Gemeinsame Workflows
- Gemeinsame Konfiguration
- Isolierte Daten

Bei Tabellen mit aktiviertem Space-Feld filtert das System die Daten automatisch entsprechend dem aktuellen Space.

Aus Sicht des Benutzers:

- Die Filiale Peking sieht nur ihre eigenen Daten
- Die Filiale Shanghai sieht nur ihre eigenen Daten
- Die Filiale Shenzhen sieht nur ihre eigenen Daten

Trotzdem verwenden alle Filialen weiterhin dasselbe System.

## Beziehung zwischen den drei

Diese drei Fähigkeiten stehen nicht im Widerspruch zueinander. Sie wirken auf unterschiedlichen Ebenen.

Sie können gemeinsam verwendet werden:

```text
Konzernsystem

CRM-Anwendung
├─ Admin-Portal
├─ Vertriebs-Portal
└─ Kunden-Portal

Spaces
├─ Niederlassung Peking
├─ Niederlassung Shanghai
└─ Niederlassung Shenzhen
```

Konzeptionell:

```text
Portal
    ↓
Wo Benutzer in das System einsteigen

App
    ↓
Wie das System aufgeteilt wird

Space
    ↓
Wem die Daten gehören
```

## Wie man auswählt

Wenn Sie nur unterschiedliche Einstiege für unterschiedliche Rollen bereitstellen möchten, wählen Sie **Multi-Portal**.

Wenn Sie Ihr Geschäft in mehrere unabhängige Systeme aufteilen möchten, wählen Sie **Multi-App**.

Wenn Sie Daten für verschiedene Organisationen oder Mandanten innerhalb desselben Systems isolieren möchten, wählen Sie **Multi-Space**.

In realen Projekten werden diese drei Fähigkeiten in der Regel kombiniert verwendet und nicht als gegenseitiger Ersatz.

Kurz gesagt:

> Multi-Portal löst das Einstiegsproblem, Multi-App löst die Systemaufteilung, und Multi-Space löst die Datenisolation.
