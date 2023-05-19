/**
 * 版本
 * @version 2023/05/18 11:11:11
 * @author ALI[ali-k&#64;foxmail.com]
 * @since 1.0.0
 */
class Version {

  /**
   * 版本号
   * @description [1,40]
   */
  readonly VersionNumber: number
  /**
   * 尺寸
   * [21,177]
   * @description 尺寸 = (版本号 - 1) * 4 + 21
   */
  readonly Dimension: number
  /**
   * `内容字节数`bit数
   */
  readonly ContentBytesBits: number
  /**
   * 数据bit数
   * @description ECI模式指示符+ECI指定符+模式指示符+`内容字节数`bit数+内容+结束符+补齐符
   */
  readonly DataBits: number
  /**
   * 数据和纠错bit数
   * @description 数据bit数+纠错bit数
   */
  readonly DataAndEcBits: number
  /**
   * 纠错
   * @description [纠错块,(块数量,纠错码)]
   */
  readonly Ec: number[][]

  /**
   * 构造版本
   * @param length 内容字节数
   * @param level 纠错等级
   *   0 L 7%
   *   1 M 15%
   *   2 Q 25%
   *   3 H 30%
   * @param mode 编码模式
   *   0 NUMERIC 数字0-9
   *   1 ALPHANUMERIC 数字0-9、大写字母A-Z、符号(空格)$%*+-./:
   *   2 2 BYTE(ISO-8859-1)
   *   3 BYTE(UTF-8)
   * @param versionNumber 版本号(默认最小版本)
   *   [1,40]
   */
  constructor(length: number, level: number, mode: number, versionNumber?: number) {
    // 最小版本号
    switch (mode) {
      // NUMERIC 数字0-9
      case 0: {
        this.VersionNumber = ModeNumeric(length, level) + 1;
        break;
      }
      // ALPHANUMERIC 数字0-9、大写字母A-Z、符号(空格)$%*+-./:
      case 1: {
        this.VersionNumber = ModeAlphaNumeric(length, level) + 1;
        break;
      }
      // BYTE(ISO-8859-1)
      case 2: {
        this.VersionNumber = ModeByte(length, level) + 1;
        break;
      }
      // BYTE(UTF-8)
      default: {
        // 相比ISO-8859-1多1字节(不需要补齐符的情况下)
        // ECI模式指示符(4bit)+ECI指定符(8bit)-结束符(4bit)=1字节
        this.VersionNumber = ModeByte(length + 1, level) + 1;
        break;
      }
    }
    // 指定版本号
    if (this.VersionNumber == 0) {
      throw new Error("内容过长！最大版本号 40 也无法容下！请使用较低 纠错等级 或 减少内容！");
    }
    if (typeof versionNumber != "undefined") {
      if (versionNumber < 1 || versionNumber > 40) {
        throw new Error("版本号 " + versionNumber + " 不合法！应为 [1,40]");
      } else if (this.VersionNumber > versionNumber) {
        throw new Error("版本号 " + versionNumber + " 太小！最小为 " + this.VersionNumber);
      } else {
        this.VersionNumber = versionNumber;
      }
    }
    // `内容字节数`bit数
    switch (mode) {
      // NUMERIC
      case 0: {
        // `内容字节数`bit数 1-9版本10bit 10-26版本12bit 27-40版本14bit
        // 数据来源 ISO/IEC 18004-2015 -> 7.4.1 -> Table 3 -> Numeric mode列
        this.ContentBytesBits = this.VersionNumber < 10 ? 10 : (this.VersionNumber < 27 ? 12 : 14);
        break;
      }
      // ALPHANUMERIC
      case 1: {
        // `内容字节数`bit数 1-9版本9bit 10-26版本11bit 27-40版本13bit
        // 数据来源 ISO/IEC 18004-2015 -> 7.4.1 -> Table 3 -> Alphanumeric mode列
        this.ContentBytesBits = this.VersionNumber < 10 ? 9 : (this.VersionNumber < 27 ? 11 : 13);
        break;
      }
      // BYTE
      default: {
        // `内容字节数`bit数 1-9版本8bit 10-40版本16bit
        // 数据来源 ISO/IEC 18004-2015 -> 7.4.1 -> Table 3 -> Byte mode列
        this.ContentBytesBits = this.VersionNumber < 10 ? 8 : 16;
        break;
      }
    }
    this.Dimension = (this.VersionNumber - 1) * 4 + 21;
    this.DataBits = DATA_BYTES[this.VersionNumber - 1][level] * 8;
    this.DataAndEcBits = DATA_AND_EC_BITS[this.VersionNumber - 1];
    this.Ec = EC[this.VersionNumber - 1][level];
  }

}

