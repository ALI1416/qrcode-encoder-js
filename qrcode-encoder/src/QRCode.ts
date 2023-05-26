import {Version} from "./Version";
import {MaskPattern} from "./MaskPattern";
import {Encoder} from './ReedSolomon'
import * as QRCodeUtils from './QRCodeUtils'

/**
 * 二维码
 * @version 2023/05/18 11:11:11
 * @author ALI[ali-k&#64;foxmail.com]
 * @since 1.0.0
 */
class QRCode {

  /**
   * 纠错等级
   */
  readonly Level: number;
  /**
   * 编码模式
   */
  readonly Mode: number;
  /**
   * 版本
   */
  readonly Version: Version;
  /**
   * 版本号
   */
  readonly VersionNumber: number;
  /**
   * 掩模模板
   */
  readonly MaskPattern: MaskPattern;
  /**
   * 掩模模板号
   */
  readonly MaskPatternNumber: number;
  /**
   * 矩阵
   * @description false白 true黑
   */
  readonly Matrix: boolean[][];

  /**
   * 构造二维码
   * @param content 内容
   * @param level 纠错等级
   *   0 L 7%
   *   1 M 15%
   *   2 Q 25%
   *   3 H 30%
   * @param mode 编码模式
   *   0 NUMERIC 数字0-9
   *   1 ALPHANUMERIC 数字0-9、大写字母A-Z、符号(空格)$%*+-./:
   *   2 BYTE(ISO-8859-1)
   *   3 BYTE(UTF-8)
   * @param versionNumber 版本号(默认最小版本)
   *   [1,40]
   */
  constructor(content: string, level?: number, mode?: number, versionNumber?: number) {
    /* 数据 */
    // 纠错等级
    if (typeof level == "undefined") {
      level = 0;
    } else if (level < 0 || level > 3) {
      throw new Error("纠错等级 " + level + " 不合法！应为 [0,3]");
    }
    this.Level = level;
    // 编码模式
    if (typeof mode == "undefined") {
      mode = DetectionMode(content);
    } else if (mode < 0 || mode > 3) {
      throw new Error("编码模式 " + mode + " 不合法！应为 [0,3]");
    } else {
      let detectionMode = DetectionMode(content);
      if (mode < detectionMode) {
        throw new Error("编码模式 " + mode + " 太小！最小为 " + detectionMode);
      }
    }
    this.Mode = mode;
    // 内容bytes
    let contentBytes = QRCodeUtils.GetUtf8Bytes(content);
    // 版本
    this.Version = new Version(contentBytes.length, level, mode, versionNumber);
    this.VersionNumber = this.Version.VersionNumber;
    // 数据bits
    let dataBits: boolean[] = [];
    // 填充数据
    switch (mode) {
      // 填充编码模式为NUMERIC的数据
      case 0: {
        ModeNumbers(dataBits, contentBytes, this.Version);
        break;
      }
      // 填充编码模式为ALPHANUMERIC的数据
      case 1: {
        ModeAlphaNumeric(dataBits, contentBytes, this.Version);
        break;
      }
      // 填充编码模式为BYTE编码格式为ISO-8859-1的数据
      case 2: {
        ModeByteIso88591(dataBits, contentBytes, this.Version);
        break;
      }
      // 填充编码模式为BYTE编码格式为UTF-8的数据
      default: {
        ModeByteUtf8(dataBits, contentBytes, this.Version);
        break;
      }
    }
    /* 纠错 */
    let ec: number[][] = this.Version.Ec;
    // 数据块数 或 纠错块数
    let blocks = 0;
    for (let ec of this.Version.Ec) {
      blocks += ec[0];
    }
    // 纠错块字节数
    let ecBlockBytes = Math.floor((this.Version.DataAndEcBits - this.Version.DataBits) / 8 / blocks);
    let dataBlocks = [];
    let ecBlocks = [];
    let blockNum = 0;
    let dataByteNum = 0;
    for (let e of ec) {
      let count = e[0];
      let dataBytes = e[1];
      for (let j = 0; j < count; j++) {
        // 数据块
        let dataBlock = QRCodeUtils.GetBytes(dataBits, dataByteNum * 8, dataBytes);
        dataBlocks[blockNum] = dataBlock;
        // 纠错块
        ecBlocks[blockNum] = Encoder(dataBlock, ecBlockBytes);
        blockNum++;
        dataByteNum += dataBytes;
      }
    }

    /* 交叉数据和纠错 */
    let dataAndEcBits: boolean[] = [];
    let dataBlockMaxBytes = dataBlocks[blocks - 1].length;
    let dataAndEcBitPtr = 0;
    for (let i = 0; i < dataBlockMaxBytes; i++) {
      for (let j = 0; j < blocks; j++) {
        if (dataBlocks[j].length > i) {
          QRCodeUtils.AddBits(dataAndEcBits, dataAndEcBitPtr, dataBlocks[j][i], 8);
          dataAndEcBitPtr += 8;
        }
      }
    }
    for (let i = 0; i < ecBlockBytes; i++) {
      for (let j = 0; j < blocks; j++) {
        QRCodeUtils.AddBits(dataAndEcBits, dataAndEcBitPtr, ecBlocks[j][i], 8);
        dataAndEcBitPtr += 8;
      }
    }

    /* 构造掩模模板 */
    this.MaskPattern = new MaskPattern(dataAndEcBits, this.Version, level);
    this.MaskPatternNumber = this.MaskPattern.Best;
    this.Matrix = QRCodeUtils.Convert(this.MaskPattern.Patterns[this.MaskPatternNumber], this.Version.Dimension);
  }
}

