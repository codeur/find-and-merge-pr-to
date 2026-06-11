# Find and merge PR to

This action finds an open pull request matching a search string (by title or head branch name) and either merges it or merges its head branch into a target branch.

## Inputs

### `token` (`string`)

**Required** GitHub token with `contents: write` and `pull-requests: write` permissions.

### `searchString` (`string`)

**Required** The search string used to find the pull request. It is matched (case-insensitively) against:
- the **head branch name** (partial match allowed)
- the **PR title** (must match from the beginning)

If multiple PRs match, the most recently created one is used and a warning is emitted.

### `mergePull` (`boolean`)

Default: `false`. When `true`, merges the pull request via GitHub's merge API and deletes its head branch.

### `mergeIn` (`string`)

Target branch. When provided, merges the PR's head branch into this branch (without closing the PR). Can be combined with `mergePull: true` to do both.

> **Note:** At least one of `mergePull: true` or `mergeIn` must be specified.

## Required permissions

```yaml
permissions:
  contents: write
  pull-requests: write
```

## Behavior

1. Searches for an open PR in the current repository matching `searchString`.
2. Waits up to 10 seconds for GitHub to resolve the PR's mergeability.
3. Fails if the PR is not in a `MERGEABLE` / `CLEAN` state (when `mergePull` is used).
4. Depending on inputs:
   - `mergePull: true` → merges the PR and deletes the head branch.
   - `mergeIn: <branch>` → merges the head branch into the target branch (PR stays open).

## Example usage

### Merge head branch into a staging branch (PR stays open)

```yaml
uses: codeur/find-and-merge-pr-to@v3
with:
  token: ${{ secrets.GITHUB_TOKEN }}
  searchString: my-feature-branch
  mergeIn: staging
```

### Merge the PR itself and delete the head branch

```yaml
uses: codeur/find-and-merge-pr-to@v3
with:
  token: ${{ secrets.GITHUB_TOKEN }}
  searchString: my awesome pull request
  mergePull: true
```

### Merge the PR and also merge the head branch into another branch

```yaml
uses: codeur/find-and-merge-pr-to@v3
with:
  token: ${{ secrets.GITHUB_TOKEN }}
  searchString: my-feature-branch
  mergePull: true
  mergeIn: staging
```

## Development and release

Refer to [Commit, tag, and push your action to GitHub](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action#commit-tag-and-push-your-action-to-github) section using `@vercel/ncc` to push changes to the action or use:

```
yarn build
```

`ncc build index.js --license licenses.txt` is now executed automatically before each commit via a Git `pre-commit` hook.

### Release new version

1. Create a Pull Request with changes.
2. Add one of the following labels to the PR:
   - `bump:major`: Bump major version (e.g. v1.0.0 -> v2.0.0)
   - `bump:minor`: Bump minor version (e.g. v1.0.0 -> v1.1.0)
   - `bump:patch`: Bump patch version (e.g. v1.0.0 -> v1.0.1)
3. Merge the PR.
4. The release workflow will automatically bump the version, create a release, and update major/minor tags (e.g. v1).

## License

This Github Action is available as open source under the terms of the MIT License. Copyright 2021 Codeur SARL.
