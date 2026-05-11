const fs = require('fs');
const buf = fs.readFileSync('public/images/base/body-default.png');
const width = buf.readInt32BE(16);
const height = buf.readInt32BE(20);
console.log(`Width: ${width}, Height: ${height}`);
