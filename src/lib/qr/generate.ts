/**
 * QR code generation helpers.
 * Wraps the `qrcode` package. Can be called client-side or server-side.
 *
 * Install: `npm install qrcode @types/qrcode`
 */

// Dynamic import so the heavy `qrcode` bundle is only loaded when needed
async function getQRCode() {
  const QRCode = await import('qrcode');
  return QRCode;
}

export interface QROptions {
  /** Error correction level. Higher = more resilient, larger QR code. */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  /** Size in pixels */
  width?: number;
  /** Foreground colour */
  color?: { dark: string; light: string };
}

const DEFAULT_OPTIONS: QROptions = {
  errorCorrectionLevel: 'M',
  width: 300,
  color: { dark: '#000000', light: '#ffffff' },
};

/**
 * Generate a QR code as a base64 PNG data URL.
 * @param data  The string to encode (e.g. a signed access token or URL)
 */
export async function generateQRDataURL(
  data: string,
  options: QROptions = {}
): Promise<string> {
  const { errorCorrectionLevel, width, color } = { ...DEFAULT_OPTIONS, ...options };
  const QRCode = await getQRCode();
  return QRCode.toDataURL(data, {
    errorCorrectionLevel,
    width,
    color,
    margin: 2,
  });
}

/**
 * Generate a QR code as an SVG string.
 * Useful for server-side rendering.
 */
export async function generateQRSvgString(
  data: string,
  options: QROptions = {}
): Promise<string> {
  const { errorCorrectionLevel, width } = { ...DEFAULT_OPTIONS, ...options };
  const QRCode = await getQRCode();
  return QRCode.toString(data, {
    type: 'svg',
    errorCorrectionLevel,
    width,
    margin: 2,
  });
}

/**
 * Build the URL that gets embedded in the QR code.
 * Points to the verify endpoint so hosts can scan and auto-verify.
 */
export function buildVerifyUrl(accessToken: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${baseUrl}/api/verify?token=${encodeURIComponent(accessToken)}`;
}
