yarn version:alpha -y
git add .
git commit -m "chore(versions): 😊 publish v$(jq -r '.version' lerna.json)"
git tag v$(jq -r '.version' lerna.json)
git push --atomic origin main v$(jq -r '.version' lerna.json)
