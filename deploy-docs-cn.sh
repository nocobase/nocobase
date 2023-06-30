cd docs/dist/zh-CN
echo "docs-cn.nocobase.com" >> CNAME
echo "" >> .nojekyll
git init
git remote add origin git@github.com:nocobase/docs-cn.nocobase.com.git
git branch -M main
git add .
git commit -m "first commit"
git push -f origin main
