let client;
try {
  client = chrome;
} catch {
  client = browser;
}

const parser = new DOMParser();

gitHubJiraLinkA = 'gitHubJiraLink__a';
gitHubJiraLinkAId = `#${gitHubJiraLinkA}`;
gitHubJiraLinkAClass = `.${gitHubJiraLinkA}`;

gitHubJiraLinkSpan = 'gitHubJiraLink__span';
gitHubJiraLinkSpanId = `#${gitHubJiraLinkSpan}`;
gitHubJiraLinkSpanClass = `.${gitHubJiraLinkSpan}`;

const headerId = '#partial-discussion-header';
const prInfoClass = '.TableObject-item--primary';
const branchNameSpanClass =
  '.commit-ref.css-truncate.user-select-contain.expandable.head-ref';
const prLinksClass =
  '.link-gray-dark.v-align-middle.no-underline.h4.js-navigation-open';
const firstCommentClass = '.d-block.comment-body.markdown-body.js-comment-body';
const prTitleClass = '.js-issue-title';

const jiraLinkCache = new Map();

client.storage.sync.get({ projects: '[]' }, function(options) {
  const { projects } = options;
  const projectsParsed = JSON.parse(projects);
  async function mainScript() {
    const hrefArr = getHrefArr();
    const coveredProject = getCoveredProject(hrefArr, projectsParsed);
    if (onPrShow(hrefArr, coveredProject)) {
      const jiraLinks = getJiraLinks(document, projectsParsed, 'id');
      handlePrShowLinks(jiraLinks);
    } else if (onPrList(hrefArr, coveredProject)) {
      const prLinks = Array.from(document.querySelectorAll(prLinksClass));
      await handlePrListLinks(prLinks, projectsParsed);
    }
    return Promise.resolve();
  }

  function runScript() {
    mainScript().then(() => {
      setTimeout(runScript, 500);
    });
  }

  runScript();
});

function getHrefArr() {
  return window.location.pathname.split('/').slice(1);
}

function onPrShow(hrefArr, coveredProject) {
  return (
    hrefArr[2] === 'pull' &&
    coveredProject &&
    !document.querySelector(gitHubJiraLinkAId)
  );
}

function onPrList(hrefArr, coveredProject) {
  return (
    hrefArr[2] === 'pulls' &&
    coveredProject &&
    !document.querySelector(gitHubJiraLinkAClass)
  );
}

function getCoveredProject(hrefArr, projectsParsed) {
  return projectsParsed.find(
    project =>
      hrefArr[0] === project.gitHubOrganization &&
      hrefArr[1] === project.gitHubRepo
  );
}

function getJiraLinks(htmlDoc, projectsParsed, attributeKey, skipPrTitle) {
  const hrefArr = getHrefArr();
  const coveredProject = getCoveredProject(hrefArr, projectsParsed);
  const regex = getRegex(coveredProject.jiraPrefix);

  let prTitleJiraNumbers = [];
  if (!skipPrTitle) {
    const prTitle = htmlDoc.querySelector(prTitleClass);
    prTitleJiraNumbers =
      (prTitle && prTitle.innerText.match(regex)) || prTitleJiraNumbers;
  }

  const header = htmlDoc.querySelector(headerId);
  const tableObjectItem = header && header.querySelector(prInfoClass);
  const branchNameSpan =
    tableObjectItem && tableObjectItem.querySelector(branchNameSpanClass);
  const branchName = branchNameSpan && branchNameSpan.getAttribute('title');
  const branchNameJiraNumbers = (branchName && branchName.match(regex)) || [];

  const firstComment = htmlDoc.querySelector(firstCommentClass);
  const firstCommentJiraNumbers =
    (firstComment && firstComment.innerText.match(regex)) || [];

  const jiraNumbers = [
    ...new Set([
      ...normalizeJiraNumbers(prTitleJiraNumbers),
      ...normalizeJiraNumbers(branchNameJiraNumbers),
      ...normalizeJiraNumbers(firstCommentJiraNumbers),
    ]),
  ];

  return getJiraLinksFromJiraNumbers(jiraNumbers, attributeKey, coveredProject);
}

