let client;
try {
  client = chrome;
} catch {
  client = browser;
}

const hrefFilterSet = new Set([
  'https:',
  'http:',
  '',
  'www.github.com',
  'github.com',
]);

function getHrefArr() {
  return window.location.href
    .split('/')
    .filter(string => !hrefFilterSet.has(string));
}

const parser = new DOMParser();

const fetchedPrs = {};

client.storage.sync.get({ projects: '[]' }, function(options) {
  const { projects } = options;
  const projectsParsed = JSON.parse(projects);
  const mainScript = () => {
    const hrefArr = getHrefArr();
    const coveredProject = getCoveredProject(hrefArr, projectsParsed);
    if (
      hrefArr[2] === 'pull' &&
      coveredProject &&
      !document.querySelector('#gitHubJiraLink__a')
    ) {
      const partialDiscussionHeader = document.querySelector(
        '#partial-discussion-header'
      );
      const tableObjectItem =
        partialDiscussionHeader &&
        partialDiscussionHeader.querySelector('.TableObject-item--primary');
      const branchNameSpan =
        tableObjectItem &&
        tableObjectItem.querySelector(
          '.commit-ref.css-truncate.user-select-contain.expandable.head-ref'
        );
      const branchName = branchNameSpan && branchNameSpan.getAttribute('title');

      const jiraNumbers =
        branchName &&
        branchName
          .split('/')
          .filter(
            fragment =>
              fragment
                .slice(0, coveredProject.jiraPrefix.length)
                .toUpperCase() === coveredProject.jiraPrefix.toUpperCase()
          );

      if (!jiraNumbers || !jiraNumbers.length) return;
      jiraNumbers.forEach(jiraNumber => {
        const jiraUrl = `https://${
          coveredProject.jiraOrganization
        }.atlassian.net/browse/${jiraNumber}`;

        const aEl = document.createElement('a');
        aEl.setAttribute('id', 'gitHubJiraLink__a');
        aEl.setAttribute('href', jiraUrl);
        aEl.setAttribute('target', '_blank');
        aEl.innerHTML = `JIRA ${jiraNumber.toUpperCase()}`;
        const spanEl = document.createElement('span');
        spanEl.setAttribute('id', 'gitHubJiraLink__span');
        spanEl.appendChild(aEl);

        tableObjectItem.appendChild(spanEl);
      });
    } else if (
      hrefArr[2] === 'pulls' &&
      coveredProject &&
      !document.querySelector('.gitHubJiraLink__a')
    ) {
      const navigationContainer = document.querySelector(
        '.js-navigation-container.js-active-navigation-container'
      );
      const links = Array.from(
        document.querySelectorAll(
          '.link-gray-dark.v-align-middle.no-underline.h4.js-navigation-open'
        )
      );
      handleLinks(links, projectsParsed);
    }
  };

  setInterval(mainScript, 500);
});

function getCoveredProject(hrefArr, projectsParsed) {
  return projectsParsed.find(
    project =>
      hrefArr[0] === project.gitHubOrganization &&
      hrefArr[1] === project.gitHubRepo
  );
}

async function handleLinks(links, projectsParsed) {
  if (links.length) {
    const [link] = links;
    const href = link.getAttribute('href');
    if (!fetchedPrs[href]) {
      fetchedPrs[href] = true;
      const res = await fetch(`https://github.com${href}`);
      const text = await res.text();
      const htmlDoc = parser.parseFromString(text, 'text/html');
      const jiraLinks = getJiraLinks(htmlDoc, projectsParsed);
      const sliced = links.slice(1);
      jiraLinks.forEach(jiraLink => {
        const parentElement = link.parentElement;
        const nextNextNextSibling = link.nextSibling.nextSibling.nextSibling;
        parentElement.insertBefore(jiraLink, nextNextNextSibling);
      });
      handleLinks(sliced, projectsParsed);
    }
  }
}

function getJiraLinks(htmlDoc, projectsParsed) {
  const partialDiscussionHeader = htmlDoc.querySelector(
    '#partial-discussion-header'
  );
  const tableObjectItem =
    partialDiscussionHeader &&
    partialDiscussionHeader.querySelector('.TableObject-item--primary');
  const branchNameSpan =
    tableObjectItem &&
    tableObjectItem.querySelector(
      '.commit-ref.css-truncate.user-select-contain.expandable.head-ref'
    );
  const branchName = branchNameSpan && branchNameSpan.getAttribute('title');
  const hrefArr = getHrefArr();
  const coveredProject = getCoveredProject(hrefArr, projectsParsed);
  const jiraNumbers =
    branchName &&
    branchName
      .split('/')
      .filter(
        fragment =>
          fragment.slice(0, coveredProject.jiraPrefix.length).toUpperCase() ===
          coveredProject.jiraPrefix.toUpperCase()
      );
  if (!jiraNumbers || !jiraNumbers.length) return [];
  return jiraNumbers.map(jiraNumber => {
    const jiraUrl = `https://${
      coveredProject.jiraOrganization
    }.atlassian.net/browse/${jiraNumber}`;

    const aEl = document.createElement('a');
    aEl.setAttribute('class', 'gitHubJiraLink__a');
    aEl.setAttribute('href', jiraUrl);
    aEl.setAttribute('target', '_blank');
    aEl.innerHTML = `JIRA ${jiraNumber.toUpperCase()}`;
    const spanEl = document.createElement('span');
    spanEl.setAttribute('class', 'gitHubJiraLink__span');
    spanEl.appendChild(aEl);

    return spanEl;
  });
}
