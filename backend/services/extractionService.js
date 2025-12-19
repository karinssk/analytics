// Thai phone regex: 
// Matches 0xxxxxxxxx, 0xx-xxx-xxxx, 0xx xxx xxxx
// 0[689]\d{8} -> 0 followed by 6,8,9 and 8 digits (mobile 10 digits no sep)
// 0\d{2}-\d{3}-\d{4} -> 0xx-xxx-xxxx (mobile/landline with sep)
// Includes support for slash separated numbers in the example
const PHONE_REGEX = /(\b0[689]\d{8}\b|\b0\d{2}[-\s]?\d{3}[-\s]?\d{4}\b)/g; 

const ADDRESS_KEYWORDS = [
    // English
    'address', 'street', 'road', 'district', 'subdistrict', 'province', 'zip', 'code',
    // Thai
    'ตำบล', 'ต.', 'อำเภอ', 'อ.', 'จังหวัด', 'จ.', 'กทม', 'กรุงเทพ', 
    'ถนน', 'ถ.', 'ซอย', 'หมู่', 'เลขที่', 'แขวง', 'เขต', 'รหัสไปรษณีย์',
    'อาคาร', 'village', 'บ้านเลขที่'
];

// Helper to extract info from text
function extractUserInfo(text) {
    const info = {};
    
    // Phone
    const phoneMatches = text.match(PHONE_REGEX);
    if (phoneMatches && phoneMatches.length > 0) {
        // Return the first found, or join them? 
        // Current implementation expects a string. Let's return the first one for now, 
        // or join if the schema allows text. The schema is User.phone (String).
        // Let's just take the first one found as primary contact.
        info.phone = phoneMatches[0];
    }

    // Address Detection
    const lowerText = text.toLowerCase();
    const hasAddressKeyword = ADDRESS_KEYWORDS.some(keyword => lowerText.includes(keyword));
    
    // Heuristic: If it has keywords and is long enough, assume the whole text is relevant address info
    // OR if it has a zip code pattern (5 digits at end or near end kw)
    // 5 digit zip code regex: \b\d{5}\b
    const ZIP_REGEX = /\b\d{5}\b/;
    const hasZip = ZIP_REGEX.test(text);

    if ((hasAddressKeyword || hasZip) && text.length > 15) {
        info.address = text;
    }

    return info;
}

module.exports = {
    extractUserInfo
};