function getRegex(jiraPrefix) {
  return new RegExp(`${jiraPrefix}(?:-| )\\d+`, 'gi');
}

function normalizeJiraNumber(jiraNumber) {
  return jiraNumber.replace(' ', '-').toUpperCase();
}

function normalizeJiraNumbers(jiraNumbers) {
  return jiraNumbers.map(jiraNumber => normalizeJiraNumber(jiraNumber));
}

function getJiraLinksFromJiraNumbers(
  jiraNumbers,
  attributeKey,
  coveredProject
) {
  if (!jiraNumbers || !jiraNumbers.length) return [];
  return jiraNumbers.map(jiraNumber => {
    jiraNumber = normalizeJiraNumber(jiraNumber);
    const jiraUrl = `https://${
      coveredProject.jiraOrganization
    }.atlassian.net/browse/${jiraNumber}`;
    const aEl = document.createElement('a');
    aEl.setAttribute(attributeKey, gitHubJiraLinkA);
    aEl.setAttribute('href', jiraUrl);
    aEl.setAttribute('target', '_blank');
    aEl.innerHTML = `JIRA ${jiraNumber.toUpperCase()}`;
    const spanEl = document.createElement('span');
    spanEl.setAttribute(attributeKey, gitHubJiraLinkSpan);
    spanEl.appendChild(aEl);

    return spanEl;
  });
}

function handlePrShowLinks(jiraLinks) {
  const header = document.querySelector(headerId);
  const tableObjectItem = header && header.querySelector(prInfoClass);
  jiraLinks.forEach(jiraLink => {
    tableObjectItem.append(jiraLink);
  });
}

function handlePrListLinks(prLinks, projectsParsed) {
  return Promise.all(
    prLinks.map(prLink => {
      const href = prLink.getAttribute('href');

      const cachedJiraLinks = jiraLinkCache.get(href);
      if (cachedJiraLinks) {
        insertJiraLinks(cachedJiraLinks, prLink);
        return Promise.resolve();
      }

      const hrefArr = getHrefArr();
      const coveredProject = getCoveredProject(hrefArr, projectsParsed);
      const regex = getRegex(coveredProject.jiraPrefix);
      const jiraNumbersFromInnerHtml = prLink.innerHTML.match(regex);
      const jiraLinksFromInnerHtml = getJiraLinksFromJiraNumbers(
        jiraNumbersFromInnerHtml,
        'class',
        coveredProject
      );
      if (jiraLinksFromInnerHtml.length) {
        insertJiraLinks(jiraLinksFromInnerHtml, prLink);
      }

      return fetch(`https://github.com${href}`).then(response => {
        response.text().then(responseText => {
          const htmlDoc = parser.parseFromString(responseText, 'text/html');
          const jiraLinks = getJiraLinks(
            htmlDoc,
            projectsParsed,
            'class',
            true
          );
          const differenceLinks = getDifference(
            jiraLinks,
            jiraLinksFromInnerHtml
          );
          jiraLinkCache.set(href, [
            ...jiraLinksFromInnerHtml,
            ...differenceLinks,
          ]);
          insertJiraLinks(differenceLinks, prLink);
        });
      });
    })
  );
}

function insertJiraLinks(jiraLinks, prLink) {
  jiraLinks.forEach(jiraLink => {
    const parentElement = prLink.parentElement;
    const nextNextNextSibling = prLink.nextSibling.nextSibling.nextSibling;
    parentElement.insertBefore(jiraLink, nextNextNextSibling);
  });
}

function getDifference(jiraLinks1, jiraLinks2) {
  const jiraLinks2Hrefs = jiraLinks2.map(jiraLink => getJiraLinkHref(jiraLink));
  return jiraLinks1.filter(
    jiraLink => !jiraLinks2Hrefs.includes(getJiraLinkHref(jiraLink))
  );
}

function getJiraLinkHref(jiraLink) {
  return jiraLink.querySelector('a').getAttribute('href');
}
