import QRCode from "../qrcode-encoder/lib/index.js"
let content = "1234😀";
let qr = new QRCode(content);
console.log(QrMatrix2Svg(qr.Matrix, 10));

/**
 * 二维码boolean[][]转SVG
 * @param bytes boolean[][]
 * @param pixelSize 像素尺寸
 * @return string SVG
 */
function QrMatrix2Svg(bytes, pixelSize) {
  let length = bytes.length;
  let size = (length + 2) * pixelSize;
  let svg = "<svg width=\"" + size + "\" height=\"" + size + "\" viewBox=\"0 0 " + size + " " + size + "\" xmlns=\"http://www.w3.org/2000/svg\">\n";
  for (let x = 0; x < length; x++) {
    for (let y = 0; y < length; y++) {
      if (bytes[x][y]) {
        svg += "<rect x=\"" + (x + 1) * pixelSize + "\" y=\"" + (y + 1) * pixelSize + "\" width=\"" + pixelSize + "\" height=\"" + pixelSize + "\"/>\n";
      }
    }
  }
  svg += "</svg>\n";
  return svg;
}
