:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Aktions-Verknüpfungsregeln

## Einführung

Aktions-Verknüpfungsregeln ermöglichen es Ihnen, den Status einer Aktion (z. B. Anzeigen, Aktivieren, Ausblenden, Deaktivieren usw.) dynamisch basierend auf bestimmten Bedingungen zu steuern. Durch die Konfiguration dieser Regeln können Sie das Verhalten von Aktionsschaltflächen mit dem aktuellen Datensatz, der Benutzerrolle oder Kontextdaten verknüpfen.

![20251029150224](https://static-docs.nocobase.com/20251029150224.png)

## Verwendung

Wenn die Bedingung erfüllt ist (ohne Bedingung wird standardmäßig bestanden), wird die Ausführung von Eigenschaftseinstellungen oder JavaScript ausgelöst. Konstanten und Variablen werden in der Bedingungsprüfung unterstützt.

![20251030224601](https://static-docs.nocobase.com/20251030224601.png)

Die Regel unterstützt die Änderung von Schaltflächeneigenschaften.

![20251029150452](https://static-docs.nocobase.com/20251029150452.png)

## Konstanten

Beispiel: Bezahlte Bestellungen können nicht bearbeitet werden.

![20251029150638](https://static-docs.nocobase.com/20251029150638.png)

## Variablen

### Systemvariablen

![20251029150014](https://static-docs.nocobase.com/20251029150014.png)

Beispiel 1: Steuern Sie die Sichtbarkeit einer Schaltfläche basierend auf dem aktuellen Gerätetyp.

![20251029151057](https://static-docs.nocobase.com/20251029151057.png)

Beispiel 2: Die Schaltfläche für die Massenaktualisierung im Tabellenkopf des Bestellungsblocks steht nur der Administratorrolle zur Verfügung; andere Rollen können diese Aktion nicht ausführen.

![20251029151209](https://static-docs.nocobase.com/20251029151209.png)

### Kontextvariablen

Beispiel: Die Schaltfläche "Hinzufügen" bei den Bestellungs-Chancen (Beziehungsblock) ist nur aktiviert, wenn der Bestellstatus "Ausstehende Zahlung" oder "Entwurf" ist. In anderen Status wird die Schaltfläche deaktiviert.

![20251029151520](https://static-docs.nocobase.com/20251029151520.png)

![20251029152200](https://static-docs.nocobase.com/20251029152200.png)

Weitere Informationen zu Variablen finden Sie unter [Variablen](/interface-builder/variables).