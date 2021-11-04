DELETE FROM "collections";
INSERT INTO "collections" ("name", "logging", "title", "privilege", "sortable", "options", "sort", "created_at", "updated_at", "ui_schema_key") VALUES
('users',	'1',	'{{t("Users")}}',	'undelete',	'"sort"',	'{"createdBy":false,"updatedBy":false}',	2,	'2021-09-02 15:07:56.914+00',	'2021-09-15 00:59:20.676+00',	NULL),
('t_fsveob6p269',	'1',	'顾客',	NULL,	'"sort"',	'{}',	5,	'2021-09-12 01:05:52.722+00',	'2021-09-18 04:15:23.113+00',	NULL),
('t_geso7fru7a9',	'1',	'订单',	NULL,	'"sort"',	'{}',	4,	'2021-09-12 01:06:05.19+00',	'2021-09-18 04:15:42.566+00',	NULL),
('t_2uhu4szs1kq',	'1',	'任务',	NULL,	'"sort"',	'{}',	3,	'2021-09-03 08:17:30.495+00',	'2021-09-18 04:15:42.572+00',	NULL);