/**
 * 数字0xEC
 * @description 数据来源 ISO/IEC 18004-2015 -> 7.4.10 -> 11101100
 */
const NUMBER_0xEC_8BITS: boolean[] = QRCodeUtils.GetBits(0xEC, 8);
/**
 * 数字0x11
 * @description 数据来源 ISO/IEC 18004-2015 -> 7.4.10 -> 00010001
 */
const NUMBER_0x11_8BITS: boolean[] = QRCodeUtils.GetBits(0x11, 8);
/**
 * ALPHANUMERIC模式映射表
 * @description 数字0-9 [0x30,0x39] [0,9]
 * @description 大写字母A-Z [0x41,0x5A] [10,35]
 * @description (空格) [0x20] [36]
 * @description $ [0x24] [37]
 * @description % [0x25] [38]
 * @description * [0x2A] [39]
 * @description + [0x2B] [40]
 * @description - [0x2D] [41]
 * @description . [0x2E] [42]
 * @description / [0x2F] [43]
 * @description : [0x3A] [44]
 * @description 数据来源 ISO/IEC 18004-2015 -> 7.4.5 -> Table 6
 */
const ALPHA_NUMERIC_TABLE: number[] = [
  127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, // 0x00-0x0F
  127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, // 0x10-0x1F
  36, 127, 127, 127, 37, 38, 127, 127, 127, 127, 39, 40, 127, 41, 42, 43, // 0x20-0x2F
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 44, 127, 127, 127, 127, 127, // 0x30-0x3F
  127, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, // 0x40-0x4F
  25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 127, 127, 127, 127, 127, // 0x50-0x5F
  127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, // 0x60-0x6F
  127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, 127, // 0x70-0x7F
]

/**
 * 填充编码模式为NUMERIC的数据
 * @param dataBits 数据bits
 * @param contentBytes 内容bytes
 * @param version 版本
 */
