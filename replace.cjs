const fs = require('fs');

function replaceInFile(path) {
    let content = fs.readFileSync(path, 'utf8');

    content = content.replace(/#1e293b/g, '#0A1224');

    fs.writeFileSync(path, content, 'utf8');
}

replaceInFile('src/App.tsx');
console.log('Replaced successfully');
