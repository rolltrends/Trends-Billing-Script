const msal = require('@azure/msal-node');
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');
const archiver = require('archiver');
const zlib = require('zlib')
const https = require('https');
// const XLSX = require('xlsx');
const csvToExcel = require('./components/csvtoExcel');
const toCSV = require('./components/toCSV');
const collectIds = require("./components/collectIds");
// const filePath = "./invoice.json"; // Path to your JSON file
// const ids = collectIds.collectIds(filePath);


// MSAL configuration
const msalConfig = {
    auth: {
        // c34b260f-6273-40f3-84dd-eb76534d32f8
        clientId: 'a340ced7-9a46-4ced-9176-5e4b40e7ee6a',         // Replace with your Azure AD app's client ID prod
        // clientId: '2c1917b6-a7db-4942-9769-b2d3e23d034e',         // Replace with your Azure AD app's client ID
        // authority: 'https://login.microsoftonline.com/b9d2e4d7-3331-44aa-b735-189229b4c840', // Replace with your tenant ID or 'common' for multi-tenant
        authority: 'https://login.microsoftonline.com/c13441a4-55b9-4ea9-af76-1aedaaf25d48', // prod
        clientSecret: 'coM8Q~.wRD_b71qX4CtclaeGVmgpoBU62f9XJaLF', // Replace with your Azure AD app's client secret
        // clientSecret: 'kWZ8Q~jdIM56XQdt3htqMG16TpyA41UDMXAx7af_', // tgcloudtest

    }
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

async function getToken() {
    const tokenRequest = {
        // scopes: ["https://api.partnercenter.microsoft.com/.default"],
        scopes: ["https://graph.microsoft.com/.default"] 
    };

    try {
        const response = await cca.acquireTokenByClientCredential(tokenRequest);
        console.log(response.accessToken)
        return response.accessToken;
    } catch (error) {
        console.error("Error acquiring token:", error);
    }
}

async function requestUsage(token, type, fragment, period, currencyCode, invoiceId) {
    // const url = type === 'unbilled'
    const url = type === 'billed'
        ? `https://graph.microsoft.com/v1.0/reports/partners/billing/usage/unbilled/export`
        // : `https://graph.microsoft.com/v1.0/reports/partners/billing/reconciliation/billed/export`;
        : `https://graph.microsoft.com/v1.0/reports/partners/billing/usage/billed/export`;


    // const payload = type === 'unbilled' ? {
    const payload = type === 'billed' ? {
        "currencyCode": currencyCode,
        "billingPeriod": period,
        "attributeSet": fragment
    } : {  
        "invoiceId": invoiceId,  
        "attributeSet": fragment  
        }

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
       
        // console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} Usage Response Headers:`, response.headers);
        return response.headers['location'];
        
    } catch (error) {
        console.error(`Error requesting ${type} usage:`, error);
    }
}

async function checkBillingOperationStatus(token, operationLocation) {
    try {
        const response = await axios.get(operationLocation, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Headers',response.headers)
        console.log('Billing Operation Status:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error checking billing operation status:', error);
    }
}

async function fetchInvoiceIds(token) {
    const url = "https://api.partnercenter.microsoft.com/v1/invoices?size=100&offset=0";

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Extract the list of invoice IDs from the response
        const invoiceIds = response.data.items.map(item => item.id);
        console.log("Fetched Invoice IDs:", invoiceIds);
        return invoiceIds;
    } catch (error) {
        console.error("Error fetching invoice IDs:", error.response?.status, error.response?.data || error.message);
        return [];
    }
}

async function downloadBlobs(resourceLocation, invoiceId) {
    const { rootDirectory, sasToken, blobs } = resourceLocation;

    // Create the full SAS URL
    let localFilePath = './Reports-Billed/';
    for (const blob of blobs) {
        const sasUrl = `${rootDirectory}/${blob.name}?${sasToken}`;

        https.get(sasUrl, (response) => {
            // Check for a successful response
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(localFilePath + blob.name);
                response.pipe(fileStream);

                fileStream.on('finish', () => {
                    console.log(`Download complete! File saved at ${localFilePath}`);
                    const inputStream = fs.createReadStream(localFilePath + blob.name);

                    // Create a write stream for the decompressed file
                    const outputStream = fs.createWriteStream(localFilePath + blob.name.substring(0, blob.name.length - 3));

                    // Create a Gunzip stream to decompress the .gz file
                    const gunzip = zlib.createGunzip();

                    // Pipe the input stream through Gunzip and into the output stream
                    inputStream.pipe(gunzip).pipe(outputStream);

                    // Handle success
                    outputStream.on('finish', () => {
                        // Create a read stream for the file
                        const fileStream = fs.createReadStream(localFilePath + blob.name.substring(0, blob.name.length - 3));
                        // console.log(fileStream)
                        // Create an interface to read the file line by line
                        const rl = readline.createInterface({
                            input: fileStream,
                            output: process.stdout,
                            terminal: false,
                        });

                        const dataArray = [];

                        // Read the file line by line
                        rl.on('line', (line) => {
                            try {
                                // Parse the line into a JSON object and add it to the array
                                const jsonObject = JSON.parse(line);
                                dataArray.push(jsonObject);
                            } catch (error) {
                                console.error('Error parsing line:', error);
                            }
                        });

                        rl.on('close', () => {
                            // Remove all unwanted extensions from the blob name
                            const csvFileName = blob.name
                                .replace(/\.json$/, '')
                                .replace(/\.gz$/, '')
                                .replace(/\.c\d{3}\.json$/, '');
                            const csvFilePath = `${localFilePath}${csvFileName}.csv`;

                            // Generate CSV file
                            toCSV.main(dataArray, csvFileName);
                            console.log(`CSV file generated at: ${csvFilePath}`);

                            // Check if the CSV file exists before converting to Excel
                            if (fs.existsSync(csvFilePath)) {
                                try {
                                    // Append the invoiceId to the Excel file name
                                    const outputFileName = `${csvFileName}_${invoiceId}`; // Use the same name for Excel with invoiceId
                                    csvToExcel.convertCsvToExcel(csvFilePath, outputFileName);
                                    console.log(`Excel file generated successfully: ${outputFileName}.xlsx`);
                                } catch (error) {
                                    console.error('Error generating Excel file:', error);
                                }
                            } else {
                                console.error(`CSV file not found: ${csvFilePath}`);
                            }
                        });
                    });

                    // Handle errors
                    inputStream.on('error', (err) => {
                        console.error('Error reading the input file:', err);
                    });

                    outputStream.on('error', (err) => {
                        console.error('Error writing the output file:', err);
                    });

                    gunzip.on('error', (err) => {
                        console.error('Error during decompression:', err);
                    });
                });

                fileStream.on('error', (err) => {
                    console.error('Error writing the file:', err);
                });
            } else {
                console.error(`Failed to download file. Status code: ${response.statusCode}`);
            }
        }).on('error', (err) => {
            console.error('Error during the download:', err);
        });
    }
}

