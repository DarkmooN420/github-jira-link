let client;
try {
  client = chrome;
} catch {
  client = browser;
}

function saveOptions(e) {
  e.preventDefault();
  client.storage.sync.get({ projects: '[]' }, function(options) {
    const { projects } = options;
    const projectsParsed = JSON.parse(projects);
    projectsParsed.push(getProject());
    client.storage.sync.set(
      { projects: JSON.stringify(projectsParsed) },
      function() {
        displayMessage('Project saved.');
        getOptions();
        clearInputs();
      }
    );
  });
}

function getOptions() {
  client.storage.sync.get({ projects: '[]' }, function(options) {
    const { projects } = options;
    projectsParsed = JSON.parse(projects);
    const currentProjects = document.querySelector('#currentProjects');
    currentProjects.innerHTML = '';
    if (projectsParsed.length) {
      bEl = document.createElement('b');
      bEl.innerHTML = 'My projects';
      currentProjects.appendChild(bEl);
    }
    projectsParsed.forEach(function(project, idx) {
      const liEl = document.createElement('li');

      const pEl = document.createElement('p');
      const spanEl = document.createElement('span');
      spanEl.innerHTML = `Project ${idx + 1} `;
      const deleteButtonEl = document.createElement('button');
      deleteButtonEl.onclick = handleDeleteProject(idx);
      deleteButtonEl.innerHTML = 'x';
      pEl.appendChild(spanEl);
      pEl.appendChild(deleteButtonEl);

      liEl.appendChild(pEl);

      const ulEl = document.createElement('ul');
      for (attribute in project) {
        const innerLiEl = document.createElement('li');
        innerLiEl.innerHTML = `${attribute}: ${project[attribute]}`;
        ulEl.appendChild(innerLiEl);
      }
      liEl.appendChild(ulEl);

      currentProjects.appendChild(liEl);
    });
  });
}

function handleDeleteProject(idx) {
  return function() {
    client.storage.sync.get({ projects: '[]' }, function(options) {
      const { projects } = options;
      projectsParsed = JSON.parse(projects);
      projectsParsed.splice(idx, 1);

      client.storage.sync.set(
        { projects: JSON.stringify(projectsParsed) },
        function() {
          displayMessage('Project deleted.');
          getOptions();
        }
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
  INPUTS.forEach(function(input) {
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

function displayMessage(message) {
  const status = document.querySelector('#status');
  status.textContent = 'Project saved.';
  setTimeout(function() {
    status.textContent = '';
  }, 1500);
}

function clearInputs() {
  const inputs = getInputs();
  for (let inputName in inputs) {
    inputs[inputName].value = '';
    const saveButton = document.querySelector('#save');
    saveButton.disabled = true;
  }
}

window.onload = getOptions;
document.querySelector('#save').onclick = saveOptions;

const inputsArray = Object.values(getInputs());
function checkEveryInput() {
  const saveButton = document.querySelector('#save');
  if (inputsArray.every(otherInput => otherInput.value)) {
    saveButton.disabled = false;
  } else {
    saveButton.disabled = true;
  }
}
inputsArray.forEach(input => {
  input.onchange = checkEveryInput;
});
