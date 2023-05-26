// ts-node test-ts.ts
import QRCode from "../qrcode-encoder/src/index"

let content = "1234😀";
let qr = new QRCode(content);
console.log(qr)
