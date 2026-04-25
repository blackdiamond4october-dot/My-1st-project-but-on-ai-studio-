import fs from 'fs';
const data = fs.readFileSync('./src/signature.png');
console.log(data.toString('base64'));
