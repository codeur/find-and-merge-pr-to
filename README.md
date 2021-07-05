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

Refer to [Commit, tag, and push your action to GitHub](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action#commit-tag-and-push-your-action-to-github) section using `@vercell/ncc` to push changes to the action or use :
```
ncc build index.js --license licenses.txt
git add .
git commit -m "My super commit"
git tag -a -m "My super release" v1.1
git push --follow-tags
```

## License
This Github Action is available as open source under the terms of the MIT License. Copyright 2021 Codeur SARL.