const jsonToXlsx = (jsonData, outputFile) => {
    const ws = XLSX.utils.json_to_sheet(jsonData);  // Convert JSON to a worksheet
    const wb = XLSX.utils.book_new();               // Create a new workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1'); // Append the sheet to the workbook

    XLSX.writeFile(wb, outputFile); // Write the workbook to a file
};

async function main() {
    const token = await getToken();
    if (!token) {
        console.error("Token generation failed.");
        return;
    }

    // Fetch the list of invoice IDs
    const invoiceIds = await fetchInvoiceIds(token);

    if (invoiceIds.length === 0) {
        console.error("No invoice IDs found.");
        return;
    }

    console.log("Processing the following invoice IDs:", invoiceIds);

    for (const invoiceId of invoiceIds) {
        console.log(`Processing invoice ID: ${invoiceId}`);

        const type = 'unbilled';//billed or unbilled
        const fragment = 'full';//full for usageline & basic for recon
        const period = 'current';
        const currencyCode = 'USD';

        const operationLocation = await requestUsage(token, type, fragment, period, currencyCode, invoiceId);
        if (!operationLocation) {
            console.error(`Usage request failed for invoice ID: ${invoiceId}`);
            continue;
        }

        let status;
        do {
            const billingStatus = await checkBillingOperationStatus(token, operationLocation);
            status = billingStatus.status;

            if (status === 'succeeded') {
                console.log(`Operation succeeded for invoice ID: ${invoiceId}`);
                await downloadBlobs(billingStatus.resourceLocation, invoiceId);
                break;
            } else if (status === 'failed') {
                console.error(`The operation failed for invoice ID: ${invoiceId}`);
                break;
            } else {
                console.log(`Status: ${status}. Retrying in ${billingStatus['Retry-After'] || 10} seconds...`);
                await new Promise((resolve) => setTimeout(resolve, (billingStatus['Retry-After'] || 10) * 1000));
            }
        } while (status === 'notstarted' || status === 'running');
    }
}

// async function main() {
//     const token = await getToken();
//     if (!token) {
//         console.error("Token generation failed.");
//         return;
//     }

//     // Choose type: 'unbilled' or 'billed'
//     const type = 'unbilled';
//     const fragment = 'basic'; //full or basic
//     const period = 'last'; //last or previous or current
//     const attributeSet = 'full';
//     const billingPeriod = 'current'
//     const currencyCode = 'USD';
//     const invoiceId = 'G036230675';

//     // Step 1: Request usage
//     const operationLocation = await requestUsage(token, type, fragment, period, currencyCode, invoiceId);
//     console.log("test",operationLocation)
//     if (!operationLocation) {
//         console.error("Usage request failed.");
//         return;
//     }

//     // Step 2: Poll until operation completes
//     let status;
//     do {
//         const billingStatus = await checkBillingOperationStatus(token, operationLocation);
//         status = billingStatus.status;
//         // resource = billingStatus.resourceLocation
//         // if (status === 'Succeeded') {
//         if (status === 'succeeded') {
//             console.log("STATUS", billingStatus)
//             // const manifestDetails = await fetchManifestDetails(token, resource);
//             // console.log("The Manifest: ", manifestDetails)
//             // console.log("ResLoc:", resource)
//             await downloadBlobs(billingStatus.resourceLocation);
//             break;
//         } else if (status === 'failed') {
//             console.log("The operation has failed.");
//             return;
//         } else {
//             console.log(`Status: ${status}. Retrying in ${billingStatus['Retry-After'] || 10} seconds...`);
//             await new Promise(resolve => setTimeout(resolve, (billingStatus['Retry-After'] || 100) * 1000));
//         }
//     } while (status === 'notstarted' || status === 'running');
// }

main()