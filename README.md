# Testrecipe

This project contains the budgeting and recipe viewer pages.

## Configure a GitHub remote with a Personal Access Token (PAT)
Use the steps below to connect this repository to GitHub without hard-coding credentials.
> Note: This development environment cannot reach GitHub directly, so the automated agent cannot push for you. Run the steps below on a machine with internet access to publish your changes.

1. Export your PAT to an environment variable (replace `<TOKEN>` with your real PAT):
   ```bash
   export GITHUB_PAT=<TOKEN>
   ```

2. Run the helper script to set the remote (if missing) and push the current branch using an in-memory askpass helper, so the PAT is never written to disk:
   ```bash
   GITHUB_USER=<YOUR_USERNAME> \
   GITHUB_REPO=<YOUR_REPO> \
   GITHUB_PAT=${GITHUB_PAT} \
   ./scripts/push-to-github.sh
   ```
   The script will add `origin` if it does not exist and then push the checked-out branch. It cleans up the temporary askpass helper automatically.

   If you still cannot see changes on GitHub, double-check the following:
   - `git status` shows no pending changes before running the script (all commits are pushed).
   - `git branch --show-current` matches the branch you expect to publish.
   - The `GITHUB_USER`/`GITHUB_REPO` values match the target repository.

3. Verify the remote (optional):
   ```bash
   git remote -v
   ```

### Security notes
- Avoid pasting the PAT directly into commands that could end up in shell history; using an environment variable keeps the value out of tracked files.
- Ensure your PAT has the minimal scopes needed (e.g., `repo`).
- Unset the variable when finished: `unset GITHUB_PAT`.
