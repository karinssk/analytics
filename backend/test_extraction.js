const { extractUserInfo } = require('./services/extractionService');

const examples = [
    `หจก.อุบลเพชรรัตน์ (สำนักงานก่อสร้าง)
43/39 หมู่ 1 ตำบลหนองตำลึง
อำเภอพานทอง จังหวัดชลบุรี 20160
โทร คุณกุ้ง 066-031-6824 / คุณโยกี้ 095-880-7460`,

    `คุณรัชนีวรรณ์
ที่อยู่ 288/40 หมู่บ้านเนอวานา แอทเวิร์คลาดพร้าว ถ.ประเสริฐมนูกิจ  แขวงนวมินทร์  เขตบึงกุ่ม กทม. 10240`,

    `บริษัท วิสวัน แอสเซท จำกัด
204/1 ถนนกาญจนาภิเษก แขวงคลองบางพราน เขตบางบอน จ.กรุงเทพมหานคร 10150
เลขที่ผู้เสียภาษี 0105557039251

ยุ้ย 082-348-2662 ค่ะ`
];

examples.forEach((text, i) => {
    console.log(`--- Example ${i + 1} ---`);
    const info = extractUserInfo(text);
    console.log('Result:', JSON.stringify(info, null, 2));
    if (info.address && info.phone) {
        console.log('PASS');
    } else {
        console.log('FAIL');
    }
});
