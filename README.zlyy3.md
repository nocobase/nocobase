
## 我自己添加的 整理本地安装部署
参考 https://docs-cn.nocobase.com/welcome/getting-started/installation/git-clone
```bash
  yarn install --frozen-lockfile  
```



升级 NocoBase

```bash
  yarn nocobase upgrade
``` 


安装 NocoBase

```bash
  yarn nocobase install --lang=zh-CN
````

启动 NocoBase

开发环境
```bash
  yarn dev  
```

生产环境
> # 编译（请确保已执行 `yarn install --frozen-lockfile`）
```bash 
  yarn build  
```
> # 启动
```bash
  yarn start
```


备份和还原
> pg_dump -U [用户名] -h [主机地址] -p [端口] -F c -b --quote-all-identifiers -f [备份文件路径] [数据库名]  
> pg_restore -U [用户名] -h [主机地址] -p [端口] -d [数据库名] --clean --if-exists --no-owner [备份文件路径]
>
> pg_dump -U nocobase -F c -b --quote-all-identifiers -f ./backup/nocobase-xxxx nocobase  
> pg_restore -U nocobase -d nocobase --clean --if-exists --no-owner ./backup/nocobase-xxxx