/**
 * 获取编码模式为NUMERIC的版本号
 * @param length 内容字节数
 * @param level 纠错等级
 * @return 版本号
 */
function ModeNumeric(length: number, level: number): number {
  // `内容字节数`bit数 1-9版本10bit
  for (let i = 0; i < 9; i++) {
    // 模式指示符(4bit)+`内容字节数`bit数(10bit)=14bit
    if (length <= ModeNumericMaxLength(DATA_BYTES[i][level] * 8 - 14)) {
      return i;
    }
  }
  // `内容字节数`bit数 10-26版本12bit
  for (let i = 9; i < 26; i++) {
    // 模式指示符(4bit)+`内容字节数`bit数(12bit)=16bit
    if (length <= ModeNumericMaxLength(DATA_BYTES[i][level] * 8 - 16)) {
      return i;
    }
  }
  // `内容字节数`bit数 27-40版本14bit
  for (let i = 26; i < 40; i++) {
    // 模式指示符(4bit)+`内容字节数`bit数(14bit)=18bit
    if (length <= ModeNumericMaxLength(DATA_BYTES[i][level] * 8 - 18)) {
      return i;
    }
  }
  return 0;
}

/**
 * 获取编码模式为NUMERIC的最大字符长度
 * @param maxBits 最大bit数
 * @return 最大字符长度
 */
function ModeNumericMaxLength(maxBits: number): number {
  // 3个字符10bit 2个字符7bit 1个字符4bit
  let maxLength = maxBits / 10 * 3;
  let remainder = maxBits % 10;
  if (remainder > 6) {
    maxLength += 2;
  } else if (remainder > 3) {
    maxLength++;
  }
  return maxLength;
}

/**
 * 获取编码模式为ALPHANUMERIC的版本号
 * @param length 内容字节数
 * @param level 纠错等级
 * @return 版本号
 */
function ModeAlphaNumeric(length: number, level: number): number {
  // `内容字节数`bit数 1-9版本9bit
  for (let i = 0; i < 9; i++) {
    // 模式指示符(4bit)+`内容字节数`bit数(9bit)=13bit
    if (length <= ModeAlphaNumericMaxLength(DATA_BYTES[i][level] * 8 - 13)) {
      return i;
    }
  }
  // `内容字节数`bit数 10-26版本11bit
  for (let i = 9; i < 26; i++) {
    // 模式指示符(4bit)+`内容字节数`bit数(11bit)=15bit
    if (length <= ModeAlphaNumericMaxLength(DATA_BYTES[i][level] * 8 - 15)) {
      return i;
    }
  }
  // `内容字节数`bit数 27-40版本13bit
  for (let i = 26; i < 40; i++) {
    // 模式指示符(4bit)+`内容字节数`bit数(13bit)=17bit
    if (length <= ModeAlphaNumericMaxLength(DATA_BYTES[i][level] * 8 - 17)) {
      return i;
    }
  }
  return 0;
}

/**
 * 获取编码模式为ALPHANUMERIC的最大字符长度
 * @param maxBits 最大bit数
 * @return 最大字符长度
 */
function ModeAlphaNumericMaxLength(maxBits: number): number {
  // 2个字符11bit 1个字符6bit
  let maxLength = maxBits / 11 * 2;
  let remainder = maxBits % 11;
  if (remainder > 5) {
    maxLength++;
  }
  return maxLength;
}

/**
 * 获取编码模式为BYTE的版本号
 * @param length 内容字节数
 * @param level 纠错等级
 * @return 版本号
 */
function ModeByte(length: number, level: number): number {
  // `内容字节数`bit数 1-9版本8bit
  for (let i = 0; i < 9; i++) {
    // 模式指示符(4bit)+`内容字节数`bit数(8bit)+结束符(4bit)=2字节
    if (length < DATA_BYTES[i][level] - 1) {
      return i;
    }
  }
  // `内容字节数`bit数 10-40版本16bit
  for (let i = 9; i < 40; i++) {
    // 模式指示符(4bit)+`内容字节数`bit数(16bit)+结束符(4bit)=3字节
    if (length < DATA_BYTES[i][level] - 2) {
      return i;
    }
  }
  return 0;
}

/**
 * 数据bit数+纠错bit数
 * @description 索引[版本号]:40
 * @description 数据来源 ISO/IEC 18004-2015 -> 7.1 -> Table 1 -> Data modules except(C)列
 */
const DATA_AND_EC_BITS: number[] = [
  208, 359, 567, 807, 1079, // 1-5
  1383, 1568, 1936, 2336, 2768, // 6-10
  3232, 3728, 4256, 4651, 5243, // 11-15
  5867, 6523, 7211, 7931, 8683, // 16-20
  9252, 10068, 10916, 11796, 12708, // 21-25
  13652, 14628, 15371, 16411, 17483, // 26-30
  18587, 19723, 20891, 22091, 23008, // 31-35
  24272, 25568, 26896, 28256, 29648, // 36-40
]

