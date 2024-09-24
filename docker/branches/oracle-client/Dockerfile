FROM nocobase/nocobase:next

RUN apt-get update \
    && apt-get install -y wget unzip libaio1 \
    && wget -O /opt/instantclient-basic-linux.x64-12.2.0.1.0.zip https://github.com/f00b4r/oracle-instantclient/raw/refs/heads/master/instantclient-basic-linux.x64-12.2.0.1.0.zip \
    && unzip /opt/instantclient-basic-linux.x64-12.2.0.1.0.zip -d /opt \
    && ln -s /opt/instantclient_12_2/libclntsh.so.12.1 /opt/instantclient_12_2/libclntsh.so \
    && ln -s /opt/instantclient_12_2/libclntshcore.so.12.1 /opt/instantclient_12_2/libclntshcore.so \
    && ln -s /opt/instantclient_12_2/libocci.so.12.1 /opt/instantclient_12_2/libocci.so \
    && echo /opt/instantclient_12_2 > /etc/ld.so.conf.d/oracle-instantclient.conf \
    && ldconfig
