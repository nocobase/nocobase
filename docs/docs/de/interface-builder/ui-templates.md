---
pkg: "@nocobase/plugin-ui-templates"
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/interface-builder/ui-templates).
:::

# UI-Vorlagen

## Einführung

UI-Vorlagen dienen dazu, Konfigurationen beim Erstellen von Benutzeroberflächen wiederzuverwenden, den Aufwand für wiederholte Einstellungen zu reduzieren und bei Bedarf Konfigurationen an mehreren Stellen synchron zu halten.

Derzeit werden folgende Vorlagentypen unterstützt:

- **Block-Vorlage**: Wiederverwendung der gesamten Block-Konfiguration.
- **Feld-Vorlage**: Wiederverwendung der Konfiguration des „Feldbereichs“ in Formular- oder Detail-Blöcken.
- **Popup-Vorlage**: Wiederverwendung der Konfiguration von Popups, die durch Aktionen oder Felder ausgelöst werden.

## Kernkonzepte

### Referenzieren und Kopieren

Es gibt üblicherweise zwei Möglichkeiten, Vorlagen zu verwenden:

- **Referenz**: Mehrere Stellen teilen sich dieselbe Vorlagenkonfiguration. Änderungen an der Vorlage oder an einer der Referenzstellen werden an allen anderen Referenzstellen synchronisiert.
- **Kopie**: Als unabhängige Konfiguration kopieren. Spätere Änderungen beeinflussen sich nicht gegenseitig.

### Als Vorlage speichern

Wenn ein Block oder ein Popup bereits konfiguriert ist, können Sie im Einstellungsmenü die Option `Als Vorlage speichern` wählen und die Speichermethode festlegen:

- **Aktuellen ... in Vorlage umwandeln**: Nach dem Speichern wird die aktuelle Position auf eine Referenz dieser Vorlage umgestellt.
- **Aktuellen ... als Vorlage kopieren**: Erstellt lediglich die Vorlage; die aktuelle Position bleibt unverändert.

## Block-Vorlagen

### Block als Vorlage speichern

1) Öffnen Sie das Einstellungsmenü des Zielblocks und klicken Sie auf `Als Vorlage speichern`.  
2) Geben Sie den `Vorlagenname` und die `Vorlagenbeschreibung` ein und wählen Sie den Speichermodus:
   - **Aktuellen Block in Vorlage umwandeln**: Nach dem Speichern wird der aktuelle Block durch einen `Block-Vorlage`-Block ersetzt (d. h. er referenziert diese Vorlage).
   - **Aktuellen Block als Vorlage kopieren**: Erstellt nur die Vorlage; der aktuelle Block bleibt unverändert.

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Block-Vorlagen verwenden

1) Block hinzufügen → „Andere Blöcke“ → `Block-Vorlage`.  
2) In der Konfiguration wählen Sie:
   - **Vorlage**: Wählen Sie eine Vorlage aus.
   - **Modus**: `Referenz` oder `Kopie`.

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Referenz in Kopie umwandeln

Wenn ein Block eine Vorlage referenziert, können Sie im Einstellungsmenü des Blocks die Option `Referenz in Kopie umwandeln` wählen. Dadurch wird der aktuelle Block in einen regulären Block umgewandelt (die Referenz wird getrennt), und spätere Änderungen haben keine Auswirkungen auf die Vorlage oder andere Referenzen.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Hinweise

- Im Modus **Kopie** werden die UIDs für den Block und seine Unterknoten neu generiert. Einige Konfigurationen, die von UIDs abhängen, müssen möglicherweise neu konfiguriert werden.

## Feld-Vorlagen

Feld-Vorlagen werden verwendet, um die Konfiguration des Feldbereichs (Feldauswahl, Layout und Feldeinstellungen) in **Formular-Blöcken** und **Detail-Blöcken** wiederzuverwenden. Dies vermeidet das wiederholte Hinzufügen von Feldern auf mehreren Seiten oder in mehreren Blöcken.

> Feld-Vorlagen wirken sich nur auf den „Feldbereich“ aus und ersetzen nicht den gesamten Block. Um einen gesamten Block wiederzuverwenden, nutzen Sie bitte die oben beschriebenen Block-Vorlagen.

### Feld-Vorlagen in Formular-/Detail-Blöcken verwenden

1) Wechseln Sie in den Konfigurationsmodus und öffnen Sie das Menü „Felder“ in einem Formular- oder Detail-Block.  
2) Wählen Sie `Feld-Vorlage`.  
3) Wählen Sie eine Vorlage und den Modus: `Referenz` oder `Kopie`.

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Überschreibungs-Hinweis

Wenn im Block bereits Felder vorhanden sind, erscheint bei der Verwendung des Modus **Referenz** normalerweise eine Bestätigungsaufforderung (da die referenzierten Felder den aktuellen Feldbereich ersetzen).

### Referenzierte Felder in Kopie umwandeln

Wenn ein Block eine Feld-Vorlage referenziert, können Sie im Einstellungsmenü des Blocks `Referenzierte Felder in Kopie umwandeln` wählen, um den aktuellen Feldbereich in eine unabhängige Konfiguration umzuwandeln (Referenz trennen).

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Hinweise

