:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Eins-zu-Eins

In der Beziehung zwischen Mitarbeitern und persönlichen Profilen kann jeder Mitarbeiter nur einen Datensatz für ein persönliches Profil haben, und jeder Datensatz für ein persönliches Profil kann nur einem Mitarbeiter zugeordnet sein. In diesem Fall handelt es sich um eine Eins-zu-Eins-Beziehung.

Der Fremdschlüssel in einer Eins-zu-Eins-Beziehung kann entweder in der Quellsammlung oder in der Zielsammlung platziert werden. Wenn die Beziehung "hat einen" ausdrückt, ist der Fremdschlüssel besser in der Zielsammlung platziert. Wenn sie eine "Zugehörigkeit" darstellt, ist der Fremdschlüssel besser in der Quellsammlung platziert.

Im oben genannten Beispiel, wo ein Mitarbeiter nur ein persönliches Profil hat und das persönliche Profil zum Mitarbeiter gehört, ist es sinnvoll, den Fremdschlüssel in der Sammlung der persönlichen Profile zu platzieren.

## Eins-zu-Eins (Hat einen)

Dies bedeutet, dass ein Mitarbeiter einen Datensatz für ein persönliches Profil besitzt.

ER-Beziehung

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Feldkonfiguration

![alt text](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## Eins-zu-Eins (Gehört zu)

Dies bedeutet, dass ein persönliches Profil zu einem bestimmten Mitarbeiter gehört.

ER-Beziehung

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Feldkonfiguration

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Parameterbeschreibungen

### Source Collection

Die Quellsammlung ist die Sammlung, in der sich das aktuelle Feld befindet.

### Target Collection

Die Zielsammlung ist die Sammlung, mit der eine Beziehung hergestellt wird.

### Foreign Key

Dient dazu, eine Beziehung zwischen zwei Sammlungen herzustellen. In einer Eins-zu-Eins-Beziehung kann der Fremdschlüssel entweder in der Quellsammlung oder in der Zielsammlung platziert werden. Wenn er "hat einen" darstellt, ist der Fremdschlüssel besser in der Zielsammlung platziert; wenn er eine "Zugehörigkeit" darstellt, ist der Fremdschlüssel besser in der Quellsammlung platziert.

### Source Key <- Foreign Key (Fremdschlüssel in der Zielsammlung)

Das vom Fremdschlüssel-Constraint referenzierte Feld muss eindeutig sein. Wenn der Fremdschlüssel in der Zielsammlung platziert ist, bedeutet dies "hat einen".

### Target Key <- Foreign Key (Fremdschlüssel in der Quellsammlung)

Das vom Fremdschlüssel-Constraint referenzierte Feld muss eindeutig sein. Wenn der Fremdschlüssel in der Quellsammlung platziert ist, bedeutet dies "gehört zu".

### ON DELETE

ON DELETE bezieht sich auf die Aktionsregeln für die Fremdschlüsselreferenz in der zugehörigen Kindersammlung, wenn Datensätze aus der Elternsammlung gelöscht werden. Es ist eine Option, die beim Einrichten eines Fremdschlüssel-Constraints definiert wird. Häufige ON DELETE-Optionen sind:

- CASCADE: Wenn ein Datensatz in der Elternsammlung gelöscht wird, werden alle zugehörigen Datensätze in der Kindersammlung automatisch gelöscht.
- SET NULL: Wenn ein Datensatz in der Elternsammlung gelöscht wird, wird der Fremdschlüsselwert in der zugehörigen Kindersammlung auf NULL gesetzt.
- RESTRICT: Die Standardoption, bei der das Löschen eines Datensatzes in der Elternsammlung verweigert wird, wenn zugehörige Datensätze in der Kindersammlung vorhanden sind.
- NO ACTION: Ähnlich wie RESTRICT wird das Löschen eines Datensatzes in der Elternsammlung verweigert, wenn zugehörige Datensätze in der Kindersammlung vorhanden sind.