:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Eins-zu-Viele

Die Beziehung zwischen einer Klasse und ihren Schülern ist ein Beispiel für eine Eins-zu-Viele-Beziehung: Eine Klasse kann mehrere Schüler haben, aber jeder Schüler gehört nur zu einer Klasse.

ER-Diagramm:

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Feldkonfiguration:

![alt text](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Parameterbeschreibung

### Quellsammlung

Die Quellsammlung, also die Sammlung, in der sich das aktuelle Feld befindet.

### Zielsammlung

Die Zielsammlung, also die Sammlung, mit der verknüpft werden soll.

### Quellschlüssel

Das Feld in der Quellsammlung, auf das der Fremdschlüssel verweist. Es muss eindeutig sein.

### Fremdschlüssel

Das Feld in der Zielsammlung, das verwendet wird, um die Verknüpfung zwischen den beiden Sammlungen herzustellen.

### Zielschlüssel

Das Feld in der Zielsammlung, das zur Anzeige jeder Zeile im Beziehungsblock dient, in der Regel ein eindeutiges Feld.

### ON DELETE

ON DELETE bezieht sich auf die Regeln, die auf Fremdschlüsselverweise in verknüpften Kindersammlungen angewendet werden, wenn Datensätze in der Elternsammlung gelöscht werden. Es ist eine Option, die beim Definieren einer Fremdschlüsselbeschränkung verwendet wird. Gängige ON DELETE-Optionen sind:

- **CASCADE**: Wenn ein Datensatz in der Elternsammlung gelöscht wird, werden alle verknüpften Datensätze in der Kindersammlung automatisch gelöscht.
- **SET NULL**: Wenn ein Datensatz in der Elternsammlung gelöscht wird, werden die Fremdschlüsselwerte in den verknüpften Datensätzen der Kindersammlung auf NULL gesetzt.
- **RESTRICT**: Die Standardoption. Sie verhindert das Löschen eines Datensatzes in der Elternsammlung, wenn verknüpfte Datensätze in der Kindersammlung vorhanden sind.
- **NO ACTION**: Ähnlich wie RESTRICT. Es verhindert das Löschen eines Datensatzes in der Elternsammlung, wenn verknüpfte Datensätze in der Kindersammlung vorhanden sind.