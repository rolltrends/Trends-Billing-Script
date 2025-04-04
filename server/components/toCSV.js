const eol = require("eol");
const {
  Parser,
  transforms: { unwind, flatten },
} = require("json2csv");
const json2csvParser = new Parser({
  transforms: [flatten({ objects: true, arrays: true })],
});
const fs = require("fs");
const path = require("path");

module.exports = {
  async main(arr, viewType) {
    if (arr.length === 0) {
      console.log(`${viewType} does not have any data to be exported`);
    } else {
      let csv = json2csvParser.parse(arr);
      const filename = `${viewType}.csv`; // Ensure the file name ends with .csv
      const outputFilePath = `${path.resolve("./Reports-Billed")}/${filename}`;
      console.log(outputFilePath)
      fs.writeFileSync(outputFilePath, `${eol.split(csv).join(eol.lf)}\n`);
      console.log(`CSV file generated successfully: ${outputFilePath}`);
    }
  },
};