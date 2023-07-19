import * as GenericGF from './GenericGF'

/**
 * 通用Galois Fields域多项式(通用伽罗华域多项式)
 * @description 仅适用于QrCode
 * @version 2023/05/18 11:11:11
 * @author ALI[ali-k&#64;foxmail.com]
 * @since 1.0.0
 */
class GenericGFPoly {

  /**
   * 多项式系数([0]常数项、[1]一次方的系数、[2]二次方的系数...)
   */
  readonly Coefficients: number[]
  /**
   * 多项式次数
   */
  readonly Degree: number
  /**
   * 多项式是否为0(常数项为0)
   */
  readonly IsZero: boolean

  /**
   * 构造函数
   * @param coefficients 多项式常数
   */
  constructor(coefficients: number[]) {
    let coefficientsLength = coefficients.length
    // 常数项为0
    if (coefficients[0] === 0) {
      // 查找第一个非0的下标
      let firstNonZero = 1
      while (firstNonZero < coefficientsLength && coefficients[firstNonZero] === 0) {
        firstNonZero++
      }
      // 全为0
      if (firstNonZero === coefficientsLength) {
        // 该多项式为0
        this.Coefficients = [0]
      } else {
        // 去除前面的0
        this.Coefficients = coefficients.slice(firstNonZero)
      }
    } else {
      this.Coefficients = coefficients
    }
    this.Degree = this.Coefficients.length - 1
    this.IsZero = this.Coefficients[0] === 0
  }

  /**
   *
   * @param degree 获取多项式中`次数`的系数
   * @return number 系数
   */
  public GetCoefficient(degree: number): number {
    return this.Coefficients[this.Coefficients.length - 1 - degree]
  }

  /**
   * 加法
   */
  public Addition(other: GenericGFPoly): GenericGFPoly {
    if (this.IsZero) {
      return other
    }
    if (other.IsZero) {
      return this
    }
    let smallerCoefficients = this.Coefficients
    let largerCoefficients = other.Coefficients
    if (smallerCoefficients.length > largerCoefficients.length) {
      let temp = largerCoefficients
      largerCoefficients = smallerCoefficients
      smallerCoefficients = temp
    }
    let lengthDiff = largerCoefficients.length - smallerCoefficients.length
    let sumDiff = largerCoefficients.slice(0, lengthDiff)
    for (let i = lengthDiff; i < largerCoefficients.length; i++) {
      sumDiff[i] = GenericGF.Addition(smallerCoefficients[i - lengthDiff], largerCoefficients[i])
    }
    return new GenericGFPoly(sumDiff)
  }

  /**
   * 乘法
   */
  public Multiply(other: GenericGFPoly): GenericGFPoly {
    if (this.IsZero || other.IsZero) {
      return Zero
    }
    let aCoefficients = this.Coefficients
    let bCoefficients = other.Coefficients
    let aLength = aCoefficients.length
    let bLength = bCoefficients.length
    let product: number[] = []
    for (let i = 0; i < aLength; i++) {
      let aCoefficient = aCoefficients[i]
      for (let j = 0; j < bLength; j++) {
        product[i + j] = GenericGF.Addition(product[i + j], GenericGF.Multiply(aCoefficient, bCoefficients[j]))
      }
    }
    return new GenericGFPoly(product)
  }

  /**
   * 单项式乘法
   * @param degree 次数
   * @param coefficient 系数
   */
  public MultiplyByMonomial(degree: number, coefficient: number): GenericGFPoly {
    if (coefficient === 0) {
      return Zero
    }
    let size = this.Coefficients.length
    let product: number[] = []
    for (let i = 0; i < size; i++) {
      product[i] = GenericGF.Multiply(this.Coefficients[i], coefficient)
    }
    for (let i = 0; i < degree; i++) {
      product.push(0)
    }
    return new GenericGFPoly(product)
  }

  /**
   * 除法的余数
   */
  public RemainderOfDivide(other: GenericGFPoly): GenericGFPoly {
    let remainder = new GenericGFPoly(this.Coefficients)
    let denominatorLeadingTerm = other.GetCoefficient(other.Degree)
    let inverseDenominatorLeadingTerm = GenericGF.Inverse(denominatorLeadingTerm)
    while (remainder.Degree >= other.Degree && !remainder.IsZero) {
      let degreeDifference = remainder.Degree - other.Degree
      let scale = GenericGF.Multiply(remainder.GetCoefficient(remainder.Degree), inverseDenominatorLeadingTerm)
      let term = other.MultiplyByMonomial(degreeDifference, scale)
      remainder = remainder.Addition(term)
    }
    return remainder
  }

}

/**
 * 多项式0
 */
const Zero: GenericGFPoly = new GenericGFPoly([0])

export {GenericGFPoly}
