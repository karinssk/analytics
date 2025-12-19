// Mock regex patterns for extraction
const PHONE_REGEX = /(\b0[689]\d{8}\b|\b0\d{2}-\d{3}-\d{4}\b)/; // Basic Thai phone regex example
const ADDRESS_KEYWORDS = ['address', 'street', 'road', 'district', 'subdistrict', 'province', 'zip', 'code'];

// Helper to extract info from text
function extractUserInfo(text) {
    const info = {};
    
    // Phone
    const phoneMatch = text.match(PHONE_REGEX);
    if (phoneMatch) {
        info.phone = phoneMatch[0];
    }

    // Address (very basic heuristic: if text contains address keywords and is long enough)
    const lowerText = text.toLowerCase();
    const hasAddressKeyword = ADDRESS_KEYWORDS.some(keyword => lowerText.includes(keyword));
    if (hasAddressKeyword && text.length > 20) {
        info.address = text;
    }

    return info;
}

module.exports = {
    extractUserInfo
};
