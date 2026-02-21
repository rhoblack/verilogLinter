const text = `Error-[SE] Syntax error
  Following verilog source has syntax error :
  "alu.sv", 9: token is 'endmodule'
1 error`;

const regex = /(?:Error|Warning)-\[.*?\][\s\S]*?"(.*?)"\s*,\s*(\d+)/g;
let match;
while ((match = regex.exec(text)) !== null) {
  console.log('Match found:', match[1], match[2]);
}
