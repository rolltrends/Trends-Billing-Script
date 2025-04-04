const fs = require("fs");

module.exports = {
  collectIds: (filePath) => {
    try {
      // Read the JSON file
      const jsonData = fs.readFileSync(filePath, "utf8");
      const parsedData = JSON.parse(jsonData);

      // Extract all `id` values from the `items` array
      const ids = parsedData.items.map((item) => item.id);

      console.log("Collected IDs:", ids);
      return ids;
    } catch (error) {
      console.error("Error reading or parsing the JSON file:", error);
      return [];
    }
  },
};