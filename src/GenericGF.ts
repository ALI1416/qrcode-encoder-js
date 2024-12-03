/**
 * 通用Galois Fields域(通用伽罗华域)
 * @description 仅适用于QrCode
 * @version 2023/05/18 11:11:11
 * @author ALI[ali-k&#64;foxmail.com]
 * @since 1.0.0
 */

/**
 * 维度
 * @description 256
 */
const DIMENSION: number = 256
/**
 * 多项式
 * @description 0x011D -> 0000 0001 0001 1101 -> x^8 + x^4 + x^3 + x^2 + 1
 */
const POLY: number = 0x011D

/**
 * 指数表
 */
const ExpTable: number[] = []
/**
 * 对数表
 */
const LogTable: number[] = [0]

// 初始化指数表和对数表
let x = 1
for (let i = 0; i < DIMENSION; i++) {
  ExpTable[i] = x
  x <<= 1
  if (x >= DIMENSION) {
    x ^= POLY
    x &= DIMENSION - 1
  }
}
for (let i = 0; i < DIMENSION - 1; i++) {
  LogTable[ExpTable[i]] = i
}

/**
 * 加法
 * @param a 加数
 * @param b 被加数
 * @return {number} 结果
 */
function Addition(a: number, b: number): number {
  return a ^ b
}

/**
 * 2的次方
 * @param a 幂
 * @return {number} 结果
 */
function Exp(a: number): number {
  return ExpTable[a]
}

/**
 * 逆运算
 * @param a 被操作数
 * @return {number} 结果
 */
function Inverse(a: number): number {
  return ExpTable[DIMENSION - LogTable[a] - 1]
}

/**
 * 乘法
 * @param a 乘数
 * @param b 被乘数
 * @return {number} 结果
 */
function Multiply(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0
  }
  return ExpTable[(LogTable[a] + LogTable[b]) % (DIMENSION - 1)]
}

export {Addition, Exp, Inverse, Multiply}