function ModeNumbers(dataBits: boolean[], contentBytes: number[], version: Version) {
  // 数据指针
  let ptr = 0;
  // 模式指示符(4bit) NUMERIC 0b0001=1
  // 数据来源 ISO/IEC 18004-2015 -> 7.4.1 -> Table 2 -> QR Code symbols列Numbers行
  QRCodeUtils.AddBits(dataBits, ptr, 1, 4);
  ptr += 4;
  // 内容字节数
  let contentLength = contentBytes.length;
  // `内容字节数`bit数(10/12/14bit)
  let contentBytesBits = version.ContentBytesBits;
  QRCodeUtils.AddBits(dataBits, ptr, contentLength, contentBytesBits);
  ptr += contentBytesBits;
  // 内容 3个字符10bit 2个字符7bit 1个字符4bit
  for (let i = 0; i < contentLength - 2; i += 3) {
    QRCodeUtils.AddBits(dataBits, ptr, (contentBytes[i] - 48) * 100 + (contentBytes[i + 1] - 48) * 10 + contentBytes[i + 2] - 48, 10);
    ptr += 10;
  }
  switch (contentLength % 3) {
    case 2: {
      QRCodeUtils.AddBits(dataBits, ptr, (contentBytes[contentLength - 2] - 48) * 10 + contentBytes[contentLength - 1] - 48, 7);
      ptr += 7;
      break;
    }
    case 1: {
      QRCodeUtils.AddBits(dataBits, ptr, contentBytes[contentLength - 1] - 48, 4);
      ptr += 4;
      break;
    }
  }
  // 结束符和补齐符
  TerminatorAndPadding(dataBits, version.DataBits, ptr);
}

/**
 * 填充编码模式为ALPHANUMERIC的数据
 * @param dataBits 数据bits
 * @param contentBytes 内容bytes
 * @param version 版本
 */
function ModeAlphaNumeric(dataBits: boolean[], contentBytes: number[], version: Version) {
  // 数据指针
  let ptr = 0;
  // 模式指示符(4bit) ALPHANUMERIC 0b0010=2
  // 数据来源 ISO/IEC 18004-2015 -> 7.4.1 -> Table 2 -> QR Code symbols列Alphanumeric行
  QRCodeUtils.AddBits(dataBits, ptr, 2, 4);
  ptr += 4;
  // 内容字节数
  let contentLength = contentBytes.length;
  // `内容字节数`bit数(9/11/13bit)
  let contentBytesBits = version.ContentBytesBits;
  QRCodeUtils.AddBits(dataBits, ptr, contentLength, contentBytesBits);
  ptr += contentBytesBits;
  // 内容 2个字符11bit 1个字符6bit
  for (let i = 0; i < contentLength - 1; i += 2) {
    QRCodeUtils.AddBits(dataBits, ptr, ALPHA_NUMERIC_TABLE[contentBytes[i]] * 45 + ALPHA_NUMERIC_TABLE[contentBytes[i + 1]], 11);
    ptr += 11;
  }
  if (contentLength % 2 == 1) {
    QRCodeUtils.AddBits(dataBits, ptr, ALPHA_NUMERIC_TABLE[contentBytes[contentLength - 1]], 6);
    ptr += 6;
  }
  // 结束符和补齐符
  TerminatorAndPadding(dataBits, version.DataBits, ptr);
}

/**
 * 填充编码模式为BYTE编码格式为ISO-8859-1的数据
 * @param dataBits 数据bits
 * @param contentBytes 内容bytes
 * @param version 版本
 */
function ModeByteIso88591(dataBits: boolean[], contentBytes: number[], version: Version) {
  // 数据指针
  let ptr = 0;
  // 模式指示符(4bit) BYTE 0b0100=4
  // 数据来源 ISO/IEC 18004-2015 -> 7.4.1 -> Table 2 -> QR Code symbols列Byte行
  QRCodeUtils.AddBits(dataBits, ptr, 4, 4);
  ptr += 4;
  // 内容字节数
  let contentLength = contentBytes.length;
  // `内容字节数`bit数(8/16bit)
  let contentBytesBits = version.ContentBytesBits;
  QRCodeUtils.AddBits(dataBits, ptr, contentLength, contentBytesBits);
  ptr += contentBytesBits;
  // 内容
  for (let i = 0; i < contentLength; i++) {
    QRCodeUtils.AddBits(dataBits, ptr, contentBytes[i], 8);
    ptr += 8;
  }
  // 结束符和补齐符
  TerminatorAndPadding(dataBits, version.DataBits, ptr);
}

