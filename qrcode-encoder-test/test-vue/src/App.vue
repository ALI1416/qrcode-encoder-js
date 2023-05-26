<script setup>
import {onMounted, ref} from 'vue'
import QRCode from "../../../qrcode-encoder"

const content = ref("1234😀");
const level = ref();
const mode = ref();
const versionNumber = ref();
const tip = ref();
const svg = ref();

function encoder() {
  let contentValue = content.value;
  let levelValue = level.value === "" ? undefined : level.value;
  let modeValue = mode.value === "" ? undefined : mode.value;
  let versionNumberValue = versionNumber.value === "" ? undefined : versionNumber.value;
  tip.value = "内容：" + contentValue + "<br>纠错等级：" + levelValue + "<br>编码模式：" + modeValue + "<br>版本号：" + versionNumberValue;
  try {
    let qr = new QRCode(contentValue, levelValue, modeValue, versionNumberValue);
    svg.value = QrMatrix2Svg(qr.Matrix, 10);
  } catch (e) {
    tip.value += "<br>" + e;
  }
}

onMounted(() => {
  encoder();
})

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
</script>

<template>
  <label for="content">内容：</label><input type="text" id="content" v-model="content"><br>
  <label for="level">纠错等级：</label><input type="number" min="0" max="3" id="level" v-model="level"><br>
  <label for="mode">编码模式：</label><input type="number" min="0" max="3" id="mode" v-model="mode"><br>
  <label for="versionNumber">版本号：</label>
  <input type="number" min="1" max="40" id="versionNumber" v-model="versionNumber"><br>
  <button @click="encoder">生成二维码</button>
  <p v-html="tip"></p>
  <hr>
  <div v-html="svg"></div>
</template>
