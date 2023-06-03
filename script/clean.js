const fs = require('fs');

fs.rmSync('./dist', {force: true, recursive: true})
fs.rmSync('./lib', {force: true, recursive: true})
fs.rmSync('./types', {force: true, recursive: true})
