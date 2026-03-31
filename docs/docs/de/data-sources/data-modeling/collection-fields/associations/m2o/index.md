:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Viele-zu-Eins

Stellen Sie sich eine Bibliotheksdatenbank mit zwei Entitäten vor: Büchern und Autoren. Ein Autor kann mehrere Bücher schreiben, aber jedes Buch hat (meistens) nur einen Autor. In diesem Fall besteht eine Viele-zu-Eins-Beziehung zwischen Autoren und Büchern. Mehrere Bücher können demselben Autor zugeordnet sein, aber jedes Buch kann nur einen Autor haben.

ER-Diagramm:

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Feldkonfiguration:

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Parameterbeschreibung

### Quell-Sammlung

Die Quell-Sammlung ist die Sammlung, in der sich das aktuelle Feld befindet.

### Ziel-Sammlung

Die Ziel-Sammlung ist die Sammlung, mit der die Verknüpfung hergestellt wird.

### Fremdschlüssel

Das Feld in der Quell-Sammlung, das verwendet wird, um die Verknüpfung zwischen den beiden Sammlungen herzustellen.

### Zielschlüssel

Das Feld in der Ziel-Sammlung, auf das der Fremdschlüssel verweist. Es muss eindeutig sein.

### ON DELETE

ON DELETE bezieht sich auf die Regeln, die auf Fremdschlüsselreferenzen in verknüpften Kind-Sammlungen angewendet werden, wenn Datensätze in der Eltern-Sammlung gelöscht werden. Es ist eine Option, die beim Definieren einer Fremdschlüssel-Einschränkung verwendet wird. Gängige ON DELETE-Optionen sind:

- **CASCADE**: Wenn ein Datensatz in der Eltern-Sammlung gelöscht wird, werden alle verknüpften Datensätze in der Kind-Sammlung automatisch ebenfalls gelöscht.
- **SET NULL**: Wenn ein Datensatz in der Eltern-Sammlung gelöscht wird, werden die Fremdschlüsselwerte in den verknüpften Datensätzen der Kind-Sammlung auf NULL gesetzt.
- **RESTRICT**: Dies ist die Standardoption. Sie verhindert das Löschen eines Datensatzes in der Eltern-Sammlung, wenn verknüpfte Datensätze in der Kind-Sammlung existieren.
- **NO ACTION**: Ähnlich wie RESTRICT verhindert diese Option das Löschen eines Datensatzes in der Eltern-Sammlung, wenn verknüpfte Datensätze in der Kind-Sammlung vorhanden sind.