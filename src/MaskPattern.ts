import {Version} from './Version'
import * as QRCodeUtils from './QRCodeUtils'

/**
 * 掩模模板
 * @version 2023/05/18 11:11:11
 * @author ALI[ali-k&#64;foxmail.com]
 * @since 1.0.0
 */
class MaskPattern {

  /**
   * 模板列表
   * @description 0白 1黑
   */
  readonly Patterns: number[][][] = []
  /**
   * 惩戒分列表
   */
  readonly Penalties: number[] = []
  /**
   * 最好的模板下标
   */
  readonly Best: number

  /**
   * 构建模板
   * @param data 数据
   * @param version 版本
   * @param level 纠错等级
   *   <0 L 7%>
   *   <1 M 15%>
   *   <2 Q 25%>
   *   <3 H 30%>
   */
  constructor(data: boolean[], version: Version, level: number) {
    let bestValue = -1
    let dimension = version.Dimension
    let versionNumber = version.VersionNumber
    for (let i = 0; i < 8; i++) {
      // 新建模板 0白 1黑 2空
      let pattern: number[][] = []
      // 填充为空模板
      FillEmptyPattern(pattern, dimension)
      // 嵌入基础图形
      EmbedBasicPattern(pattern, dimension, versionNumber)
      // 嵌入格式信息
      EmbedFormatInfo(pattern, dimension, level, i)
      // 嵌入版本信息(版本7+)
      EmbedVersionInfo(pattern, dimension, versionNumber)
      // 嵌入数据
      EmbedData(pattern, dimension, i, data)
      this.Patterns[i] = pattern
      // 计算惩戒分
      this.Penalties[i] = MaskPenaltyRule(pattern, dimension)
    }
    // 找到最好的模板
    let minPenalty = Number.MAX_VALUE
    for (let i = 0; i < 8; i++) {
      if (this.Penalties[i] < minPenalty) {
        minPenalty = this.Penalties[i]
        bestValue = i
      }
    }
    this.Best = bestValue
  }
}

/**
 * 填充为空模板
 * @param pattern 模板
 * @param dimension 尺寸
 */
function FillEmptyPattern(pattern: number[][], dimension: number) {
  for (let i = 0; i < dimension; i++) {
    pattern.push([])
    for (let j = 0; j < dimension; j++) {
      pattern[i][j] = 2
    }
  }
}

/**
 * 嵌入基础图形
 * @description 包含：
 * @description 位置探测图形和分隔符
 * @description 位置校正图形(版本2+)
 * @description 定位图形
 * @description 左下角黑点
 * @param pattern 模板
 * @param dimension 尺寸
 * @param versionNumber 版本号
 */
function EmbedBasicPattern(pattern: number[][], dimension: number, versionNumber: number) {
  // 嵌入位置探测和分隔符图形
  EmbedPositionFinderPatternAndSeparator(pattern, dimension)
  // 嵌入位置校正图形(版本2+)
  EmbedPositionAlignmentPattern(pattern, versionNumber)
  // 嵌入定位图形
  EmbedTimingPattern(pattern, dimension)
  // 嵌入左下角黑点
  EmbedDarkDotAtLeftBottomCorner(pattern, dimension)
}

/**
 * 嵌入位置探测和分隔符图形
 * @param pattern 模板
 * @param dimension 尺寸
 */
function EmbedPositionFinderPatternAndSeparator(pattern: number[][], dimension: number) {
  /* 嵌入位置探测图形 */
  let finderDimension = 7
  // 左上角
  EmbedPositionFinderPattern(pattern, 0, 0)
  // 右上角
  EmbedPositionFinderPattern(pattern, dimension - finderDimension, 0)
  // 左下角
  EmbedPositionFinderPattern(pattern, 0, dimension - finderDimension)

  /* 嵌入水平分隔符图形 */
  let horizontalWidth = 8
  // 左上角
  EmbedHorizontalSeparationPattern(pattern, 0, horizontalWidth - 1)
  // 右上角
  EmbedHorizontalSeparationPattern(pattern, dimension - horizontalWidth, horizontalWidth - 1)
  // 左下角
  EmbedHorizontalSeparationPattern(pattern, 0, dimension - horizontalWidth)

  /* 嵌入垂直分隔符图形 */
  let verticalHeight = 7
  // 左上角
  EmbedVerticalSeparationPattern(pattern, verticalHeight, 0)
  // 右上角
  EmbedVerticalSeparationPattern(pattern, dimension - verticalHeight - 1, 0)
  // 左下角
  EmbedVerticalSeparationPattern(pattern, verticalHeight, dimension - verticalHeight)
}

