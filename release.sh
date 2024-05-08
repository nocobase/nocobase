yarn version:alpha -y
cd ./packages/pro-plugins
git add .
git commit -m "chore(versions): 😊 publish v$(jq -r '.version' ../../lerna.json)"
git tag v$(jq -r '.version' ../../lerna.json)
git push --atomic origin main v$(jq -r '.version' ../../lerna.json)
cd ../../
git add .
git commit -m "chore(versions): 😊 publish v$(jq -r '.version' lerna.json)"
git tag v$(jq -r '.version' lerna.json)
yarn changelog --breaking-pattern "BREAKING CHANGE:"
git add .
git commit -m "chore: update changelog"
git push --atomic origin main v$(jq -r '.version' lerna.json)
