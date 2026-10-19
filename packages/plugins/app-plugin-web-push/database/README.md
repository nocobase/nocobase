# Web Push database

The migration creates the encrypted, owner-bound `webPushSubscriptions` collection and its endpoint and owner indexes. It has no required seed data. Migrations are immutable after release; later changes use a new migration. Applications importing existing subscriptions own the data migration from their old purpose and table.