- Feld-Vorlagen sind nur für **Formular-Blöcke** und **Detail-Blöcke** verfügbar.
- Wenn die Vorlage und der aktuelle Block an unterschiedliche Sammlungen gebunden sind, wird die Vorlage im Auswahlmenü als nicht verfügbar angezeigt, wobei der Grund angegeben wird.
- Wenn Sie im aktuellen Block „individuelle Anpassungen“ an den Feldern vornehmen möchten, empfiehlt es sich, direkt den Modus **Kopie** zu verwenden oder zuerst die Funktion „Referenzierte Felder in Kopie umwandeln“ auszuführen.

## Popup-Vorlagen

Popup-Vorlagen dienen zur Wiederverwendung einer Reihe von Popup-Oberflächen und Interaktionslogiken. Informationen zu allgemeinen Konfigurationen wie der Öffnungsmethode und der Größe von Popups finden Sie unter [Popup bearbeiten](/interface-builder/actions/action-settings/edit-popup).

### Popup als Vorlage speichern

1) Öffnen Sie das Einstellungsmenü einer Schaltfläche oder eines Feldes, das ein Popup auslösen kann, und klicken Sie auf `Als Vorlage speichern`.  
2) Geben Sie den Vorlagennamen und die Beschreibung ein und wählen Sie den Speichermodus:
   - **Aktuelles Popup in Vorlage umwandeln**: Nach dem Speichern wechselt das aktuelle Popup zur Referenzierung dieser Vorlage.
   - **Aktuelles Popup als Vorlage kopieren**: Erstellt nur die Vorlage; das aktuelle Popup bleibt unverändert.

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Vorlagen in der Popup-Konfiguration verwenden

1) Öffnen Sie die Popup-Konfiguration der Schaltfläche oder des Feldes.  
2) Wählen Sie unter `Popup-Vorlage` eine Vorlage aus, um diese wiederzuverwenden.

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Nutzungsbedingungen (Verfügbarkeitsbereich der Vorlagen)

Popup-Vorlagen stehen im Zusammenhang mit dem Aktionsszenario, das das Popup auslöst. Das Auswahlmenü filtert oder deaktiviert automatisch inkompatible Vorlagen basierend auf dem aktuellen Szenario (Gründe werden angezeigt, wenn Bedingungen nicht erfüllt sind).

| Aktueller Aktionstyp | Verfügbare Popup-Vorlagen |
| --- | --- |
| **Sammlung-Aktion** | Popup-Vorlagen, die durch Sammlung-Aktionen derselben Sammlung erstellt wurden. |
| **Nicht-verknüpfte Datensatz-Aktion** | Popup-Vorlagen, die durch Sammlung-Aktionen oder nicht-verknüpfte Datensatz-Aktionen derselben Sammlung erstellt wurden. |
| **Verknüpfte Datensatz-Aktion** | Popup-Vorlagen, die durch Sammlung-Aktionen oder nicht-verknüpfte Datensatz-Aktionen derselben Sammlung erstellt wurden; oder Popup-Vorlagen, die durch verknüpfte Datensatz-Aktionen exakt desselben Verknüpfungsfeldes erstellt wurden. |

### Popups für Verknüpfungsdaten

Für Popups, die durch Verknüpfungsdaten (Verknüpfungsfelder) ausgelöst werden, gelten spezielle Abgleichsregeln:

#### Strikte Übereinstimmung für Verknüpfungs-Popup-Vorlagen

Wenn eine Popup-Vorlage aus einer **verknüpften Datensatz-Aktion** erstellt wurde (die Vorlage besitzt einen `associationName`), kann diese Vorlage nur von Aktionen oder Feldern mit **exakt demselben Verknüpfungsfeld** verwendet werden.

Beispiel: Eine Popup-Vorlage, die für das Verknüpfungsfeld `Bestellung.Kunde` erstellt wurde, kann nur von anderen Aktionen des Feldes `Bestellung.Kunde` verwendet werden. Sie kann nicht für das Feld `Bestellung.Empfehlungsgeber` verwendet werden (selbst wenn beide auf die Sammlung `Kunde` verweisen).

Dies liegt daran, dass die internen Variablen und Konfigurationen der Verknüpfungs-Popup-Vorlage vom spezifischen Kontext der Verknüpfungsbeziehung abhängen.

#### Verknüpfungs-Aktionen zur Wiederverwendung von Ziel-Sammlungs-Vorlagen

Verknüpfungsfelder oder -aktionen können **nicht-verknüpfte Popup-Vorlagen der Ziel-Sammlung** wiederverwenden (Vorlagen, die durch Sammlung-Aktionen oder nicht-verknüpfte Datensatz-Aktionen erstellt wurden), sofern die Sammlung übereinstimmt.

Beispiel: Das Verknüpfungsfeld `Bestellung.Kunde` kann Popup-Vorlagen der Sammlung `Kunde` verwenden. Dieser Ansatz eignet sich, um dieselbe Popup-Konfiguration über mehrere Verknüpfungsfelder hinweg zu teilen (z. B. ein einheitliches Kundendetails-Popup).

### Referenz in Kopie umwandeln

Wenn ein Popup eine Vorlage referenziert, können Sie im Einstellungsmenü `Referenz in Kopie umwandeln` wählen, um das aktuelle Popup in eine unabhäng