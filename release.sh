current_version=$(jq -r '.version' lerna.json)
IFS='.-' read -r major minor patch label <<< "$current_version"

if [ "$1" == '--is-feat' ]; then
    new_minor=$((minor + 1))
    new_version="$major.$new_minor.0-beta"
    echo $new_version;
else
    new_patch=$((patch + 1))
    new_version="$major.$minor.$new_patch-$label"
    echo $new_version;
fi

lerna version $new_version --preid alpha --force-publish=* --no-git-tag-version -y

cd ./packages/pro-plugins
git add .
git commit -m "chore(versions): 😊 publish v$(jq -r '.version' ../../lerna.json)"
git tag v$(jq -r '.version' ../../lerna.json)
#git push --atomic origin main v$(jq -r '.version' ../../lerna.json)
cd ../../
git add .
git commit -m "chore(versions): 😊 publish v$(jq -r '.version' lerna.json)"
git tag v$(jq -r '.version' lerna.json)
yarn changelog --breaking-pattern "BREAKING CHANGE:"
git add .
git commit -m "chore: update changelog"
# git push --atomic origin main v$(jq -r '.version' lerna.json)
