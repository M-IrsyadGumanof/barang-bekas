const QRCode = require('qrcode');

/**
 * Generate QR code sebagai Data URL (base64 image)
 * @param {string} text - text / token / URL verifikasi
 * @returns {Promise<string>}
 */
async function generateQrDataUrl(text) {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 256,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return null;
  }
}

module.exports = {
  generateQrDataUrl
};

