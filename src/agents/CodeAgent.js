'use strict';

class CodeAgent {
  static async generate(projectConfig) {
    if (!projectConfig || typeof projectConfig !== 'object') {
      throw new Error('Invalid project configuration');
    }

    const files = [];

    /* ----------------------- Base HTML ----------------------- */
    files.push({
      path: 'index.html',
      content: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${projectConfig.name || 'Generated Project'}</title>
  <link rel="stylesheet" href="./styles/main.css">
</head>
<body>
  <div id="app"></div>
  <script src="./scripts/main.js"></script>
</body>
</html>
      `.trim()
    });

    /* ----------------------- CSS ----------------------------- */
    files.push({
      path: 'styles/main.css',
      content: `
body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
}
      `.trim()
    });

    /* ----------------------- JS ------------------------------ */
    files.push({
      path: 'scripts/main.js',
      content: `
document.getElementById('app').innerHTML = '<h1>Project Ready</h1>';
      `.trim()
    });

    return files;
  }
}

module.exports = CodeAgent;