/**
 * 填充编码模式为BYTE编码格式为UTF-8的数据
 * @param dataBits 数据bits
 * @param contentBytes 内容bytes
 * @param version 版本
 */
function ModeByteUtf8(dataBits: boolean[], contentBytes: number[], version: Version) {
  // 数据指针
  let ptr = 0;
  // ECI模式指示符(4bit) 0b0111=7
  // 数据来源 ISO/IEC 18004-2015 -> 7.4.1 -> Table 2 -> QR Code symbols列ECI行
  QRCodeUtils.AddBits(dataBits, ptr, 7, 4);
  ptr += 4;
  // ECI指定符 UTF-8(8bit) 0b00011010=26
  // 数据来源 ?
  QRCodeUtils.AddBits(dataBits, ptr, 26, 8);
  ptr += 8;
  // 模式指示符(4bit) BYTE 0b0100=4
  // 数据来源 ISO/IEC 18004-2015 -> 7.4.1 -> Table 2 -> QR Code symbols列Byte行
  QRCodeUtils.AddBits(dataBits, ptr, 4, 4);
  ptr += 4;
  // 内容字节数
  let contentLength = contentBytes.length;
  // `内容字节数`bit数(8/16bit)
  let contentBytesBits = version.ContentBytesBits;
  QRCodeUtils.AddBits(dataBits, ptr, contentLength, contentBytesBits);
  ptr += contentBytesBits;
  // 内容
  for (let i = 0; i < contentLength; i++) {
    QRCodeUtils.AddBits(dataBits, ptr, contentBytes[i], 8);
    ptr += 8;
  }
  // 结束符和补齐符
  TerminatorAndPadding(dataBits, version.DataBits, ptr);
}

/**
 * 结束符和补齐符
 * @param data 数据bits
 * @param dataBits 数据bits数
 * @param ptr 数据指针
 */
function TerminatorAndPadding(data: boolean[], dataBits: number, ptr: number) {
  // 如果有刚好填满，则不需要结束符和补齐符
  // 如果还剩1-8bit，需要1-8bit结束符，不用补齐符
  // 如果还剩8+bit，先填充4bit结束符，再填充结束符使8bit对齐，再交替补齐符至填满
  if (dataBits - ptr > 7) {
    let temp = ptr;
    // 结束符(4bit)
    // 数据来源 ISO/IEC 18004-2015 -> 7.4.9
    ptr += 4;
    // 结束符(8bit对齐)
    ptr = ((Math.floor((ptr - 1) / 8)) + 1) * 8;
    for (let i = 0; i < ptr - temp; i++) {
      data.push(false);
    }
    // 补齐符 交替0b11101100=0xEC和0b00010001=0x11至填满
    // 数据来源 ISO/IEC 18004-2015 -> 7.4.10
    let count = (dataBits - ptr) / 8;
    for (let i = 0; i < count; i++) {
      if (i % 2 == 0) {
        data.push(...NUMBER_0xEC_8BITS)
      } else {
        data.push(...NUMBER_0x11_8BITS)
      }
    }
  }
}

function DetectionMode(content: string): number {
  let length = content.length;
  // 为了与ZXing结果保持一致，长度为0时使用BYTE(ISO-8859-1)编码
  if (length == 0) {
    return 2;
  }
  // BYTE(UTF-8)
  for (let i = 0; i < length; i++) {
    if (content.charCodeAt(i) > 255) {
      return 3;
    }
  }
  // BYTE(ISO-8859-1)
  for (let i = 0; i < length; i++) {
    if (content.charCodeAt(i) > 127 || ALPHA_NUMERIC_TABLE[content.charCodeAt(i)] > 44) {
      return 2;
    }
  }
  // ALPHANUMERIC 数字0-9、大写字母A-Z、符号(空格)$%*+-./:
  for (let i = 0; i < length; i++) {
    if (ALPHA_NUMERIC_TABLE[content.charCodeAt(i)] > 9) {
      return 1;
    }
  }
  // NUMERIC 数字0-9
  return 0;
}

export {QRCode}
