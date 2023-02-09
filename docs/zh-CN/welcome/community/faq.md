# 常见问题

* Q：启动时，报错: `Error: error:0308010C:digital envelope routines::unsupported`

* A：由于Node.js 17+以上版本，升级了OpenSSL v3，对允许的密钥大小和算法的更严格限制意味着可能会对生态系统产生一些影响，尤其是对于仍在使用小密钥或旧算法的一些生态库，解决方案可以在.env文件中添加配置 `NODE_OPTIONS=--openssl-legacy-provider` ，具体也可以查看 `.env.example`
