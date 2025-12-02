:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Pop-up bearbeiten

## Einführung

Alle Aktionen und Felder, die beim Anklicken ein Pop-up öffnen, bieten die Möglichkeit, dessen Öffnungsart, Größe und weitere Eigenschaften zu konfigurieren.

![20251027212617](https://static-docs.nocobase.com/20251027212617.png)

![20251027212800](https://static-docs.nocobase.com/20251027212800.png)

## Öffnungsart

- Drawer

![20251027212832](https://static-docs.nocobase.com/20251027212832.png)

- Dialog

![20251027212905](https://static-docs.nocobase.com/20251027212905.png)

- Unterseite

![20251027212940](https://static-docs.nocobase.com/20251027212940.png)

## Pop-up-Größe

- Groß
- Mittel (Standard)
- Klein

## Pop-up UID

Der „Pop-up UID“ ist die UID der Komponente, die das Pop-up öffnet. Er entspricht auch dem `viewUid`-Segment in der aktuellen Adressleiste unter `view/:viewUid`. Sie können ihn schnell über die Aktion „Pop-up UID kopieren“ im Einstellungsmenü des auslösenden Feldes oder Buttons abrufen.

![popup-copy-uid-20251102](https://static-docs.nocobase.com/popup-copy-uid-20251102.png)

Durch das Festlegen des Pop-up UID wird die Wiederverwendung von Pop-ups ermöglicht.

### Internes Pop-up (Standard)
- Der „Pop-up UID“ entspricht der UID des aktuellen Aktions-Buttons (standardmäßig wird die UID dieses Buttons verwendet).

### Externes Pop-up (Wiederverwendung eines bestehenden Pop-ups)
- Geben Sie im Feld „Pop-up UID“ die UID eines anderen auslösenden Buttons (d.h. die Pop-up UID) ein, um dieses Pop-up an anderer Stelle wiederzuverwenden.
- Typische Anwendung: Mehrere Seiten/Blöcke teilen sich dieselbe Pop-up-Oberfläche und -Logik, um doppelte Konfigurationen zu vermeiden.
- Bei Verwendung eines externen Pop-ups sind einige Optionen schreibgeschützt und können nicht geändert werden (siehe unten).

## Weitere zugehörige Einstellungen

- `Data source / Collection`: Schreibgeschützt. Dieses Feld zeigt die Datenquelle und die Sammlung an, an die das Pop-up gebunden ist. Standardmäßig wird die Sammlung des aktuellen Blocks verwendet. Im externen Pop-up-Modus werden die Einstellungen des Ziel-Pop-ups übernommen und können nicht geändert werden.
- `Association name`: Optional. Dieses Feld wird verwendet, um das Pop-up über ein Assoziationsfeld zu öffnen und wird nur angezeigt, wenn ein Standardwert vorhanden ist. Im externen Pop-up-Modus werden die Einstellungen des Ziel-Pop-ups übernommen und können nicht geändert werden.
- `Source ID`: Dieses Feld erscheint nur, wenn `Association name` festgelegt ist. Standardmäßig wird die `sourceId` des aktuellen Kontexts verwendet, kann aber bei Bedarf in eine Variable oder einen festen Wert geändert werden.
- `filterByTk`: Kann leer sein, eine optionale Variable oder ein fester Wert, um die im Pop-up geladenen Datensätze einzuschränken.

![popup-config-20251102](https://static-docs.nocobase.com/popup-config-20251102.png)