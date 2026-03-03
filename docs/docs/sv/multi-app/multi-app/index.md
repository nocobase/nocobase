---
pkg: '@nocobase/plugin-app-supervisor'
---

# Hantering av flera applikationer

## Översikt

NocoBase kan hantera flera isolerade applikationer från en gemensam ingång med AppSupervisor.


I början räcker ofta en app. När verksamheten växer ökar komplexitet, kostnad och behov av isolering.


I detta läge körs flera appar i samma NocoBase-instans; databaser kan vara separata men process och minne delas.

![](https://static-docs.nocobase.com/202512231055907.png)


För större skala används hybridläge med Supervisor och flera Worker-miljöer.

![](https://static-docs.nocobase.com/202512231215186.png)
