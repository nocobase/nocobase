:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Viele-zu-Viele

In einem Kurswahlsystem gibt es zwei Entitäten: Studenten und Kurse. Ein Student kann sich für mehrere Kurse einschreiben, und ein Kurs kann von mehreren Studenten belegt werden. Dies bildet eine Viele-zu-Viele-Beziehung. In einer relationalen Datenbank wird zur Darstellung der Viele-zu-Viele-Beziehung zwischen Studenten und Kursen üblicherweise eine Vermittlungs-Sammlung, wie zum Beispiel eine Einschreibungs-Sammlung, verwendet. Diese Sammlung kann festhalten, welche Kurse jeder Student gewählt hat und welche Studenten sich für jeden Kurs eingeschrieben haben. Dieses Design stellt die Viele-zu-Viele-Beziehung zwischen Studenten und Kursen effektiv dar.

ER-Diagramm:

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Feldkonfiguration:

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Parameterbeschreibung

### Quell-Sammlung

Die Quell-Sammlung, also die Sammlung, in der sich das aktuelle Feld befindet.

### Ziel-Sammlung

Die Ziel-Sammlung, also die Sammlung, mit der eine Verknüpfung hergestellt werden soll.

### Vermittlungs-Sammlung

Die Vermittlungs-Sammlung, die verwendet wird, wenn eine Viele-zu-Viele-Beziehung zwischen zwei Entitäten besteht. Die Vermittlungs-Sammlung verfügt über zwei Fremdschlüssel, die zur Aufrechterhaltung der Verknüpfung zwischen den beiden Entitäten dienen.

### Quellschlüssel

Das Feld in der Quell-Sammlung, auf das der Fremdschlüssel verweist. Es muss eindeutig sein.

### Fremdschlüssel 1

Das Feld in der Vermittlungs-Sammlung, das die Verknüpfung mit der Quell-Sammlung herstellt.

### Fremdschlüssel 2

Das Feld in der Vermittlungs-Sammlung, das die Verknüpfung mit der Ziel-Sammlung herstellt.

### Zielschlüssel

Das Feld in der Ziel-Sammlung, auf das der Fremdschlüssel verweist. Es muss eindeutig sein.

### ON DELETE

ON DELETE bezieht sich auf die Regeln, die auf Fremdschlüsselreferenzen in verknüpften Kind-Sammlungen angewendet werden, wenn Datensätze in der Eltern-Sammlung gelöscht werden. Es ist eine Option, die beim Definieren einer Fremdschlüsselbeschränkung verwendet wird. Häufige ON DELETE-Optionen sind:

- **CASCADE**: Wenn ein Datensatz in der Eltern-Sammlung gelöscht wird, werden alle verknüpften Datensätze in der Kind-Sammlung automatisch gelöscht.
- **SET NULL**: Wenn ein Datensatz in der Eltern-Sammlung gelöscht wird, werden die Fremdschlüsselwerte in den verknüpften Datensätzen der Kind-Sammlung auf NULL gesetzt.
- **RESTRICT**: Die Standardoption. Sie verhindert das Löschen eines Datensatzes in der Eltern-Sammlung, wenn verknüpfte Datensätze in der Kind-Sammlung vorhanden sind.
- **NO ACTION**: Ähnlich wie RESTRICT. Sie verhindert das Löschen eines Datensatzes in der Eltern-Sammlung, wenn verknüpfte Datensätze in der Kind-Sammlung vorhanden sind.