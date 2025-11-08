develop-cluster-node-2-noco-app  | 2025-08-04 09:10:43 [info]  HandleRow completed, 0.39ms                                                                                   
develop-cluster-node-2-noco-app  | 2025-08-04 09:10:43 [info]  Processed 71000/100000 records (71%), elapsed time: 78.05s, estimated remaining: 31.88s                       
develop-cluster-node-2-noco-app  | 2025-08-04 09:10:43 [error] Export failed: Connection terminated unexpectedly error={"name":"SequelizeDatabaseError","parent":{"sql":"SELECT \"created_at\" AS \"createdAt\", \"updated_at\" AS \"updatedAt\", \"id\", \"title\", \"number\", \"sub_title\" AS \"subTitle\", \"email\", \"content\", \"published_at\" AS \"publishedAt\", \"a\", \"b\", \"c\", \"d\", \"created_by_id\" AS \"createdById\", \"updated_by_id\" AS \"updatedById\" FROM \"public\".\"test\" AS \"test\" ORDER BY \"test\".\"id\" ASC NULLS LAST LIMIT 200 OFFSET 71000;"},"original":{"sql":"SELECT \"created_at\" AS \"createdAt\", \"updated_at\" AS \"updatedAt\", \"id\", \"title\", \"number\", \"sub_title\" AS \"subTitle\", \"email\", \"content\", \"published_at\" AS \"publishedAt\", \"a\", \"b\", \"c\", \"d\", \"created_by_id\" AS \"createdById\", \"updated_by_id\" AS \"updatedById\" FROM \"public\".\"test\" AS \"test\" ORDER BY \"test\".\"id\" ASC NULLS LAST LIMIT 200 OFFSET 71000;"},"sql":"SELECT \"created_at\" AS \"createdAt\",\"updated_at\" AS \"updatedAt\", \"id\", \"title\", \"number\", \"sub_title\" AS \"subTitle\", \"email\", \"content\", \"published_at\" AS \"publishedAt\", \"a\", \"b\", \"c\", \"d\", \"created_by_id\" AS \"createdById\", \"updated_by_id\" AS \"updatedById\" FROM \"public\".\"test\" AS \"test\" ORDER BY \"test\".\"id\" ASC NULLS LAST LIMIT 200 OFFSET 71000;","parameters":{}}

{
    "name": "SequelizeDatabaseError",
    "parent": {
        "sql": "SELECT \"created_at\" AS \"createdAt\", \"updated_at\" AS \"updatedAt\", \"id\", \"title\", \"number\", \"sub_title\" AS \"subTitle\", \"email\", \"content\", \"published_at\" AS \"publishedAt\", \"a\", \"b\", \"c\", \"d\", \"created_by_id\" AS \"createdById\", \"updated_by_id\" AS \"updatedById\" FROM \"public\".\"test\" AS \"test\" ORDER BY \"test\".\"id\" ASC NULLS LAST LIMIT 200 OFFSET 71000;"
    },
    "original": {
        "sql": "SELECT \"created_at\" AS \"createdAt\", \"updated_at\" AS \"updatedAt\", \"id\", \"title\", \"number\", \"sub_title\" AS \"subTitle\", \"email\", \"content\", \"published_at\" AS \"publishedAt\", \"a\", \"b\", \"c\", \"d\", \"created_by_id\" AS \"createdById\", \"updated_by_id\" AS \"updatedById\" FROM \"public\".\"test\" AS \"test\" ORDER BY \"test\".\"id\" ASC NULLS LAST LIMIT 200 OFFSET 71000;"
    },
    "sql": "SELECT \"created_at\" AS \"createdAt\",\"updated_at\" AS \"updatedAt\", \"id\", \"title\", \"number\", \"sub_title\" AS \"subTitle\", \"email\", \"content\", \"published_at\" AS \"publishedAt\", \"a\", \"b\", \"c\", \"d\", \"created_by_id\" AS \"createdById\", \"updated_by_id\" AS \"updatedById\" FROM \"public\".\"test\" AS \"test\" ORDER BY \"test\".\"id\" ASC NULLS LAST LIMIT 200 OFFSET 71000;",
    "parameters": {}
}

SELECT "created_at" AS "createdAt","updated_at" AS "updatedAt", "id", "title", "number", "sub_title" AS "subTitle", "email", "content", "published_at" AS "publishedAt", "a", "b", "c", "d", "created_by_id" AS "createdById", "updated_by_id" AS "updatedById" FROM "public"."test" AS "test" ORDER BY "test"."id" ASC NULLS LAST LIMIT 200 OFFSET 71000;

develop-cluster-node-2-noco-app  | 2025-08-04 09:10:43 [error] Worker error for task fee4481c-fd44-4c84-9ea4-5ea6d10981f5 Connection terminated unexpectedly stack=Error     
develop-cluster-node-2-noco-app  |     at Query.run (/app/nocobase/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)                                              
develop-cluster-node-2-noco-app  |     at /app/nocobase/node_modules/sequelize/lib/sequelize.js:315:28                                                                       
develop-cluster-node-2-noco-app  |     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)                                                         
develop-cluster-node-2-noco-app  |     at async PostgresQueryInterface.select (/app/nocobase/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
develop-cluster-node-2-noco-app  |     at async test.findAll (/app/nocobase/node_modules/sequelize/lib/model.js:1140:21)
develop-cluster-node-2-noco-app  |     at async _Repository.find (/app/nocobase/node_modules/@nocobase/database/lib/repository.js:364:14)
develop-cluster-node-2-noco-app  |     at async _Repository.chunk (/app/nocobase/node_modules/@nocobase/database/lib/repository.js:304:20)
develop-cluster-node-2-noco-app  |     at async XlsxExporter.run (/app/nocobase/node_modules/@nocobase/plugin-action-export/dist/server/services/base-exporter.js:128:7)
develop-cluster-node-2-noco-app  |     at async _AppCommand.<anonymous> (/app/nocobase/node_modules/@nocobase/plugin-action-export-pro/dist/server/commands/export-xlsx-command.js:78:5)
develop-cluster-node-2-noco-app  |     at async _AppCommand.parseAsync (/app/nocobase/node_modules/@nocobase/server/node_modules/commander/lib/command.js:935:5)
develop-cluster-node-2-noco-app  |     at async _AsyncEmitter.runAsCLI (/app/nocobase/node_modules/@nocobase/server/lib/application.js:592:23) meta={"name":"SequelizeDatabaseError","parent":{},"original":{},"sql":"SELECT \"created_at\" AS \"createdAt\", \"updated_at\" AS \"updatedAt\", \"id\", \"title\", \"number\", \"sub_title\" AS \"subTitle\", \"email\", \"content\", \"published_at\" AS \"publishedAt\", \"a\", \"b\", \"c\", \"d\", \"created_by_id\" AS \"createdById\", \"updated_by_id\" AS \"updatedById\" FROM \"public\".\"test\" AS \"test\" ORDER BY \"test\".\"id\" ASC NULLS LAST LIMIT 200 OFFSET 71000;","parameters":{}} module=application app=main reqId=8fc5e363-0a07-4e5a-abde-2c9b38ed62a0 dataSourceKey=main
develop-cluster-node-2-noco-app  | 2025-08-04 09:10:44 [info]  Worker exited for task fee4481c-fd44-4c84-9ea4-5ea6d10981f5 with code 1 module=application app=main reqId=8fc5e363-0a07-4e5a-abde-2c9b38ed62a0 dataSourceKey=main