/**
 * 嵌入位置探测图形
 * @param pattern 模板
 * @param xStart x起始坐标
 * @param yStart y起始坐标
 */
function EmbedPositionFinderPattern(pattern: number[][], xStart: number, yStart: number) {
  for (let x = 0; x < 7; x++) {
    for (let y = 0; y < 7; y++) {
      pattern[xStart + x][yStart + y] = POSITION_FINDER_PATTERN[x][y]
    }
  }
}

/**
 * 嵌入水平分隔符图形
 * @param pattern 模板
 * @param xStart x起始坐标
 * @param yStart y起始坐标
 */
function EmbedHorizontalSeparationPattern(pattern: number[][], xStart: number, yStart: number) {
  for (let x = 0; x < 8; x++) {
    pattern[xStart + x][yStart] = 0
  }
}

/**
 * 嵌入垂直分隔符图形
 * @param pattern 模板
 * @param xStart x起始坐标
 * @param yStart y起始坐标
 */
function EmbedVerticalSeparationPattern(pattern: number[][], xStart: number, yStart: number) {
  for (let y = 0; y < 7; y++) {
    pattern[xStart][yStart + y] = 0
  }
}

/**
 * 嵌入左下角黑点
 * @param pattern 模板
 * @param dimension 尺寸
 */
function EmbedDarkDotAtLeftBottomCorner(pattern: number[][], dimension: number) {
  pattern[8][dimension - 8] = 1
}

/**
 * 嵌入位置校正图形(版本2+)
 * @param pattern 模板
 * @param versionNumber 版本号
 */
function EmbedPositionAlignmentPattern(pattern: number[][], versionNumber: number) {
  if (versionNumber < 2) {
    return
  }
  let coordinates = POSITION_ALIGNMENT_PATTERN_COORDINATE[versionNumber - 2]
  let length = coordinates.length
  for (let x = 0; x < length; x++) {
    for (let y = 0; y < length; y++) {
      // 跳过位置探测图形
      if ((x === 0 && y === 0) || (x === 0 && y === length - 1) || (y === 0 && x === length - 1)) {
        continue
      }
      EmbedPositionAlignmentPattern2(pattern, coordinates[x] - 2, coordinates[y] - 2)
    }
  }
}

/**
 * 嵌入位置校正图形
 * @param pattern 模板
 * @param xStart x起始坐标
 * @param yStart y起始坐标
 */
function EmbedPositionAlignmentPattern2(pattern: number[][], xStart: number, yStart: number) {
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      pattern[xStart + x][yStart + y] = POSITION_ALIGNMENT_PATTERN[x][y]
    }
  }
}

/**
 * 嵌入定位图形
 * @param pattern 模板
 * @param dimension 尺寸
 */
function EmbedTimingPattern(pattern: number[][], dimension: number) {
  for (let i = 8; i < dimension - 8; i++) {
    let isBlack = (i + 1) % 2
    // 不必跳过校正图形
    pattern[i][6] = isBlack
    pattern[6][i] = isBlack
  }
}

/**
 * 嵌入格式信息
 * @param pattern 模板
 * @param dimension 尺寸
 * @param level 纠错等级
 * @param id 模板序号
 */
function EmbedFormatInfo(pattern: number[][], dimension: number, level: number, id: number) {
  let formatInfo = FormatInfo[level][id]
  for (let i = 0; i < 15; i++) {
    let isBlack = formatInfo[14 - i] ? 1 : 0
    // 左上角
    pattern[FORMAT_INFO_COORDINATES[i][0]][FORMAT_INFO_COORDINATES[i][1]] = isBlack
    let x: number, y: number
    // 右上角
    if (i < 8) {
      x = dimension - i - 1
      y = 8
    }
    // 左下角
    else {
      x = 8
      y = dimension + i - 15
    }
    pattern[x][y] = isBlack
  }
}

/**
 * 嵌入版本信息(版本7+)
 * @param pattern 模板
 * @param dimension 尺寸
 * @param versionNumber 版本号
 */
function EmbedVersionInfo(pattern: number[][], dimension: number, versionNumber: number) {
  if (versionNumber < 7) {
    return
  }
  let versionInfo = VersionInfo[versionNumber - 7]
  let index = 17
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 3; j++) {
      let isBlack = versionInfo[index--] ? 1 : 0
      // 左下角
      pattern[i][dimension - 11 + j] = isBlack
      // 右上角
      pattern[dimension - 11 + j][i] = isBlack
    }
  }
}

