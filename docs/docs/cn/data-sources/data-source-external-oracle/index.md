# 外部数据源 - Oracle

<PluginInfo commercial="true" name="data-source-external-oracle"></PluginInfo>

## 介绍

使用外部的 Oracle 数据库作为数据源。目前支持的版本 Oracle >= 11g

## 安装

### 安装 Oracle 客户端

Oracle 服务端版本小于 12.1，需要安装 Oracle 客户端

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Linux 的示例：

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

如果不是按照上述方式安装的客户端，需要提供客户端所在路径（更多内容参考 [node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html) 文档）

![20241204165940](https://static-docs.nocobase.com/20241204165940.png)

### 安装插件

参考 [商业插件的安装与升级](/welcome/getting-started/plugin)

## 使用说明

查看 [数据源 / 外部数据库](/handbook/data-source-manager/external-database) 章节
