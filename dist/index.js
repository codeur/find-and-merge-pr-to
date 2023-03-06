/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 105:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 82:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(105)
const github = __nccwpck_require__(82)
const token = core.getInput('token')
const octokit = github.getOctokit(token, { previews: ['merge-info-preview'] })
const searchString = core.getInput('searchString')
const mergeIn = core.getInput('mergeIn')
const mergePull = core.getInput('mergePull')

async function main() {
  try {
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
        `Pull Request is not ready for merging : Mergeable -> ${pullRequest.mergeable}, Merge state status -> ${pullRequest.mergeStateStatus}`
      )
    }

    if (mergePull) {
      await mergePullRequest(pullRequest)
    } else if (mergeIn) {
      await mergeBranch(pullRequest)
    }
  } catch (error) {
    core.setFailed(error.toString())
  }
}

main()

async function getPullRequest() {
  // TODO: query for all PR and filter by regex to be sure we don't get DC-421 if we enter DC-42
  const searchResult = await octokit.graphql(
    `
      query targetPullRequest($queryString: String!) {
        search(last: 1, query: $queryString, type: ISSUE) {
          nodes {
            ... on PullRequest {
              id
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
      queryString: `is:pr ${searchString} in:title repo:${github.context.payload.repository.full_name}`
    }
  )

  return searchResult.search.nodes[0]
}

async function mergeBranch(pullRequest) {
  return await octokit.graphql(
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

})();

module.exports = __webpack_exports__;
/******/ })()
;