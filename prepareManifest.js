var fs = require('fs');

fs.readFile('manifest.json', 'utf8', function(err, contents) {
  fs.writeFile('manifest_firefox.json', contents, () => {});
  const manifestChrome = JSON.parse(contents);
  delete manifestChrome.applications;
  fs.writeFile(
    'manifest_chrome.json',
    JSON.stringify(manifestChrome),
    () => {}
  );
});