/**
 * 数据字节数
 * @description 索引[版本号,纠错等级]:40x4
 * @description 数据来源 ISO/IEC 18004-2015 -> 7.4.10 -> Table 7 -> Number of data codewords列
 */
const DATA_BYTES: number[][] =
  [
    [19, 16, 13, 9], [34, 28, 22, 16], [55, 44, 34, 26], [80, 64, 48, 36], [108, 86, 62, 46], // 1-5
    [136, 108, 76, 60], [156, 124, 88, 66], [194, 154, 110, 86], [232, 182, 132, 100], [274, 216, 154, 122], // 6-10
    [324, 254, 180, 140], [370, 290, 206, 158], [428, 334, 244, 180], [461, 365, 261, 197], [523, 415, 295, 223], // 11-15
    [589, 453, 325, 253], [647, 507, 367, 283], [721, 563, 397, 313], [795, 627, 445, 341], [861, 669, 485, 385], // 16-20
    [932, 714, 512, 406], [1006, 782, 568, 442], [1094, 860, 614, 464], [1174, 914, 664, 514], [1276, 1000, 718, 538], // 21-25
    [1370, 1062, 754, 596], [1468, 1128, 808, 628], [1531, 1193, 871, 661], [1631, 1267, 911, 701], [1735, 1373, 985, 745], // 26-30
    [1843, 1455, 1033, 793], [1955, 1541, 1115, 845], [2071, 1631, 1171, 901], [2191, 1725, 1231, 961], [2306, 1812, 1286, 986], // 31-35
    [2434, 1914, 1354, 1054], [2566, 1992, 1426, 1096], [2702, 2102, 1502, 1142], [2812, 2216, 1582, 1222], [2956, 2334, 1666, 1276], // 36-40
  ]

/**
 * 纠错
 * @description 索引[版本号,纠错等级,纠错块,(块数量,纠错码)]:40x4x?x2
 * @description 数据来源 ISO/IEC 18004-2015 -> 7.5.1 -> Table 9 -> Number of error correction blocks列 和 Error correction code per block列的k
 */