/**
 * 嵌入数据
 * @param pattern 模板
 * @param dimension 尺寸
 * @param id 模板序号
 * @param data 数据
 */
function EmbedData(pattern: number[][], dimension: number, id: number, data: boolean[]) {
  let length = data.length
  let index = 0
  let direction = -1
  // 从右下角开始
  let x = dimension - 1
  let y = dimension - 1
  while (x > 0) {
    // 跳过垂直分隔符图形
    if (x === 6) {
      x -= 1
    }
    while (y >= 0 && y < dimension) {
      for (let i = 0; i < 2; i++) {
        let xx = x - i
        // 跳过不为空
        if (pattern[xx][y] !== 2) {
          continue
        }
        let isBlack
        if (index < length) {
          isBlack = data[index] ? 1 : 0
          index++
        } else {
          isBlack = 0
        }
        // 需要掩模
        if (GetMaskBit(id, xx, y)) {
          isBlack ^= 1
        }
        pattern[xx][y] = isBlack
      }
      y += direction
    }
    direction = -direction
    y += direction
    x -= 2
  }
}

/**
 * 获取指定坐标是否需要掩模
 * @param id 模板序号
 * @param x x坐标
 * @param y y坐标
 * @return boolean 是否需要掩模
 */
function GetMaskBit(id: number, x: number, y: number): boolean {
  switch (id) {
    case 1: {
      return (y % 2) === 0
    }
    case 2: {
      return (x % 3) === 0
    }
    case 3: {
      return ((x + y) % 3) === 0
    }
    case 4: {
      return ((Math.floor(y / 2) + Math.floor(x / 3)) % 2) === 0
    }
    case 5: {
      let temp = x * y
      return ((temp % 2) + (temp % 3)) === 0
    }
    case 6: {
      let temp = x * y
      return (((temp % 2) + (temp % 3)) % 2) === 0
    }
    case 7: {
      return ((((x * y) % 3) + ((x + y) % 2)) % 2) === 0
    }
    default: {
      return ((x + y) % 2) === 0
    }
  }
}

/**
 * 掩模惩戒规则
 * @param pattern 模板
 * @param dimension 尺寸
 * @return number 惩戒分
 */
function MaskPenaltyRule(pattern: number[][], dimension: number): number {
  return MaskPenaltyRule1(pattern, dimension)
    + MaskPenaltyRule2(pattern, dimension)
    + MaskPenaltyRule3(pattern, dimension)
    + MaskPenaltyRule4(pattern, dimension)
}

/**
 * 掩模惩戒规则1
 * @description 行或列，连续颜色相同(不可重复计算)
 * @description 惩戒分=PENALTY1+(个数-5)
 * @description 惩戒分在个数>=5时生效
 * @param pattern 模板
 * @param dimension 尺寸
 * @return number 规则1惩戒分
 */
function MaskPenaltyRule1(pattern: number[][], dimension: number): number {
  let penalty = 0
  for (let i = 0; i < dimension; i++) {
    let countRow = 0
    let countCol = 0
    let prevBitRow = 2
    let prevBitCol = 2
    for (let j = 0; j < dimension; j++) {
      let bitRow = pattern[i][j]
      let bitCol = pattern[j][i]
      // 行
      if (bitRow === prevBitRow) {
        countRow++
      } else {
        if (countRow > 4) {
          penalty += PENALTY1 + (countRow - 5)
        }
        countRow = 1
        prevBitRow = bitRow
      }
      // 列
      if (bitCol === prevBitCol) {
        countCol++
      } else {
        if (countCol > 4) {
          penalty += PENALTY1 + (countCol - 5)
        }
        countCol = 1
        prevBitCol = bitCol
      }
    }
    // 行
    if (countRow > 4) {
      penalty += PENALTY1 + (countRow - 5)
    }
    // 列
    if (countCol > 4) {
      penalty += PENALTY1 + (countCol - 5)
    }
  }
  return penalty
}

/**
 * 掩模惩戒规则2
 * @description 2x2，块内颜色相同(重复计算)
 * @description 惩戒分=PENALTY2*出现次数
 * @description 惩戒分在出现次数>=1时生效
 * @param pattern 模板
 * @param dimension 尺寸
 * @return number 规则2惩戒分
 */
