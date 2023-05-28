// node test-js.js
// let QRCode = require("../dist/qrcode-encoder.js");
let QRCode = require("../dist/qrcode-encoder.min.js");
let content = "1234😀";
let qr = new QRCode(content);
console.log(QrMatrix2SvgPath(qr.Matrix, 10));

/**
 * 二维码boolean[][]转SVG路径
 * @param bytes boolean[][]
 * @param pixelSize 像素尺寸
 * @return string SVG
 */
function QrMatrix2SvgPath(bytes, pixelSize) {
  let length = bytes.length;
  let size = (length + 2) * pixelSize;
  let svg = "<svg width=\"" + size + "\" height=\"" + size + "\" viewBox=\"0 0 " + size + " " + size + "\" xmlns=\"http://www.w3.org/2000/svg\">\n";
  svg += "<path d=\"\n";
  for (let x = 0; x < length; x++) {
    for (let y = 0; y < length; y++) {
      if (bytes[x][y]) {
        let xx = (x + 1) * pixelSize;
        let yy = (y + 1) * pixelSize;
        svg += "M" + xx + " " + yy + "H" + (xx + pixelSize) + "V" + (yy + pixelSize) + "H" + xx + "z\n"
      }
    }
  }
  svg += "\"/>";
  svg += "</svg>\n";
  return svg;
}
