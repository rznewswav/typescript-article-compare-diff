import punycode from 'punycode';

const re = /(\p{Script=Han})|(\w+)|(\d+)/giu;
const t = 'this is an alpha chars 纳吉涉窜改1MDB稽查报告案　高庭允阿鲁甘达转为控方证人 afew num1 123123 1mdb';

console.log(t.match(re)?.map(punycode.encode));