function MaskPenaltyRule2(pattern: number[][], dimension: number): number {
  let penalty = 0
  for (let x = 0; x < dimension - 1; x++) {
    for (let y = 0; y < dimension - 1; y++) {
      // 2x2块
      let bit = pattern[x][y]
      if (bit === pattern[x][y + 1] && bit === pattern[x + 1][y] && bit === pattern[x + 1][y + 1]) {
        penalty++
      }
    }
  }
  return PENALTY2 * penalty
}

/**
 * 掩模惩戒规则3
 * @description 行或列，出现[黑,白,黑黑黑,白,黑]序列，并且前或后有4个白色
 * @description 惩戒分=PENALTY3*出现次数
 * @description 惩戒分在出现次数>=1时生效
 * @param pattern 模板
 * @param dimension 尺寸
 * @return number 规则3惩戒分
 */
function MaskPenaltyRule3(pattern: number[][], dimension: number): number {
  let penalty = 0
  for (let x = 0; x < dimension; x++) {
    for (let y = 0; y < dimension; y++) {
      // 行
      if (
        // 列区间[0, dimension - 6)
        y < dimension - 6 &&
        // [黑,白,黑黑黑,白,黑]序列
        pattern[x][y] === 1 &&
        pattern[x][y + 1] === 0 &&
        pattern[x][y + 2] === 1 &&
        pattern[x][y + 3] === 1 &&
        pattern[x][y + 4] === 1 &&
        pattern[x][y + 5] === 0 &&
        pattern[x][y + 6] === 1 &&
        // 左或右有4个白色
        (
          // 左有4个白色
          (
            // 列区间[4,)
            y > 3 &&
            // [白白白白]序列
            pattern[x][y - 1] === 0 &&
            pattern[x][y - 2] === 0 &&
            pattern[x][y - 3] === 0 &&
            pattern[x][y - 4] === 0) ||
          // 右有4个白色
          (
            // 列区间[0, dimension - 10)
            y < dimension - 10 &&
            // [白白白白]序列
            pattern[x][y + 7] === 0 &&
            pattern[x][y + 8] === 0 &&
            pattern[x][y + 9] === 0 &&
            pattern[x][y + 10] === 0))) {
        penalty++
      }
      // 列
      if (
        // 行区间[0, dimension - 6)
        x < dimension - 6 &&
        // [黑,白,黑黑黑,白,黑]序列
        pattern[x][y] === 1 &&
        pattern[x + 1][y] === 0 &&
        pattern[x + 2][y] === 1 &&
        pattern[x + 3][y] === 1 &&
        pattern[x + 4][y] === 1 &&
        pattern[x + 5][y] === 0 &&
        pattern[x + 6][y] === 1 &&
        // 上或下有4个白色
        (
          // 上有4个白色
          (
            // 行区间[4,)
            x > 3 &&
            // [白白白白]序列
            pattern[x - 1][y] === 0 &&
            pattern[x - 2][y] === 0 &&
            pattern[x - 3][y] === 0 &&
            pattern[x - 4][y] === 0) ||
          // 下有4个白色
          (
            // 行区间[0, dimension - 10)
            x < dimension - 10 &&
            // [白白白白]序列
            pattern[x + 7][y] === 0 &&
            pattern[x + 8][y] === 0 &&
            pattern[x + 9][y] === 0 &&
            pattern[x + 10][y] === 0))) {
        penalty++
      }
    }
  }
  return PENALTY3 * penalty
}

/**
 * 掩模惩戒规则4
 * @description 颜色占比
 * @description 惩戒分=PENALTY4*((黑色占比-0.5)的绝对值*20)
 * @description 惩戒分始终生效
 * @param pattern 模板
 * @param dimension 尺寸
 * @return number 规则4惩戒分
 */
function MaskPenaltyRule4(pattern: number[][], dimension: number): number {
  let count = 0
  for (let x = 0; x < dimension; x++) {
    for (let y = 0; y < dimension; y++) {
      if (pattern[x][y] === 1) {
        count++
      }
    }
  }
  let ratio = count / (dimension * dimension)
  let penalty = Math.floor(Math.abs(ratio - 0.5) * 20)
  return PENALTY4 * penalty
}

/**
 * 格式信息
 * @description 索引[纠错等级,模板序号]:4x8
 * @description 数据来源 ISO/IEC 18004-2015 -> Annex C -> Table C.1 -> Sequence after masking (QR Code symbols) -> hex列
 */
