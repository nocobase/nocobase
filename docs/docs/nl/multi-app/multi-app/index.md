---
pkg: '@nocobase/plugin-app-supervisor'
---

# Multi-appbeheer

## Overzicht

NocoBase ondersteunt beheer van meerdere geïsoleerde apps via één toegangspunt met AppSupervisor.


In het begin volstaat één app. Bij groei nemen complexiteit, kosten en isolatiebehoefte toe.


In deze modus draaien meerdere apps in één NocoBase-instantie. Elke app kan eigen DB hebben, maar proces en geheugen worden gedeeld.

![](https://static-docs.nocobase.com/202512231055907.png)


Voor grotere schaal gebruik je een hybride model met Supervisor en meerdere Worker-omgevingen.

![](https://static-docs.nocobase.com/202512231215186.png)
