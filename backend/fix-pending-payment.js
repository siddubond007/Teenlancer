const fs = require('fs');
const schemaFile = 'backend/prisma/schema.prisma';

// 1. Add PENDING_PAYMENT to the schema enum
let code = fs.readFileSync(schemaFile, 'utf8');
if (!code.includes('PENDING_PAYMENT')) {
    const enumMatch = code.match(/enum OrderStatus\s*\{([\s\S]*?)\}/);
    if (enumMatch) {
        let enumBody = enumMatch[1];
        enumBody = enumBody.replace(/FUNDED_IN_ESCROW/, "PENDING_PAYMENT\n  FUNDED_IN_ESCROW");
        code = code.replace(enumMatch[0], `enum OrderStatus {${enumBody}}`);
        fs.writeFileSync(schemaFile, code);
        console.log("✅ Added PENDING_PAYMENT to schema.prisma");
    }
}
