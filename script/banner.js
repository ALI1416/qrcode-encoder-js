const fs = require('fs');

let json = getJson('./package.json');

let content = `/*
* project  : ` + json.name + `
* version  : ` + json.version + `
* author   : ` + json.author.name + `[` + json.author.email + `]` + `
* license  : ` + json.license + `
* homepage : ` + json.homepage + `
*/
`;

filePrepend('./dist/qrcode-encoder.js', content);
filePrepend('./dist/qrcode-encoder.min.js', content);

/**
 * 读取json文件
 * @param path 文件路径
 * @return JSON
 */
function getJson(path) {
  return JSON.parse(fs.readFileSync(path).toString());
}

/**
 * 文件头部追加内容
 * @param path 文件路径
 * @param content 追加内容
 */
function filePrepend(path, content) {
  fs.writeFileSync(path, content + fs.readFileSync(path).toString());
}
