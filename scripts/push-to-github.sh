#!/usr/bin/env bash
set -euo pipefail

# Helper script to push the current branch to GitHub using environment-provided
# credentials. This avoids storing a Personal Access Token (PAT) in the Git
# config or shell history. Required env vars:
#   GITHUB_USER  - GitHub username or org that owns the repo
#   GITHUB_REPO  - Repository name (without .git)
#   GITHUB_PAT   - PAT with repo scope; not stored on disk

if [[ "${GITHUB_USER:-}" == "" || "${GITHUB_REPO:-}" == "" || "${GITHUB_PAT:-}" == "" ]]; then
  echo "GITHUB_USER, GITHUB_REPO, and GITHUB_PAT must be set in the environment." >&2
  exit 1
fi

current_branch=$(git rev-parse --abbrev-ref HEAD)

# Configure remote if missing.
if git remote get-url origin > /dev/null 2>&1; then
  remote_url=$(git remote get-url origin)
  echo "Using existing origin remote: ${remote_url}"
else
  remote_url="https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git"
  git remote add origin "${remote_url}"
  echo "Added origin remote: ${remote_url}"
fi

tmp_askpass=$(mktemp)
trap 'rm -f "${tmp_askpass}"' EXIT
cat > "${tmp_askpass}" <<'ASKPASS'
#!/usr/bin/env sh
case "$1" in
*Username*) echo "$GITHUB_USER" ;;
*Password*) echo "$GITHUB_PAT" ;;
*) exit 1 ;;
esac
ASKPASS
chmod +x "${tmp_askpass}"

GIT_ASKPASS="${tmp_askpass}" GIT_TERMINAL_PROMPT=0 git push -u origin "${current_branch}"

echo "Push complete for branch ${current_branch}."
