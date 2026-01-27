:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Command – Kommandozeile

In NocoBase verwenden Sie Befehle (Commands), um anwendungs- oder pluginbezogene Operationen in der Kommandozeile auszuführen. Dazu gehören beispielsweise das Starten von Systemaufgaben, das Ausführen von Migrations- oder Synchronisationsoperationen, das Initialisieren von Konfigurationen oder die Interaktion mit laufenden Anwendungsinstanzen. Entwickler können für Plugins eigene Befehle definieren und diese über das `app`-Objekt registrieren. In der CLI werden diese dann im Format `nocobase <command>` ausgeführt.

## Befehlstypen

In NocoBase unterscheidet man zwei Arten der Befehlsregistrierung:

| Typ | Registrierungsmethode | Muss das Plugin aktiviert sein? | Typische Szenarien |
|------|------------|---------------------------------|--------------------|
| Dynamischer Befehl | `app.command()` | ✅ Ja | Befehle für Plugin-Geschäftslogik |
| Statischer Befehl | `Application.registerStaticCommand()` | ❌ Nein | Installations-, Initialisierungs- und Wartungsbefehle |

## Dynamische Befehle

Verwenden Sie `app.command()`, um Plugin-Befehle zu definieren. Diese Befehle können nur ausgeführt werden, nachdem das Plugin aktiviert wurde. Die Befehlsdateien sollten im Plugin-Verzeichnis unter `src/server/commands/*.ts` abgelegt werden.

#### Beispiel

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

#### Beschreibung

- `app.command('echo')`: Definiert einen Befehl mit dem Namen `echo`.  
- `.option('-v, --version')`: Fügt dem Befehl eine Option hinzu.  
- `.action()`: Definiert die Ausführungslogik des Befehls.  
- `app.version.get()`: Ruft die aktuelle Anwendungsversion ab.

#### Befehl ausführen

```bash
nocobase echo
nocobase echo -v
```

## Statische Befehle

Verwenden Sie `Application.registerStaticCommand()` zur Registrierung. Statische Befehle können ausgeführt werden, ohne dass Plugins aktiviert werden müssen, und eignen sich daher ideal für Installations-, Initialisierungs-, Migrations- oder Debugging-Aufgaben. Die Registrierung erfolgt in der `staticImport()`-Methode der Plugin-Klasse.

#### Beispiel

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

#### Befehl ausführen

```bash
nocobase echo
nocobase echo --version
```

#### Beschreibung

- `Application.registerStaticCommand()` registriert Befehle, bevor die Anwendung instanziiert wird.  
- Statische Befehle werden in der Regel verwendet, um globale Aufgaben auszuführen, die unabhängig vom Status der Anwendung oder des Plugins sind.

## Command API

Befehlsobjekte bieten drei optionale Hilfsmethoden, um den Ausführungskontext eines Befehls zu steuern:

| Methode | Zweck | Beispiel |
|------|------|------|
| `ipc()` | Kommunikation mit laufenden Anwendungsinstanzen (via IPC) | `app.command('reload').ipc().action()` |
| `auth()` | Überprüfung der korrekten Datenbankkonfiguration | `app.command('seed').auth().action()` |
| `preload()` | Vorladen der Anwendungskonfiguration (führt `app.load()` aus) | `app.command('sync').preload().action()` |

#### Konfigurationsbeschreibung

- **`ipc()`**  
  Standardmäßig werden Befehle in einer neuen Anwendungsinstanz ausgeführt.  
  Nach der Aktivierung von `ipc()` interagieren Befehle über die Interprozesskommunikation (IPC) mit der aktuell laufenden Anwendungsinstanz. Dies ist ideal für Echtzeit-Operationsbefehle (z. B. das Aktualisieren des Caches oder das Senden von Benachrichtigungen).

- **`auth()`**  
  Überprüft vor der Befehlsausführung, ob die Datenbankkonfiguration verfügbar ist.  
  Wenn die Datenbankkonfiguration falsch ist oder die Verbindung fehlschlägt, wird der Befehl nicht fortgesetzt. Dies wird häufig für Aufgaben verwendet, die Datenbank-Schreib- oder Leseoperationen beinhalten.

- **`preload()`**  
  Lädt die Anwendungskonfiguration vor der Ausführung des Befehls vor, was der Ausführung von `app.load()` entspricht.  
  Dies ist geeignet für Befehle, die von der Konfiguration oder dem Plugin-Kontext abhängen.

Weitere API-Methoden finden Sie unter [AppCommand](/api/server/app-command).

## Häufige Beispiele

#### Standarddaten initialisieren

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Initialized default admin user.');
  });
```

#### Cache für laufende Instanz neu laden (IPC-Modus)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

#### Statische Registrierung des Installationsbefehls

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```