const EC: number[][][][] =
  [
    // 1
    [
      [[1, 19]],
      [[1, 16]],
      [[1, 13]],
      [[1, 9]],
    ],
    // 2
    [
      [[1, 34]],
      [[1, 28]],
      [[1, 22]],
      [[1, 16]],
    ],
    // 3
    [
      [[1, 55]],
      [[1, 44]],
      [[2, 17]],
      [[2, 13]],
    ],
    // 4
    [
      [[1, 80]],
      [[2, 32]],
      [[2, 24]],
      [[4, 9]],
    ],
    // 5
    [
      [[1, 108]],
      [[2, 43]],
      [[2, 15], [2, 16]],
      [[2, 11], [2, 12]],
    ],
    // 6
    [
      [[2, 68]],
      [[4, 27]],
      [[4, 19]],
      [[4, 15]],
    ],
    // 7
    [
      [[2, 78]],
      [[4, 31]],
      [[2, 14], [4, 15]],
      [[4, 13], [1, 14]],
    ],
    // 8
    [
      [[2, 97]],
      [[2, 38], [2, 39]],
      [[4, 18], [2, 19]],
      [[4, 14], [2, 15]],
    ],
    // 9
    [
      [[2, 116]],
      [[3, 36], [2, 37]],
      [[4, 16], [4, 17]],
      [[4, 12], [4, 13]],
    ],
    // 10
    [
      [[2, 68], [2, 69]],
      [[4, 43], [1, 44]],
      [[6, 19], [2, 20]],
      [[6, 15], [2, 16]],
    ],
    // 11
    [
      [[4, 81]],
      [[1, 50], [4, 51]],
      [[4, 22], [4, 23]],
      [[3, 12], [8, 13]],
    ],
    // 12
    [
      [[2, 92], [2, 93]],
      [[6, 36], [2, 37]],
      [[4, 20], [6, 21]],
      [[7, 14], [4, 15]],
    ],
    // 13
    [
      [[4, 107]],
      [[8, 37], [1, 38]],
      [[8, 20], [4, 21]],
      [[12, 11], [4, 12]],
    ],
    // 14
    [
      [[3, 115], [1, 116]],
      [[4, 40], [5, 41]],
      [[11, 16], [5, 17]],
      [[11, 12], [5, 13]],
    ],
    // 15
    [
      [[5, 87], [1, 88]],
      [[5, 41], [5, 42]],
      [[5, 24], [7, 25]],
      [[11, 12], [7, 13]],
    ],
    // 16
    [
      [[5, 98], [1, 99]],
      [[7, 45], [3, 46]],
      [[15, 19], [2, 20]],
      [[3, 15], [13, 16]],
    ],
    // 17
    [
      [[1, 107], [5, 108]],
      [[10, 46], [1, 47]],
      [[1, 22], [15, 23]],
      [[2, 14], [17, 15]],
    ],
    // 18
    [
      [[5, 120], [1, 121]],
      [[9, 43], [4, 44]],
      [[17, 22], [1, 23]],
      [[2, 14], [19, 15]],
    ],
    // 19
    [
      [[3, 113], [4, 114]],
      [[3, 44], [11, 45]],
      [[17, 21], [4, 22]],
      [[9, 13], [16, 14]],
    ],
    // 20
    [
      [[3, 107], [5, 108]],
      [[3, 41], [13, 42]],
      [[15, 24], [5, 25]],
      [[15, 15], [10, 16]],
    ],
    // 21
    [
      [[4, 116], [4, 117]],
      [[17, 42]],
      [[17, 22], [6, 23]],
      [[19, 16], [6, 17]],
    ],
    // 22
    [
      [[2, 111], [7, 112]],
      [[17, 46]],
      [[7, 24], [16, 25]],
      [[34, 13]],
    ],
    // 23
    [
      [[4, 121], [5, 122]],
      [[4, 47], [14, 48]],
      [[11, 24], [14, 25]],
      [[16, 15], [14, 16]],
    ],
    // 24
    [
      [[6, 117], [4, 118]],
      [[6, 45], [14, 46]],
      [[11, 24], [16, 25]],
      [[30, 16], [2, 17]],
    ],
    // 25
    [
      [[8, 106], [4, 107]],
      [[8, 47], [13, 48]],
      [[7, 24], [22, 25]],
      [[22, 15], [13, 16]],
    ],
    // 26
    [
      [[10, 114], [2, 115]],
      [[19, 46], [4, 47]],
      [[28, 22], [6, 23]],
      [[33, 16], [4, 17]],
    ],
    // 27
    [
      [[8, 122], [4, 123]],
      [[22, 45], [3, 46]],
      [[8, 23], [26, 24]],
      [[12, 15], [28, 16]],
    ],
    // 28
    [
      [[3, 117], [10, 118]],
      [[3, 45], [23, 46]],
      [[4, 24], [31, 25]],
      [[11, 15], [31, 16]],
    ],
    // 29
    [
      [[7, 116], [7, 117]],
      [[21, 45], [7, 46]],
      [[1, 23], [37, 24]],
      [[19, 15], [26, 16]],
    ],
    // 30
    [
      [[5, 115], [10, 116]],
      [[19, 47], [10, 48]],
      [[15, 24], [25, 25]],
      [[23, 15], [25, 16]],
    ],
    // 31
    [
      [[13, 115], [3, 116]],
      [[2, 46], [29, 47]],
      [[42, 24], [1, 25]],
      [[23, 15], [28, 16]],
    ],
    // 32
    [
      [[17, 115]],
      [[10, 46], [23, 47]],
      [[10, 24], [35, 25]],
      [[19, 15], [35, 16]],
    ],
    // 33
    [
      [[17, 115], [1, 116]],
      [[14, 46], [21, 47]],
      [[29, 24], [19, 25]],
      [[11, 15], [46, 16]],
    ],
    // 34
    [
      [[13, 115], [6, 116]],
      [[14, 46], [23, 47]],
      [[44, 24], [7, 25]],
      [[59, 16], [1, 17]],
    ],
    // 35
    [
      [[12, 121], [7, 122]],
      [[12, 47], [26, 48]],
      [[39, 24], [14, 25]],
      [[22, 15], [41, 16]],
    ],
    // 36
    [
      [[6, 121], [14, 122]],
      [[6, 47], [34, 48]],
      [[46, 24], [10, 25]],
      [[2, 15], [64, 16]],
    ],
    // 37
    [
      [[17, 122], [4, 123]],
      [[29, 46], [14, 47]],
      [[49, 24], [10, 25]],
      [[24, 15], [46, 16]],
    ],
    // 38
    [
      [[4, 122], [18, 123]],
      [[13, 46], [32, 47]],
      [[48, 24], [14, 25]],
      [[42, 15], [32, 16]],
    ],
    // 39
    [
      [[20, 117], [4, 118]],
      [[40, 47], [7, 48]],
      [[43, 24], [22, 25]],
      [[10, 15], [67, 16]],
    ],
    // 40
    [
      [[19, 118], [6, 119]],
      [[18, 47], [31, 48]],
      [[34, 24], [34, 25]],
      [[20, 15], [61, 16]],
    ],
  ]

export {Version}
