import {Exp} from './GenericGF'
import {GenericGFPoly} from './GenericGFPoly'

/**
 * Reed-Solomon(里德-所罗门码)
 * @description 仅适用于QrCode
 * @version 2023/05/18 11:11:11
 * @author ALI[ali-k&#64;foxmail.com]
 * @since 1.0.0
 */

/**
 * GenericGFPoly数组
 */
const GenericGFPolyArray: GenericGFPoly[] = []

// 初始化GenericGFPoly数组
GenericGFPolyArray[0] = new GenericGFPoly([1])
// 最大值68
// 数据来源 ISO/IEC 18004-2015 -> Annex A -> Table A.1 -> Number of error correction codewords列最大值
for (let i = 1; i < 69; i++) {
  GenericGFPolyArray[i] = GenericGFPolyArray[i - 1].Multiply(new GenericGFPoly([1, Exp(i - 1)]))
}

/**
 * 编码
 * @param coefficients 系数
 * @param degree 次数
 * @return {number[]} 结果
 */
function Encoder(coefficients: number[], degree: number): number[] {
  let info = new GenericGFPoly(coefficients)
  info = info.MultiplyByMonomial(degree, 1)
  let remainder = info.RemainderOfDivide(GenericGFPolyArray[degree])
  // 纠错码
  let result = remainder.Coefficients
  let length = result.length
  // 长度不够前面补0
  let padding = degree - length
  if (padding === 0) {
    return result
  } else {
    let resultPadding: number[] = []
    for (let i = 0; i < padding; i++) {
      resultPadding.push(0)
    }
    resultPadding.push(...result)
    return resultPadding
  }
}

export {Encoder}
