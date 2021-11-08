DELETE FROM "routes";
INSERT INTO "routes" ("key", "type", "options", "sort", "created_at", "updated_at", "parent_key", "ui_schema_key") VALUES
('r_94b8nz6evyh',	'redirect',	'{"from":"/","to":"/admin","exact":true}',	1,	'2021-09-02 15:07:57.162+00',	'2021-09-02 15:07:57.162+00',	NULL,	NULL),
('r_w1sa2lfk44v',	'route',	'{"path":"/admin/:name(.+)?","component":"AdminLayout","title":"后台"}',	2,	'2021-09-02 15:07:57.17+00',	'2021-09-02 15:07:57.185+00',	NULL,	'qqzzjakwkwl'),
('r_nt33b3m6ptk',	'route',	'{"component":"AuthLayout"}',	3,	'2021-09-02 15:07:57.19+00',	'2021-09-02 15:07:57.19+00',	NULL,	NULL),
('r_5l9yp15wjk9',	'route',	'{"path":"/signin","component":"RouteSchemaRenderer","title":"登录"}',	1,	'2021-09-02 15:07:57.196+00',	'2021-09-02 15:07:57.252+00',	'r_nt33b3m6ptk',	'dtf9j0b8p9u'),
('r_9gqm4d8wpuw',	'route',	'{"path":"/signup","component":"RouteSchemaRenderer","title":"注册"}',	2,	'2021-09-02 15:07:57.256+00',	'2021-09-02 15:07:57.343+00',	'r_nt33b3m6ptk',	'46qlxqam3xk');
