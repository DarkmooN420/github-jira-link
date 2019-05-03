let client;
try {
  client = chrome;
} catch {
  client = browser;
}

function saveOptions(e) {
  e.preventDefault();
  const saveButton = document.querySelector('#save');
  if (saveButton.getAttribute('class') === 'button__save--disabled') return;
  client.storage.sync.get({ projects: '[]' }, options => {
    const { projects } = options;
    const projectsParsed = JSON.parse(projects);
    projectsParsed.push(getProject());
    client.storage.sync.set(
      { projects: JSON.stringify(projectsParsed) },
      () => {
        getOptions();
        clearInputs();
      }
    );
  });
}

function getOptions() {
  client.storage.sync.get({ projects: '[]' }, options => {
    const { projects } = options;
    projectsParsed = JSON.parse(projects);
    const currentProjects = document.querySelector('#currentProjects');
    currentProjects.innerHTML = '';
    if (projectsParsed.length) {
      h2El = document.createElement('h2');
      h2El.innerHTML = 'My projects';
      currentProjects.appendChild(h2El);
    }
    projectsParsed.forEach((project, idx) => {
      const liEl = document.createElement('li');
      liEl.setAttribute('class', 'li--projectWrapper');

      const divEl = document.createElement('div');
      divEl.setAttribute('class', 'div--project');
      const spanEl = document.createElement('span');
      spanEl.innerHTML = `Project ${idx + 1}`;
      const deleteButtonEl = document.createElement('button');
      deleteButtonEl.onclick = handleDeleteProject(idx);
      deleteButtonEl.innerHTML = '&times;';
      deleteButtonEl.setAttribute('class', 'button--delete');
      divEl.appendChild(spanEl);
      divEl.appendChild(deleteButtonEl);

      liEl.appendChild(divEl);

      const ulEl = document.createElement('ul');
      ulEl.setAttribute('class', 'ul--project');
      for (attribute in project) {
        const innerLiEl = document.createElement('li');
        innerLiEl.innerHTML = `<p class="ul__p ul__p--attributeName">${convertCamelCase(
          attribute
        )}</p><class="ul__p ul__p--attribute">${project[attribute]}</p>`;
        innerLiEl.setAttribute('class', 'li--projectItem');
        ulEl.appendChild(innerLiEl);
      }
      liEl.appendChild(ulEl);

      currentProjects.appendChild(liEl);
    });
  });
}

function handleDeleteProject(idx) {
  return function() {
    client.storage.sync.get({ projects: '[]' }, options => {
      const { projects } = options;
      projectsParsed = JSON.parse(projects);
      projectsParsed.splice(idx, 1);

      client.storage.sync.set(
        { projects: JSON.stringify(projectsParsed) },
        getOptions
      );
    });
  };
}

const INPUTS = [
  'gitHubOrganization',
  'gitHubRepo',
  'jiraOrganization',
  'jiraPrefix',
];

function getInputs() {
  const inputs = {};
  INPUTS.forEach(input => {
    inputs[input] = document.querySelector(`#${input}`);
  });
  return inputs;
}

function getProject() {
  const inputs = getInputs();
  const project = {};
  for (inputName in inputs) {
    project[inputName] = inputs[inputName].value;
  }
  return project;
}

function clearInputs() {
  const inputs = getInputs();
  for (let inputName in inputs) {
    inputs[inputName].value = '';
    const saveButton = document.querySelector('#save');
    saveButton.setAttribute('class', 'button__save--disabled');
  }
}

function convertCamelCase(string) {
  // Adapted from https://stackoverflow.com/questions/30521224/javascript-convert-pascalcase-to-underscore-case
  const camelCaseString = string
    .replace(/(?:^|\.?)([A-Z])/g, (x, y) => {
      return '_' + y.toLowerCase();
    })
    .replace(/^_/, '');
  return camelCaseString
    .split('_')
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ')
    .replace('Git Hub', 'GitHub');
}

window.onload = getOptions;
document.querySelector('#save').onclick = saveOptions;

const inputsArray = Object.values(getInputs());
function checkEveryInput() {
  const saveButton = document.querySelector('#save');
  if (inputsArray.every(otherInput => otherInput.value)) {
    saveButton.setAttribute('class', '');
  } else {
    saveButton.setAttribute('class', 'button__save--disabled');
  }
}
inputsArray.forEach(input => {
  input.onchange = checkEveryInput;
});
