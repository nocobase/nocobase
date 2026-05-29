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

append_repo_specs() {
  local repos_json="${1:-}"

  if [[ -z "$repos_json" ]]; then
    return 0
  fi

  echo "$repos_json" | jq -r '.[]' | while read -r repo; do
    [[ -n "$repo" ]] || continue
    echo "$repo|./packages/pro-plugins/@nocobase/$repo"
  done
}

list_release_repos() {
  echo "nocobase|."
  echo "pro-plugins|./packages/pro-plugins"
  append_repo_specs "${PRO_PLUGIN_REPOS:-}"
  append_repo_specs "${CUSTOM_PRO_PLUGIN_REPOS:-}"
}

check_release_tag_state() {
  local version="$1"
  local tag="v${version}"
  local -a existing=()
  local -a missing=()
  local repo_name
  local repo_path

  while IFS='|' read -r repo_name repo_path; do
    [[ -n "$repo_name" ]] || continue

    if git -C "$repo_path" rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
      existing+=("$repo_name")
    else
      missing+=("$repo_name")
    fi
  done < <(list_release_repos)

  if [[ ${#existing[@]} -eq 0 ]]; then
    echo "Release tag $tag does not exist in any repo yet."
    return 0
  fi

  if [[ ${#missing[@]} -eq 0 ]]; then
    echo "Release tag $tag already exists in all repos. Treating this run as an idempotent no-op."
    printf ' - %s\n' "${existing[@]}"
    return 2
  fi

  echo "ERROR: Release tag $tag already exists in some repos but is missing in others." >&2
  echo "Existing tag repos:" >&2
  printf ' - %s\n' "${existing[@]}" >&2
  echo "Missing tag repos:" >&2
  printf ' - %s\n' "${missing[@]}" >&2
  return 3
}

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

tag_state=0
if check_release_tag_state "$new_version"; then
  tag_state=0
else
  tag_state=$?
fi

if [[ "$tag_state" -eq 2 ]]; then
  exit 0
fi

if [[ "$tag_state" -eq 3 ]]; then
  exit 1
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

VERSION=$(jq -r '.version' lerna.json)

commit_and_tag_if_changed() {
  # `git commit` exits 1 when there is nothing to commit; with `set -e` that would abort release.
  # Also, if there are no changes, we should NOT create a new version tag pointing at an old commit.
  # So we only commit+tag when there are staged changes.
  local version="$1"
  local msg="chore(versions): 😊 publish v${version}"
  local tag="v${version}"

  if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
    if ! git diff --cached --quiet; then
      echo "ERROR: Refusing to create an untagged release commit because $tag already exists in $(pwd)." >&2
      return 1
    fi

    echo "Skip commit+tag (tag already exists): $(pwd)"
    return 0
  fi

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
