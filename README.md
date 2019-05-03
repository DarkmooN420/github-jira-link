# GitHub-Jira Link

## Installation

### Chrome

1. Clone this repo.
1. From this directory, run `./prepare_release` to create Chrome and Firefox release.
1. Go to `chrome://extensions`.
1. Click 'Load unpacked'.
1. Select `chrome/` directory.
1. Click 'Open'.
1. Click on the new GitHub-Jira-Link icon next to the address bar.
1. Click 'Options'.
1. Enter your GitHub organization name (the string after `github.com/` in a pull request URL).
1. Enter your GitHub repo name (the string after the GitHub organization name in a pull request URL).
1. Enter your Jira organization name (the string before `.atlassian.net` in a Jira ticket URL).
1. Enter the Jira ticket prefix (the letters before `-` in the ticket number).
1. Click 'Save'.

### Firefox

1. Clone this repo.
1. From this directory, run `./prepare_release` to create Chrome and Firefox release.
1. Go to `about:debugging`.
1. Click 'Load Temporary Add-on...'.
1. Select `firefox/manifest.json`.
1. Go to `about:addons`.
1. Click 'Preferences' for the GitHub-Jira Link extension.
1. Enter your GitHub organization name (the string after `github.com/` in a pull request URL).
1. Enter your GitHub repo name (the string after the GitHub organization name in a pull request URL).
1. Enter your Jira organization name (the string before `.atlassian.net` in a Jira ticket URL).
1. Enter the Jira ticket prefix (the letters before `-` in the ticket number).
1. Click 'Save'.

(These steps have to be repeated whenever Firefox is restarted.)
