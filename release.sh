set -e

branch=$(git branch --show-current)
current_version=$(jq -r '.version' lerna.json)
IFS='.-' read -r major minor patch label pre <<< "$current_version"

DRY_RUN=false
ONLY_VERSION=false
EXPLICIT_VERSION=""
IS_FEAT=""
ADD_MINOR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --only-version)
      ONLY_VERSION=true
      shift
      ;;
    --version)
      EXPLICIT_VERSION="$2"
      shift 2
      ;;
    --is-feat)
      IS_FEAT="--is-feat"
      shift
      ;;
    --add-minor)
      ADD_MINOR="--add-minor"
      shift
      ;;
    *)
      # backward compatible: allow passing flags positionally
      if [[ "$1" == "--is-feat" ]]; then
        IS_FEAT="--is-feat"
        shift
      else
        shift
      fi
      ;;
  esac
done

if [[ -n "$EXPLICIT_VERSION" ]]; then
  new_version="$EXPLICIT_VERSION"
elif [[ "$branch" == "main" || "$branch" == "v1" ]]; then
  # rc/latest-style bump
  if [[ "$IS_FEAT" == "--is-feat" ]]; then
    new_version="$major.$minor.0"
  else
    new_patch=$((patch + 1))
    new_version="$major.$minor.$new_patch"
  fi
elif [[ "$branch" == "next" ]]; then
  # beta
  if [[ "$IS_FEAT" == "--is-feat" ]]; then
    if [[ "$ADD_MINOR" == "--add-minor" ]]; then
      minor=$((minor + 1))
    fi
    new_version="$major.$minor.0-beta.1"
  else
    new_pre=$((pre + 1))
    new_version="$major.$minor.$patch-beta.$new_pre"
  fi
elif [[ "$branch" == "develop" ]]; then
  # alpha
  if [[ "$IS_FEAT" == "--is-feat" ]]; then
    new_minor=$((minor + 1))
    new_version="$major.$new_minor.0-alpha.1"
  else
    new_pre=$((pre + 1))
    new_version="$major.$minor.$patch-alpha.$new_pre"
  fi
else
  echo "Unsupported branch: $branch" >&2
  exit 1
fi

if [[ "$ONLY_VERSION" == "true" ]]; then
  echo "$new_version"
  exit 0
fi

if [[ "$DRY_RUN" == "true" ]]; then
  echo "DRY_RUN: computed version = $new_version"
  echo "DRY_RUN: would tag v$new_version in:"
  echo "- nocobase/nocobase"
  echo "- nocobase/pro-plugins"
  if [[ -n "${PRO_PLUGIN_REPOS:-}" ]]; then
    echo "$PRO_PLUGIN_REPOS" | jq -r '.[]' | while read -r i; do
      echo "- nocobase/$i"
    done
  fi
  if [[ -n "${CUSTOM_PRO_PLUGIN_REPOS:-}" ]]; then
    echo "$CUSTOM_PRO_PLUGIN_REPOS" | jq -r '.[]' | while read -r i; do
      echo "- nocobase/$i"
    done
  fi
  exit 0
fi

echo "Releasing version: $new_version"

lerna version "$new_version" --preid alpha --force-publish=* --no-git-tag-version -y

echo $PRO_PLUGIN_REPOS | jq -r '.[]' | while read i; do
  cd ./packages/pro-plugins/@nocobase/$i
  git add package.json
  git commit -m "chore(versions): 😊 publish v$(jq -r '.version' ../../../../lerna.json)"
  git tag v$(jq -r '.version' ../../../../lerna.json)
  cd ../../../../
done
echo $CUSTOM_PRO_PLUGIN_REPOS | jq -r '.[]' | while read i; do
  cd ./packages/pro-plugins/@nocobase/$i
  git add package.json
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

