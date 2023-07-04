cd docs/dist/en-US
echo "docs.nocobase.com" >> CNAME
echo "" >> .nojekyll
git init
git remote add origin git@github.com:nocobase/docs.nocobase.com.git
git branch -M main
git add .
git commit -m "first commit"
git push -f origin main
