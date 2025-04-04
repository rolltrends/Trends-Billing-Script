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

      // Extract the list of invoice IDs from the response
      const invoiceIds = response.data.items.map((item) => item.id);
      console.log("Fetched Invoice IDs:", invoiceIds);
      return invoiceIds;
    } catch (error) {
      console.error(
        "Error fetching invoice IDs:",
        error.response?.status,
        error.response?.data || error.message
      );
      return [];
    }
  },
};