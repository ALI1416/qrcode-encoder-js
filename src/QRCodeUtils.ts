/**
 * 二维码工具
 * @version 2023/05/18 11:11:11
 * @author ALI[ali-k&#64;foxmail.com]
 * @since 1.0.0
 */

/**
 * number[][]转为boolean[][]
 * @description 0 -> false
 * @description 1 -> true
 * @param bytes number[][]
 * @param dimension 尺寸
 * @return boolean[][]
 */
function Convert(bytes: number[][], dimension: number): boolean[][] {
  let data: boolean[][] = [];
  for (let i = 0; i < dimension; i++) {
    data.push([]);
    for (let j = 0; j < dimension; j++) {
      data[i][j] = (bytes[i][j] === 1);
    }
  }
  return data;
}

/**
 * 添加bit
 * @param bits 目的数据
 * @param pos 位置
 * @param value 值
 * @param numberBits 添加bit个数
 */
function AddBits(bits: boolean[], pos: number, value: number, numberBits: number) {
  for (let i = 0; i < numberBits; i++) {
    bits[pos + i] = (value & (1 << (numberBits - i - 1))) !== 0;
  }
}

/**
 * 获取bit数组
 * @param value 值
 * @param numberBits 添加bit个数
 * @return boolean[] bit数组
 */
function GetBits(value: number, numberBits: number): boolean[] {
  let bits: boolean[] = [];
  for (let i = 0; i < numberBits; i++) {
    bits[i] = (value & (1 << (numberBits - i - 1))) !== 0;
  }
  return bits;
}

/**
 * 获取字节数组
 * @param data 数据
 * @param offset 起始位置
 * @param bytes 字节长度
 * @return number[] 字节数组
 */
function GetBytes(data: boolean[], offset: number, bytes: number): number[] {
  let result: number[] = [];
  for (let i = 0; i < bytes; i++) {
    let ptr = offset + i * 8;
    result[i] = (
      (data[ptr] ? 0x80 : 0)
      | (data[ptr + 1] ? 0x40 : 0)
      | (data[ptr + 2] ? 0x20 : 0)
      | (data[ptr + 3] ? 0x10 : 0)
      | (data[ptr + 4] ? 0x08 : 0)
      | (data[ptr + 5] ? 0x04 : 0)
      | (data[ptr + 6] ? 0x02 : 0)
      | (data[ptr + 7] ? 0x01 : 0)
    );
  }
  return result;
}

/**
 * 获取字符串的字节数组
 * @param content 字符串
 * @return number[] 字节数组
 */
function GetUtf8Bytes(content: string): number[] {
  let code = encodeURIComponent(content);
  let bytes = [];
  for (let i = 0; i < code.length; i++) {
    let c = code.charAt(i);
    if (c === '%') {
      bytes.push(parseInt(code.charAt(i + 1) + code.charAt(i + 2), 16));
      i += 2;
    } else {
      bytes.push(c.charCodeAt(0));
    }
  }
  return bytes;
}

export {Convert, AddBits, GetBits, GetBytes, GetUtf8Bytes}
