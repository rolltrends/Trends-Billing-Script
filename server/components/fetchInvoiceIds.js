const axios = require("axios");

module.exports = {
  fetchInvoiceIds: async (token) => {
    const url = "https://api.partnercenter.microsoft.com/v1/invoices?size=100&offset=0";
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Fetched Invoice Data:", response.data); // Debugging log
      return response.data.items.map(item => item.id); // Extract and return IDs
    } catch (err) {
      console.error("Error fetching Invoice IDs:", err);
      return [];
    }
  },
};