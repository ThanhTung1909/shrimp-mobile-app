export const VN_PHONE_REGEX = /^0(3|5|7|8|9)[0-9]{8}$/;

export const VN_PHONE_ERROR_MSG =
  'Số điện thoại không hợp lệ (gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09).';

export function sanitizePhoneInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 10);
}
