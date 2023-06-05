// node test-node.js
const {QRCode} = require('../dist/qrcode-encoder.node.js')
const content = "1234😀";
const qr = new QRCode(content);
console.log(qr);