const FORMAT_INFO: number[][] = [
  [0x77C4, 0x72F3, 0x7DAA, 0x789D, 0x662F, 0x6318, 0x6C41, 0x6976,], // 0
  [0x5412, 0x5125, 0x5E7C, 0x5B4B, 0x45F9, 0x40CE, 0x4F97, 0x4AA0,], // 1
  [0x355F, 0x3068, 0x3F31, 0x3A06, 0x24B4, 0x2183, 0x2EDA, 0x2BED,], // 2
  [0x1689, 0x13BE, 0x1CE7, 0x19D0, 0x0762, 0x0255, 0x0D0C, 0x083B,], // 3
]

/**
 * 版本信息(版本7+)
 * @description 索引[版本号]:34
 * @description 数据来源 ISO/IEC 18004-2015 -> Annex D -> Table D.1 -> Hex equivalent列
 */
const VERSION_INFO: number[] = [
  0x07C94, 0x085BC, 0x09A99, 0x0A4D3, // 7-10
  0x0BBF6, 0x0C762, 0x0D847, 0x0E60D, 0x0F928, // 11-15
  0x10B78, 0x1145D, 0x12A17, 0x13532, 0x149A6, // 16-20
  0x15683, 0x168C9, 0x177EC, 0x18EC4, 0x191E1, // 21-25
  0x1AFAB, 0x1B08E, 0x1CC1A, 0x1D33F, 0x1ED75, // 26-30
  0x1F250, 0x209D5, 0x216F0, 0x228BA, 0x2379F, // 31-35
  0x24B0B, 0x2542E, 0x26A64, 0x27541, 0x28C69, // 36-40
]

/**
 * 格式信息
 */
const FormatInfo: boolean[][][] = []
/**
 * 版本信息(版本7+)
 */
const VersionInfo: boolean[][] = []

// 初始化格式信息
for (let i = 0; i < 4; i++) {
  FormatInfo.push([[]])
  for (let j = 0; j < 8; j++) {
    FormatInfo[i][j] = QRCodeUtils.GetBits(FORMAT_INFO[i][j], 15)
  }
}
// 初始化版本信息(版本7+)
for (let i = 0; i < 34; i++) {
  VersionInfo.push([])
  VersionInfo[i] = QRCodeUtils.GetBits(VERSION_INFO[i], 18)
}

/**
 * 位置探测图形
 * @description 索引[x坐标,y坐标]:7x7
 * @description 数量:3个(左上角、右上角、左下角)
 * @description 数据来源 ISO/IEC 18004-2015 -> 6.3.3.1
 */
const POSITION_FINDER_PATTERN: number[][] = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
]
/**
 * 位置校正图形
 * @description 索引[x坐标,y坐标]:5x5
 * @description 数量:根据版本号而定
 * @description 数据来源 ISO/IEC 18004-2015 -> 6.3.6
 */
const POSITION_ALIGNMENT_PATTERN: number[][] = [
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
]
/**
 * 位置校正图形坐标(版本2+)
 * @description 索引[版本号][坐标]:39x?
 * @description 数据来源 ISO/IEC 18004-2015 -> Annex E -> Table E.1
 */
const POSITION_ALIGNMENT_PATTERN_COORDINATE: number[][] = [
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
]
/**
 * 格式信息坐标(左上角)
 * @description 索引[x坐标,y坐标]:15x2
 * @description 数据来源 ISO/IEC 18004-2015 -> 7.9.1 -> Figure 25
 */
const FORMAT_INFO_COORDINATES: number[][] = [
  [8, 0],
  [8, 1],
  [8, 2],
  [8, 3],
  [8, 4],
  [8, 5],
  [8, 7],
  [8, 8],
  [7, 8],
  [5, 8],
  [4, 8],
  [3, 8],
  [2, 8],
  [1, 8],
  [0, 8],
]

/**
 * 惩戒规则1惩戒分 3
 * @description 数据来源 ISO/IEC 18004-2015 -> 7.8.3.1 -> N1
 */
const PENALTY1: number = 3
/**
 * 惩戒规则2惩戒分 3
 * @description 数据来源 ISO/IEC 18004-2015 -> 7.8.3.1 -> N2
 */
const PENALTY2: number = 3
/**
 * 惩戒规则3惩戒分 40
 * @description 数据来源 ISO/IEC 18004-2015 -> 7.8.3.1 -> N3
 */
const PENALTY3: number = 40
/**
 * 惩戒规则4惩戒分 10
 * @description 数据来源 ISO/IEC 18004-2015 -> 7.8.3.1 -> N4
 */
const PENALTY4: number = 10

export {MaskPattern}
