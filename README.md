# Find and merge PR to

This action finds a pull request and merges it (or its head ref to a target branch).

## Inputs

### `Token` (`string`)

**Required** Github token.

### `searchString` (`string`)

**Required** The search string used for the pull request query.

### `mergePull` (`boolean`)

Wether or not merging, closing PR and deleting PR headRef.

### `mergeIn` (`string`)

The target branch.

## Example usage

```yaml
uses: codeur/find-and-merge-pr-to@v1
with:
  token: ${{ secrets.GITHUB_TOKEN }}
  searchString: my awesome pullrequest
  mergeIn: staging
```

## Development and release

Refer to [Commit, tag, and push your action to GitHub](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action#commit-tag-and-push-your-action-to-github) section using `@vercel/ncc` to push changes to the action or use:

```
yarn install
git add .
git commit -m "My super commit"
git tag -a -m "My super release" vX.X.X
git push --follow-tags
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
