:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Ereignisse

Der NocoBase-Server löst während des Anwendungslebenszyklus, des Plugin-Lebenszyklus und bei Datenbankoperationen entsprechende Ereignisse aus. Plugin-Entwickler können diese Ereignisse abonnieren, um Erweiterungslogik, automatisierte Abläufe oder benutzerdefinierte Verhaltensweisen zu implementieren.

Das Ereignissystem von NocoBase ist hauptsächlich in zwei Ebenen unterteilt:

- **`app.on()` - Ereignisse auf Anwendungsebene**: Abonnieren Sie Lebenszyklusereignisse der Anwendung, wie zum Beispiel Start, Installation oder das Aktivieren von Plugins.
- **`db.on()` - Ereignisse auf Datenbankebene**: Abonnieren Sie Vorgangsereignisse auf Datenmodellebene, wie zum Beispiel das Erstellen, Aktualisieren oder Löschen von Datensätzen.

Beide erben von Node.js' `EventEmitter` und unterstützen die Standard-Schnittstellen `.on()`, `.off()` und `.emit()`. NocoBase erweitert die Unterstützung zudem um `emitAsync`, um Ereignisse asynchron auszulösen und darauf zu warten, dass alle Listener ihre Ausführung abgeschlossen haben.

## Wo Sie Ereignis-Listener registrieren

Ereignis-Listener sollten in der Regel in der `beforeLoad()`-Methode des Plugins registriert werden. Dies stellt sicher, dass die Ereignisse bereits während der Ladephase des Plugins bereitstehen und die nachfolgende Logik korrekt darauf reagieren kann.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Anwendungereignisse abonnieren
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase wurde gestartet');
    });

    // Datenbankereignisse abonnieren
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`Neuer Beitrag: ${model.get('title')}`);
      }
    });
  }
}
```

## Anwendungereignisse abonnieren mit `app.on()`

Anwendungereignisse dienen dazu, Änderungen im Lebenszyklus der NocoBase-Anwendung und ihrer Plugins zu erfassen. Sie eignen sich gut für Initialisierungslogik, die Registrierung von Ressourcen oder die Erkennung von Plugin-Abhängigkeiten.

### Häufige Ereignistypen

| Ereignisname | Auslösezeitpunkt | Typische Verwendung |
|---|---|---|
| `beforeLoad` / `afterLoad` | Vor / nach dem Laden der Anwendung | Ressourcen registrieren, Konfiguration initialisieren |
| `beforeStart` / `afterStart` | Vor / nach dem Start des Dienstes | Aufgaben starten, Startprotokolle ausgeben |
| `beforeInstall` / `afterInstall` | Vor / nach der Anwendungsinstallation | Daten initialisieren, Vorlagen importieren |
| `beforeStop` / `afterStop` | Vor / nach dem Stoppen des Dienstes | Ressourcen bereinigen, Status speichern |
| `beforeDestroy` / `afterDestroy` | Vor / nach der Anwendungszerstörung | Cache löschen, Verbindungen trennen |
| `beforeLoadPlugin` / `afterLoadPlugin` | Vor / nach dem Laden des Plugins | Plugin-Konfiguration ändern oder Funktionalität erweitern |
| `beforeEnablePlugin` / `afterEnablePlugin` | Vor / nach dem Aktivieren des Plugins | Abhängigkeiten prüfen, Plugin-Logik initialisieren |
| `beforeDisablePlugin` / `afterDisablePlugin` | Vor / nach dem Deaktivieren des Plugins | Plugin-Ressourcen bereinigen |
| `afterUpgrade` | Nach Abschluss des Anwendungs-Upgrades | Datenmigration oder Kompatibilitätskorrekturen durchführen |

Beispiel: Anwendung-Start-Ereignis abonnieren

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 NocoBase-Dienst wurde gestartet!');
});
```

Beispiel: Plugin-Ladeereignis abonnieren

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Plugin ${plugin.name} wurde geladen`);
});
```

## Datenbankereignisse abonnieren mit `db.on()`

Datenbankereignisse können verschiedene Datenänderungen auf Modellebene erfassen. Sie eignen sich gut für Audits, Synchronisierungen, das automatische Ausfüllen von Feldern und andere Operationen.

### Häufige Ereignistypen

| Ereignisname | Auslösezeitpunkt |
|---|---|
| `beforeSync` / `afterSync` | Vor / nach der Synchronisierung der Datenbankstruktur |
| `beforeValidate` / `afterValidate` | Vor / nach der Datenvalidierung |
| `beforeCreate` / `afterCreate` | Vor / nach dem Erstellen von Datensätzen |
| `beforeUpdate` / `afterUpdate` | Vor / nach dem Aktualisieren von Datensätzen |
| `beforeSave` / `afterSave` | Vor / nach dem Speichern (einschließlich Erstellen und Aktualisieren) |
| `beforeDestroy` / `afterDestroy` | Vor / nach dem Löschen von Datensätzen |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | Nach Operationen, die verknüpfte Daten enthalten |
| `beforeDefineCollection` / `afterDefineCollection` | Vor / nach dem Definieren von Sammlungen |
| `beforeRemoveCollection` / `afterRemoveCollection` | Vor / nach dem Entfernen von Sammlungen |

Beispiel: Ereignis nach dem Erstellen von Daten abonnieren

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('Daten wurden erstellt!');
});
```

Beispiel: Ereignis vor dem Aktualisieren von Daten abonnieren

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('Daten werden aktualisiert!');
});
```