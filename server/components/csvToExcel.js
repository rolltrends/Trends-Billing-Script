const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

module.exports = {
    convertCsvToExcel: (csvFilePath, outputFileName) => {
        try {
            const csvData = fs.readFileSync(csvFilePath, "utf8");
            const rows = csvData.split("\n").map((row) => row.split(","));
            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.aoa_to_sheet(rows);
            xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
            const outputFilePath = path.resolve("./Reports-Billed") + `/${outputFileName}.xlsx`;
            xlsx.writeFile(workbook, outputFilePath);
            console.log(`Excel file created successfully: ${outputFilePath}`);
        } catch (error) {
            console.error("Error converting CSV to Excel:", error);
        }
    },
};