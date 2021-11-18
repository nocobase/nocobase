DELETE FROM "collections";
INSERT INTO "collections" ("name", "logging", "title", "privilege", "sortable", "options", "sort", "created_at", "updated_at", "ui_schema_key") VALUES
('users',	'1',	'{{t("Users")}}',	'undelete',	'"sort"',	'{"createdBy":false,"updatedBy":false,"scopes":{"withPassword":{"attributes":{"include":["password"]}}},"defaultScope":{"attributes":{"exclude":["password"]}}}',	1,	'2021-11-17 04:49:27.376+00',	'2021-11-17 04:49:27.376+00',	NULL),
('roles',	'1',	'{{t("Roles")}}',	NULL,	'"sort"',	'{}',	2,	'2021-11-17 04:49:27.529+00',	'2021-11-17 04:49:27.529+00',	NULL);
INSERT INTO "collections" ("name", "logging", "title", "privilege", "sortable", "options", "sort", "created_at", "updated_at", "ui_schema_key") VALUES
('t_fsveob6p269',	'1',	'顾客',	NULL,	'"sort"',	'{}',	5,	'2021-09-12 01:05:52.722+00',	'2021-09-18 04:15:23.113+00',	NULL),
('t_geso7fru7a9',	'1',	'订单',	NULL,	'"sort"',	'{}',	4,	'2021-09-12 01:06:05.19+00',	'2021-09-18 04:15:42.566+00',	NULL),
('t_2uhu4szs1kq',	'1',	'任务',	NULL,	'"sort"',	'{}',	3,	'2021-09-03 08:17:30.495+00',	'2021-09-18 04:15:42.572+00',	NULL);
