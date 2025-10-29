# External Data Source - Oracle

<PluginInfo commercial="true" name="data-source-external-oracle"></PluginInfo>

## Introduction

This plugin allows you to use an external Oracle database as a data source. It supports Oracle versions >= 11g.

## Installation

### Install Oracle Client

For Oracle server versions earlier than 12.1, you need to install the Oracle client.

![Oracle Client Installation](https://static-docs.nocobase.com/20241204164359.png)

Example for Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

If the client is not installed as described above, you will need to specify the path to the client (for more details, refer to the [node-oracledb documentation](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![Oracle Client Path Configuration](https://static-docs.nocobase.com/20241204165940.png)

### Install the Plugin

Follow the instructions in [Installing and Upgrading Commercial Plugins](/welcome/getting-started/plugin).

## Use Cases

For detailed instructions, refer to the [Data Source / External Database](/handbook/data-source-manager/external-database) section.
