# QR Code Encoder For JavaScript 二维码生成器JavaScript版

[![License](https://img.shields.io/github/license/ALI1416/qrcode-encoder-js?label=License)](https://www.apache.org/licenses/LICENSE-2.0.txt)
[![Node Support](https://img.shields.io/badge/Node-14+-green)](https://nodejs.org/)
[![NPM](https://img.shields.io/npm/v/@ali1416/qrcode-encoder?label=NPM)](https://www.npmjs.com/package/@ali1416/qrcode-encoder)
[![Tag](https://img.shields.io/github/v/tag/ALI1416/qrcode-encoder-js?label=Tag)](https://github.com/ALI1416/qrcode-encoder-js/tags)
[![Repo Size](https://img.shields.io/github/repo-size/ALI1416/qrcode-encoder-js?label=Repo%20Size&color=success)](https://github.com/ALI1416/qrcode-encoder-js/archive/refs/heads/master.zip)

[![Node CI](https://github.com/ALI1416/qrcode-encoder-js/actions/workflows/ci.yml/badge.svg)](https://github.com/ALI1416/qrcode-encoder-js/actions/workflows/ci.yml)

## 简介

本项目迁移自[ALI1416/QRCodeEncoder.Net](https://github.com/ALI1416/QRCodeEncoder.Net)，只编写了生成器部分，并对处理逻辑进行了大量优化，构建后`qrcode-encoder.min.js`文件仅`15kb`

注意：本项目不提供二维码绘制方法，如需绘制请看`使用示例`

### 其他语言项目

- `.Net` : [ALI1416/QRCodeEncoder.Net](https://github.com/ALI1416/QRCodeEncoder.Net)
- `Java` : [ALI1416/qrcode-encoder](https://github.com/ALI1416/qrcode-encoder)

## 依赖导入

### 网页

<https://unpkg.com/@ali1416/qrcode-encoder@1.1.0/dist/qrcode-encoder.min.js>

### node

```sh
npm install @ali1416/qrcode-encoder@1.1.0
```

## 方法和参数

### 二维码 QRCode

| 参数名        | 中文名   | 类型   | 默认值     |
| ------------- | -------- | ------ | ---------- |
| content       | 内容     | string | (无)       |
| level         | 纠错等级 | number | 0          |
| mode          | 编码模式 | number | (自动探测) |
| versionNumber | 版本号   | number | (最小版本) |

### 版本 Version

| 参数名        | 中文名     | 类型   | 默认值     |
| ------------- | ---------- | ------ | ---------- |
| length        | 内容字节数 | number | (无)       |
| level         | 纠错等级   | number | (无)       |
| mode          | 编码模式   | number | (无)       |
| versionNumber | 版本号     | number | (最小版本) |

### 掩模模板 MaskPattern

| 参数名  | 中文名   | 类型      |
| ------- | -------- | --------- |
| data    | 数据     | boolean[] |
| version | 版本     | Version   |
| level   | 纠错等级 | number    |

### 纠错等级 level

| 值  | 等级 | 纠错率 |
| --- | ---- | ------ |
| 0   | L    | 7%     |
| 1   | M    | 15%    |
| 2   | Q    | 25%    |
| 3   | H    | 30%    |

### 编码模式 mode

| 值  | 模式             | 备注                                     |
| --- | ---------------- | ---------------------------------------- |
| 0   | NUMERIC          | 数字0-9                                  |
| 1   | ALPHANUMERIC     | 数字0-9、大写字母A-Z、符号(空格)$%*+-./: |
| 2   | BYTE(ISO-8859-1) | 兼容ASCII                                |
| 3   | BYTE(UTF-8)      |                                          |

### 版本号 versionNumber

取值范围：`[1,40]`

## 使用示例

```js
// node test-js.js
const QRCode = require("../dist/qrcode-encoder.js");
const content = "1234😀";
const qr = new QRCode(content);
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
```

更多请见[测试](./test)

## 更新日志

[点击查看](./CHANGELOG.md)

## 参考

- [ALI1416/QRCodeEncoder.Net](https://github.com/ALI1416/QRCodeEncoder.Net)

## 关于

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://www.404z.cn/images/about.dark.svg">
  <img alt="About" src="https://www.404z.cn/images/about.light.svg">
</picture>
