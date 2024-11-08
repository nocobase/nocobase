current_version=$(jq -r '.version' lerna.json)
IFS='.-' read -r major minor patch label pre <<< "$current_version"

if [[ "$label" == 'beta' || "$2" == '--is-beta' ]]; then
  if [ "$1" == '--is-feat' ]; then
    new_version="$major.$minor.0-beta"
    echo $new_version;
  else
    new_patch=$((patch + 1))
    new_version="$major.$minor.$new_patch-$label"
    echo $new_version;
  fi
else
  # alpha
  if [ "$1" == '--is-feat' ]; then
    new_minor=$((minor + 1))
    new_version="$major.$new_minor.0-alpha.0"
    echo $new_version;
  else
    if [ -z "$pre" ]; then
      new_version="$major.$minor.$patch-alpha.0"
      echo $new_version;
    else
      new_pre=$((pre + 1))
      new_version="$major.$minor.$patch-alpha.$new_pre"
      echo $new_version;
    fi
  fi
fi

lerna version $new_version --preid alpha --force-publish=* --no-git-tag-version -y

echo $PRO_PLUGIN_REPOS | jq -r '.[]' | while read i; do
  cd ./packages/pro-plugins/@nocobase/$i
  git add .
  git commit -m "chore(versions): 😊 publish v$(jq -r '.version' ../../../../lerna.json)"
  git tag v$(jq -r '.version' ../../../../lerna.json)
  cd ../../../../
done
echo $CUSTOM_PRO_PLUGIN_REPOS | jq -r '.[]' | while read i; do
  cd ./packages/pro-plugins/@nocobase/$i
  git add .
  git commit -m "chore(versions): 😊 publish v$(jq -r '.version' ../../../../lerna.json)"
  git tag v$(jq -r '.version' ../../../../lerna.json)
  cd ../../../../
done
cd ./packages/pro-plugins
git add .
git commit -m "chore(versions): 😊 publish v$(jq -r '.version' ../../lerna.json)"
git tag v$(jq -r '.version' ../../lerna.json)
#git push --atomic origin main v$(jq -r '.version' ../../lerna.json)
cd ../../
git add .
git commit -m "chore(versions): 😊 publish v$(jq -r '.version' lerna.json)"
git tag v$(jq -r '.version' lerna.json)
# git push --atomic origin main v$(jq -r '.version' lerna.json)

