/**
 * QRCode异常
 * @version 2023/06/08 11:11:11
 * @author ALI[ali-k&#64;foxmail.com]
 * @since 1.1.0
 */
class QRCodeException extends Error {

  /**
   * QRCode异常
   * @param message 详细信息
   * @param options 选项
   */
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'QRCodeException'
  }
}

export {QRCodeException}
