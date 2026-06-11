import * as core from '@actions/core'
import * as github from '@actions/github'

const token = core.getInput('token')
const octokit = github.getOctokit(token)
const searchString = core.getInput('searchString').trim()
const mergeIn = core.getInput('mergeIn').trim()
const mergePull = core.getBooleanInput('mergePull')

async function main() {
  try {
    if (!searchString) throw new Error('searchString is required')
    if (!mergeIn && !mergePull) throw new Error('Neither mergeIn or mergePull is specified')

    let pullRequest = await getPullRequest()

    let queryAttemptCount = 0
    while ([pullRequest.mergeable, pullRequest.mergeStateStatus].includes('UNKNOWN') && queryAttemptCount < 10) {
      await sleep(1000)
      pullRequest = await getPullRequest()
      queryAttemptCount++
    }

    if (pullRequest.mergeable !== 'MERGEABLE' || (pullRequest.mergeStateStatus !== 'CLEAN' && mergePull)) {
      throw new Error(
        `Pull request is not ready for merging (Mergeable: ${pullRequest.mergeable}, Merge state status: ${pullRequest.mergeStateStatus})`
      )
    }

    if (mergePull) {
      await mergePullRequest(pullRequest)
    } else if (mergeIn) {
      await mergeBranch(pullRequest)
    }
  } catch (error) {
    core.info(error.stack || String(error))
    core.setFailed(error.message || String(error))
  }
}

main()

async function getPullRequest() {
  const owner = github.context.payload?.repository?.owner?.login || github.context.repo.owner
  const repo = github.context.payload?.repository?.name || github.context.repo.repo

  const searchResult = await octokit.graphql(
    `
      query targetPullRequest($queryString: String!) {
        search(last: 10, query: $queryString, type: ISSUE) {
          nodes {
            ... on PullRequest {
              id
              createdAt
              title
              headRef {
                id
                name
              }
              baseRefName
              mergeable
              mergeStateStatus
              checksUrl
              repository {
                id
              }
            }
          }
        }
      }
    `,
    {
      queryString: `is:pr is:open ${searchString} repo:${owner}/${repo}`
    }
  )

  const escapedSearchString = escapeRegExp(searchString)
  const regex = new RegExp(`(^|[^a-zA-Z0-9])${escapedSearchString}([^a-zA-Z0-9]|$)`, 'i')
  const titleRegex = new RegExp(`^${escapedSearchString}([^a-zA-Z0-9]|$)`, 'i')
  const matchedPRs = searchResult.search.nodes.filter(pr =>
    (pr.headRef && pr.headRef.name && regex.test(pr.headRef.name)) || (pr.title && titleRegex.test(pr.title))
  )

  if (matchedPRs.length === 0) {
    throw new Error(`No pull request found matching branch or title for ${searchString}`)
  } else if (matchedPRs.length > 1) {
    core.warning(`Multiple pull requests found matching branch or title for ${searchString}, using the most recent one.`)
  }

  return matchedPRs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
}

async function mergeBranch(pullRequest) {
  return octokit.graphql(
    `
      mutation mergeBranch($base: String!, $commitMessage: String!, $head: String!, $repositoryId: ID!){
        mergeBranch(input: { base: $base, commitMessage: $commitMessage, head: $head, repositoryId: $repositoryId }) {
          clientMutationId
        }
      }
    `,
    {
      base: mergeIn,
      commitMessage: `Merging ${pullRequest.headRef.name} in ${mergeIn}`,
      head: pullRequest.headRef.name,
      repositoryId: pullRequest.repository.id
    }
  )
}

async function mergePullRequest(pullRequest) {
  await octokit.graphql(
    `
      mutation mergePullRequest($pullRequestId: ID!){
        mergePullRequest(input: { pullRequestId: $pullRequestId }) {
          clientMutationId
        }
      }
    `,
    {
      pullRequestId: pullRequest.id
    }
  )

  return octokit.graphql(
    `
      mutation deleteRef($refId: ID!){
        deleteRef(input: { refId: $refId }) {
          clientMutationId
        }
      }
    `,
    {
      refId: pullRequest.headRef.id
    }
  )
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
