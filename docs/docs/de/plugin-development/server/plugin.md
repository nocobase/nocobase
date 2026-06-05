:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Plugin

In NocoBase bietet das Server-Plugin eine modulare Möglichkeit, die serverseitige Funktionalität zu erweitern und anzupassen. Entwickler können die `Plugin`-Klasse von `@nocobase/server` erweitern, um Ereignisse, APIs, Berechtigungskonfigurationen und andere benutzerdefinierte Logik in verschiedenen Lebenszyklusphasen zu registrieren.

## Plugin-Klasse

Die grundlegende Struktur einer Plugin-Klasse sieht wie folgt aus:

```ts
import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}

  async handleSyncMessage(message: Record<string, any>) {}

  static async staticImport() {}
}

export default PluginHelloServer;
```

## Lebenszyklus

Die Lebenszyklusmethoden eines Plugins werden in der folgenden Reihenfolge ausgeführt. Jede Methode hat ihren spezifischen Ausführungszeitpunkt und Zweck:

| Lebenszyklusmethode | Ausführungszeitpunkt | Beschreibung |
|---------------------|----------------------|--------------|
| **staticImport()**  | Vor dem Laden des Plugins | Eine statische Klassenmethode, die in der Initialisierungsphase ausgeführt wird, die unabhängig vom Anwendungs- oder Plugin-Zustand ist. Sie dient zur Initialisierung von Aufgaben, die nicht von Plugin-Instanzen abhängen. |
| **afterAdd()**      | Direkt nach dem Hinzufügen des Plugins zum Plugin-Manager | Die Plugin-Instanz wurde erstellt, aber nicht alle Plugins sind vollständig initialisiert. Hier können grundlegende Initialisierungsarbeiten durchgeführt werden. |
| **beforeLoad()**    | Vor der Ausführung aller `load()`-Methoden der Plugins | Zu diesem Zeitpunkt können Sie auf alle **aktivierten Plugin-Instanzen** zugreifen. Dies eignet sich für die Registrierung von Datenbankmodellen, die Überwachung von Datenbankereignissen, die Registrierung von Middleware und andere vorbereitende Arbeiten. |
| **load()**          | Beim Laden des Plugins | Die `load()`-Methoden werden erst ausgeführt, nachdem alle `beforeLoad()`-Methoden der Plugins abgeschlossen sind. Dies eignet sich für die Registrierung von Ressourcen, API-Schnittstellen, Diensten und anderer Kern-Geschäftslogik. |
| **install()**       | Bei der erstmaligen Aktivierung des Plugins | Wird nur einmal ausgeführt, wenn das Plugin zum ersten Mal aktiviert wird. Im Allgemeinen dient es zur Initialisierung von Datenbanktabellenstrukturen, zum Einfügen von Initialdaten und anderer Installationslogik. |
| **afterEnable()**   | Nach der Aktivierung des Plugins | Wird jedes Mal ausgeführt, wenn das Plugin aktiviert wird. Kann verwendet werden, um geplante Aufgaben zu starten, Cron-Jobs zu registrieren, Verbindungen herzustellen und andere Aktionen nach der Aktivierung durchzuführen. |
| **afterDisable()**  | Nach der Deaktivierung des Plugins | Wird ausgeführt, wenn das Plugin deaktiviert wird. Kann zur Bereinigung von Ressourcen, zum Beenden von Aufgaben, zum Schließen von Verbindungen und anderen Bereinigungsarbeiten verwendet werden. |
| **remove()**        | Beim Entfernen des Plugins | Wird ausgeführt, wenn das Plugin vollständig entfernt wird. Dient zum Schreiben der Deinstallationslogik, wie z.B. dem Löschen von Datenbanktabellen oder dem Bereinigen von Dateien. |
| **handleSyncMessage(message)** | Nachrichtensynchronisation in einer Multi-Node-Bereitstellung | Wenn die Anwendung im Multi-Node-Modus läuft, dient diese Methode zur Verarbeitung von Nachrichten, die von anderen Nodes synchronisiert wurden. |

### Beschreibung der Ausführungsreihenfolge

Der typische Ausführungsablauf der Lebenszyklusmethoden:

1.  **Statische Initialisierungsphase**: `staticImport()`
2.  **Anwendungsstartphase**: `afterAdd()` → `beforeLoad()` → `load()`
3.  **Erste Plugin-Aktivierungsphase**: `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4.  **Zweite Plugin-Aktivierungsphase**: `afterAdd()` → `beforeLoad()` → `load()`
5.  **Plugin-Deaktivierungsphase**: `afterDisable()` wird ausgeführt, wenn das Plugin deaktiviert wird.
6.  **Plugin-Entfernungsphase**: `remove()` wird ausgeführt, wenn das Plugin entfernt wird.

## app und zugehörige Mitglieder

Bei der Plugin-Entwicklung können Sie über `this.app` auf verschiedene APIs der Anwendungsinstanz zugreifen. Dies ist die zentrale Schnittstelle zur Erweiterung der Plugin-Funktionalität. Das `app`-Objekt enthält verschiedene Funktionsmodule des Systems. Entwickler können diese Module in den Lebenszyklusmethoden des Plugins verwenden, um Geschäftsanforderungen umzusetzen.

### app-Mitgliederliste

| Mitgliedername      | Typ/Modul           | Hauptzweck |
|---------------------|---------------------|------------|
| **logger**          | `Logger`            | Zum Protokollieren von Systemereignissen. Unterstützt verschiedene Protokollebenen (info, warn, error, debug) für eine einfache Fehlerbehebung und Überwachung. Weitere Informationen finden Sie unter [Logger](./logger.md). |
| **db**              | `Database`          | Bietet ORM-Schicht-Operationen, Modellregistrierung, Ereignisüberwachung, Transaktionskontrolle und andere datenbankbezogene Funktionen. Weitere Informationen finden Sie unter [Datenbank](./database.md). |
| **resourceManager** | `ResourceManager`   | Dient zur Registrierung und Verwaltung von REST-API-Ressourcen und Operations-Handlern. Weitere Informationen finden Sie unter [Ressourcenverwaltung](./resource-manager.md). |
| **acl**             | `ACL`               | Die Zugriffskontrollschicht dient zur Definition von Berechtigungen, Rollen und Ressourcenzugriffsrichtlinien, um eine feingranulare Berechtigungssteuerung zu ermöglichen. Weitere Informationen finden Sie unter [ACL](./acl.md). |
| **cacheManager**    | `CacheManager`      | Verwaltet den systemweiten Cache und unterstützt verschiedene Cache-Backends wie Redis und In-Memory-Cache, um die Anwendungsleistung zu verbessern. Weitere Informationen finden Sie unter [Cache](./cache.md). |
| **cronJobManager**  | `CronJobManager`    | Dient zur Registrierung, zum Starten und zur Verwaltung von geplanten Aufgaben. Unterstützt die Konfiguration über Cron-Ausdrücke. Weitere Informationen finden Sie unter [Geplante Aufgaben](./cron-job-manager.md). |
| **i18n**            | `I18n`              | Bietet Internationalisierungsunterstützung mit mehrsprachigen Übersetzungs- und Lokalisierungsfunktionen, damit Plugins mehrere Sprachen unterstützen können. Weitere Informationen finden Sie unter [Internationalisierung](./i18n.md). |
| **cli**             | `CLI`               | Verwaltet die Kommandozeilen-Schnittstelle, registriert und führt benutzerdefinierte Befehle aus und erweitert die NocoBase CLI-Funktionalität. Weitere Informationen finden Sie unter [Kommandozeile](./command.md). |
| **dataSourceManager** | `DataSourceManager` | Verwaltet mehrere Datenquellen-Instanzen und deren Verbindungen, um Szenarien mit mehreren Datenquellen zu unterstützen. Weitere Informationen finden Sie unter [Datenquellenverwaltung](./collections.md). |
| **pm**              | `PluginManager`     | Der Plugin-Manager dient zum dynamischen Laden, Aktivieren, Deaktivieren und Entfernen von Plugins sowie zur Verwaltung von Plugin-Abhängigkeiten. |

> Hinweis: Detaillierte Informationen zur Verwendung der einzelnen Module finden Sie in den entsprechenden Dokumentationskapiteln.