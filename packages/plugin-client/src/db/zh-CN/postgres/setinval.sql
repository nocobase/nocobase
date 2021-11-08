SELECT setval('action_permissions_id_seq', (SELECT MAX(id) FROM "action_permissions"), true);
SELECT setval('attachments_id_seq', (SELECT MAX(id) FROM "attachments"), true);
SELECT setval('t_2uhu4szs1kq_id_seq', (SELECT MAX(id) FROM "t_2uhu4szs1kq"), true);
SELECT setval('t_fsveob6p269_id_seq', (SELECT MAX(id) FROM "t_fsveob6p269"), true);
SELECT setval('t_geso7fru7a9_id_seq', (SELECT MAX(id) FROM "t_geso7fru7a9"), true);
