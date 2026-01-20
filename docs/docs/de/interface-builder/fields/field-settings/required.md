:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Erforderlich

## Einführung

„Erforderlich“ ist eine gängige Regel für die Formularvalidierung. Sie können diese Eigenschaft direkt in den Feldeinstellungen aktivieren oder ein Feld dynamisch über die Verknüpfungsregeln des Formulars als Pflichtfeld festlegen.

## Wo Sie ein Feld als Pflichtfeld festlegen können

### Sammlung-Feldeinstellungen

Wenn ein Sammlungsfeld als Pflichtfeld festgelegt wird, löst dies eine Backend-Validierung aus. Das Frontend zeigt es standardmäßig ebenfalls als Pflichtfeld an (nicht änderbar).
![20251025175418](https://static-docs.nocobase.com/20251025175418.png)

### Feldeinstellungen

Legen Sie ein Feld direkt als Pflichtfeld fest. Dies eignet sich für Felder, die stets vom Benutzer ausgefüllt werden müssen, wie zum Beispiel Benutzername, Passwort usw.

![20251028222818](https://static-docs.nocobase.com/20251028222818.png)

### Verknüpfungsregeln

Mithilfe der Feldverknüpfungsregeln eines Formularblocks können Sie ein Feld bedingt als Pflichtfeld definieren.

Beispiel: Die Bestellnummer ist ein Pflichtfeld, wenn das Bestelldatum nicht leer ist.

![20251028223004](https://static-docs.nocobase.com/20251028223004.png)

### Workflow