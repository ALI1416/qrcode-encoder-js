/**
 * QRCode异常类
 * @version 2023/06/08 11:11:11
 * @author ALI[ali-k&#64;foxmail.com]
 * @since 1.1.0
 */
class QRCodeException extends Error {

  /**
   * QRCode异常
   * @param message 信息
   */
  constructor(message?: string) {
    super(message);
    this.name = "QRCodeException";
  }
}

export {QRCodeException}
