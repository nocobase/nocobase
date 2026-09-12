set -e

branch=$(git branch --show-current)
current_version=$(jq -r '.version' lerna.json)
IFS='.-' read -r major minor patch label pre <<< "$current_version"

DRY_RUN=false
ONLY_VERSION=false
LERNA_VERSION_ONLY=false
COMMIT_TAG_ONLY=false
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
    --lerna-version-only)
      LERNA_VERSION_ONLY=true
      shift
      ;;
    --commit-tag-only)
      COMMIT_TAG_ONLY=true
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

if [[ "$LERNA_VERSION_ONLY" == "true" && "$COMMIT_TAG_ONLY" == "true" ]]; then
  echo "Cannot combine --lerna-version-only with --commit-tag-only." >&2
  exit 1
fi

if [[ "$COMMIT_TAG_ONLY" != "true" ]]; then
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
fi

if [[ "$ONLY_VERSION" == "true" ]]; then
  echo "$new_version"
  exit 0
fi

if [[ "$COMMIT_TAG_ONLY" == "true" ]]; then
  VERSION=$(jq -r '.version' lerna.json)
else
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

  if [[ "$LERNA_VERSION_ONLY" == "true" ]]; then
    exit 0
  fi

  VERSION=$(jq -r '.version' lerna.json)
fi

commit_and_tag_if_changed() {
  # `git commit` exits 1 when there is nothing to commit; with `set -e` that would abort release.
  # Also, if there are no changes, we should NOT create a new version tag pointing at an old commit.
  # So we only commit+tag when there are staged changes.
  local version="$1"
  local msg="chore(versions): 😊 publish v${version}"
  local tag="v${version}"

  if ! git diff --cached --quiet; then
    git commit -m "$msg"
    git tag "$tag"
  else
    echo "Skip commit+tag (no staged changes): $(pwd)"
  fi
}

echo $PRO_PLUGIN_REPOS | jq -r '.[]' | while read i; do
  cd ./packages/pro-plugins/@nocobase/$i
  git add package.json
  commit_and_tag_if_changed "$VERSION"
  cd ../../../../
done
echo $CUSTOM_PRO_PLUGIN_REPOS | jq -r '.[]' | while read i; do
  cd ./packages/pro-plugins/@nocobase/$i
  git add package.json
  commit_and_tag_if_changed "$VERSION"
  cd ../../../../
done
cd ./packages/pro-plugins
git add .
commit_and_tag_if_changed "$VERSION"
#git push --atomic origin main v$VERSION
cd ../../
git add .
commit_and_tag_if_changed "$VERSION"
# git push --atomic origin main v$VERSION
