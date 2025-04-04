require('dotenv').config(); // Load environment variables from .env file
const msal = require('@azure/msal-node');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const passport = require('passport')
const expressSession = require('express-session')
const { PrismaSessionStore} = require('@quixo3/prisma-session-store')
const LocalStrategy = require('passport-local')
const cors = require('cors');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios')
const cookieParser = require('cookie-parser')
const https = require('https');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib')
const readline = require('readline');
const app = express();
const server = http.createServer(app);
const { collectIds } = require('./components/collectIds');
const { fetchInvoiceIds } = require('./components/fetchInvoiceIds');

// Enable CORS for frontend (React)
app.use(cors({
  origin: process.env.APP_URL, // Specify the frontend origin
  credentials: true, // Allow credentials (cookies, HTTP authentication, etc.)
}));

// Middleware to log incoming HTTP requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request from ${req.headers.origin} to ${req.url}`);
  next();
});

const BASE_PATH = process.env.BASE_PATH || ''

app.use(
  expressSession({
    name: process.env.SESSION_NAME || 'billing_session',
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined
    }),
    cookie: {
      name: process.env.COOKIE_NAME || 'billing_cookie',
      name: 'billing',
      sameSite: 'lax',
      httpOnly: true,
      secure: false,//process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8 // 8 hours
    }
  })
);
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_KEY));

app.use(passport.initialize());
app.use(passport.session());

// billing
const msalConfig = {
  auth: {
      clientId: process.env.CLIENT_ID,         // Replace with your Azure AD app's client ID prod
      authority: process.env.CLIENT_AUTHORITY, // prod
      clientSecret: process.env.CLIENT_SECRET, // Replace with your Azure AD app's client secret

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

// Utility function to flatten nested JSON objects
const flattenObject = (obj, parent = '', res = {}) => {
  for (let key in obj) {
    const propName = parent ? `${parent}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      flattenObject(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
};

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

let parsedJsonData = []; // Global variable to store parsed JSON data

async function downloadBlobs(resourceLocation, invoiceId) {
    const { rootDirectory, sasToken, blobs } = resourceLocation;

    // Create the local directory for saving files
    const localFilePath = './Reports-Billed/';
    if (!fs.existsSync(localFilePath)) {
        fs.mkdirSync(localFilePath, { recursive: true });
    }

    for (const blob of blobs) {
        const sasUrl = `${rootDirectory}/${blob.name}?${sasToken}`;

        https.get(sasUrl, (response) => {
            if (response.statusCode === 200) {
                const gzFilePath = localFilePath + blob.name; // Path for the downloaded .gz file
                const fileStream = fs.createWriteStream(gzFilePath);
                response.pipe(fileStream);

                fileStream.on('finish', () => {
                    console.log(`Download complete! gzip file saved at ${gzFilePath}`);

                    // Decompress the .gz file
                    const unzippedFilePath = gzFilePath.replace(/\.gz$/, ''); // Remove .gz extension
                    const inputStream = fs.createReadStream(gzFilePath);
                    const outputStream = fs.createWriteStream(unzippedFilePath);
                    const gunzip = zlib.createGunzip();

                    inputStream
                        .pipe(gunzip)
                        .pipe(outputStream)
                        .on('finish', () => {
                            console.log(`File successfully unzipped to ${unzippedFilePath}`);

                            // Read and parse the JSON file
                            fs.readFile(unzippedFilePath, 'utf8', (err, data) => {
                                if (err) {
                                    console.error('Error reading the JSON file:', err);
                                } else {
                                    console.log('Raw JSON file content:', data); // Log the raw content
                                    try {
                                        // Split the file into lines and parse each line as JSON
                                        const lines = data.split('\n');
                                        const jsonDataArray = lines.map((line) => {
                                            try {
                                                return JSON.parse(line); // Parse each line
                                            } catch (lineErr) {
                                                console.error('Error parsing line:', line, lineErr);
                                                return null; // Skip invalid lines
                                            }
                                        }).filter((item) => item !== null); // Remove null entries

                                        // console.log('Parsed JSON data:', jsonDataArray);

                                        // Store the parsed JSON data in memory
                                        parsedJsonData = [...parsedJsonData, ...jsonDataArray];
                                    } catch (parseErr) {
                                        console.error('Error parsing the JSON file:', parseErr);
                                    }
                                }
                            });
                        })
                        .on('error', (err) => {
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

app.get('/api/unbilled-json', (req, res) => {
    if (parsedJsonData.length === 0) {
        return res.status(404).send({ message: 'No JSON data available' });
    }

    res.status(200).send({ data: parsedJsonData });
});

app.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send('Failed to log out');
    }
    res.send({message:'successfully logged out', redirect:'/'}); // Redirect to login page after logout
  });
});

app.post('/api/changepassword', async (req, res) => {
  const { password, id } = req.body
  try {
    const user = await prisma.user.update({ 
      where : {
        id: id
      },
      data: {
        isFirstLogin: false,
        password: password
      }
     },);
    
    return res.status(200).send('Succefully changed.');
  } catch (err) {
    console.log(err)
    return res.status(500).send('Failed to log out');
  }
});

app.post('/api/unbilled-recon-line-items', async (req, res) => {
  // const { provider="onetime", invoicelineitemtype = "billinglineitems",  currencycode = "usd", period} = req.body
  const { provider = "onetime", invoicelineitemtype = "billinglineitems",  currencycode = "usd", period} = req.body
  // {
    // currencycode = "usd",
    // period = "previous",
    // provider = "onetime",
    // invoicelineitemtype = "billinglineitems"
  // }
  const token = await getToken()

  try {
    const url = `https://api.partnercenter.microsoft.com/v1//invoices/unbilled/lineitems?provider=${provider}&invoicelineitemtype=${invoicelineitemtype}&currencycode=usd&period=${period}`;

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("Unbilled Usage Response Headers:", response.headers);
        return res.status(200).send({ message: "success" , data: response.data})
   //return res.status(200).send('Succefully changed.');
  } catch (err) {
    console.log(err)
    return res.status(500).send('Failed to log out');
  }
});


app.post('/api/unbilled-usage-line-items', async (req, res) => {
  const { period, attributeSet = "full", currencyCode = "USD" } = req.body;

  const token = await getToken(); // Retrieve the token

  try {
    const url = `https://graph.microsoft.com/v1.0/reports/partners/billing/usage/unbilled/export`;

    const response = await axios.post(
      url,
      {
        currencyCode: currencyCode,
        billingPeriod: period,
        attributeSet: attributeSet,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Unbilled-daily-rated Response Headers:", response.headers);

    // Extract the operation location from the response headers
    const operationLocation = response.headers['location']; // Assuming the operation location is in the 'location' header
    console.log("Operation Location:", operationLocation);

    // Use checkBillingOperationStatus to get the resource location
    const billingStatus = await checkBillingOperationStatus(token, operationLocation);

    if (billingStatus && billingStatus.resourceLocation) {
      const { rootDirectory, sasToken, blobs } = billingStatus.resourceLocation;

      // Call the downloadBlobs function to download JSON files
      await downloadBlobs(billingStatus.resourceLocation);
      console.log("Parsed JSON Data to be sent:", parsedJsonData);

      // Flatten the parsed JSON data
      const flattenedData = parsedJsonData.map(item => flattenObject(item));

      // Return the flattened data
      return res.status(200).send({
        message: "success",
        data: flattenedData,
      });
    } else {
      return res.status(500).send("Failed to retrieve resource location details");
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Failed to fetch data");
  }
});

app.post('/api/invoiceIds', async (req, res) => {
  const token = await getToken(); // Retrieve the token
  const filePath = path.join(__dirname, './data/invoices.json'); // Path to the fallback JSON file

  try {
    // Fetch invoice IDs dynamically
    let invoiceIds = await fetchInvoiceIds(token);
    console.log("Fetched Invoice IDs:", invoiceIds); // Debugging log

    // If no IDs are fetched, fall back to reading from the JSON file
    if (!invoiceIds || invoiceIds.length === 0) {
      console.warn("Falling back to collectIds...");
      invoiceIds = collectIds(filePath); // Use collectIds to read from invoices.json
    } else {
      // Write fetched Invoice IDs to the JSON file
      const dataToWrite = { items: invoiceIds.map(id => ({ id })) };
      fs.writeFileSync(filePath, JSON.stringify(dataToWrite, null, 2));
      console.log("Invoice IDs written to invoices.json:", dataToWrite);
    }

    if (!invoiceIds || invoiceIds.length === 0) {
      return res.status(404).send({ message: "No invoice IDs found" });
    }

    // Return only the invoice IDs
    return res.status(200).send({
      message: "success",
      invoiceIds: invoiceIds,
    });
  } catch (err) {
    console.error("Error in /api/invoiceIds:", err);
    return res.status(500).send("Failed to fetch invoice IDs");
  }
});

app.post('/api/billed-recon-line-items', async (req, res) => {
  const { invoiceId , attributeSet = "full"} = req.body; // Get the selected invoice ID from the request
  // {
  //   "invoiceId": "G016907411",  
  //   "attributeSet": "basic"
  // }
  const token = await getToken(); // Retrieve the token

  try {
    const url = `https://graph.microsoft.com/v1.0/reports/partners/billing/reconciliation/billed/export`;

    const response = await axios.post(
      url,
      {
        invoiceId: invoiceId,
        attributeSet: attributeSet,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Unbilled-daily-rated Response Headers:", response.headers);

    // Extract the operation location from the response headers
    const operationLocation = response.headers['location']; // Assuming the operation location is in the 'location' header
    console.log("Operation Location:", operationLocation);

    // Use checkBillingOperationStatus to get the resource location
    const billingStatus = await checkBillingOperationStatus(token, operationLocation);

    if (billingStatus && billingStatus.resourceLocation) {
      const { rootDirectory, sasToken, blobs } = billingStatus.resourceLocation;

      // Call the downloadBlobs function to download JSON files
      await downloadBlobs(billingStatus.resourceLocation);
      console.log("Parsed JSON Data to be sent:", parsedJsonData);

      // Flatten the parsed JSON data
      const flattenedData = parsedJsonData.map(item => flattenObject(item));

      // Return the flattened data
      return res.status(200).send({
        message: "success",
        data: flattenedData,
      });
    } else {
      return res.status(500).send("Failed to retrieve resource location details");
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Failed to fetch data");
  }
});

app.post('/api/billed-usage-line-items', async (req, res) => {
  const { invoiceId = "G033958862" , attributeSet = "full"} = req.body; // Get the selected invoice ID from the request
  // {
  //   "invoiceId": "G016907411",  
  //   "attributeSet": "basic"
  // }
  const token = await getToken(); // Retrieve the token

  try {
    const url = `https://graph.microsoft.com/v1.0/reports/partners/billing/usage/billed/export`;

    const response = await axios.post(
      url,
      {
        invoiceId: invoiceId,
        attributeSet: attributeSet,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Unbilled-daily-rated Response Headers:", response.headers);

    // Extract the operation location from the response headers
    const operationLocation = response.headers['location']; // Assuming the operation location is in the 'location' header
    console.log("Operation Location:", operationLocation);

    // Use checkBillingOperationStatus to get the resource location
    const billingStatus = await checkBillingOperationStatus(token, operationLocation);

    if (billingStatus && billingStatus.resourceLocation) {
      const { rootDirectory, sasToken, blobs } = billingStatus.resourceLocation;

      // Call the downloadBlobs function to download JSON files
      await downloadBlobs(billingStatus.resourceLocation);
      console.log("Parsed JSON Data to be sent:", parsedJsonData);

      // Flatten the parsed JSON data
      const flattenedData = parsedJsonData.map(item => flattenObject(item));

      // Return the flattened data
      return res.status(200).send({
        message: "success",
        data: flattenedData,
      });
    } else {
      return res.status(500).send("Failed to retrieve resource location details");
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Failed to fetch data");
  }
});


app.post(`/api/loginLocal`, function (req, res, next) {
  const { content } = req.body; // Destructure directly from req.body
  console.log(content);

  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      return next(err);  // Handle authentication error
    }
    if (!user) {
      return res.status(400).send(info.message); // Invalid credentials
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);  // Handle login error
      }

      user.loginType = 'local';
      return res.send({ user, message: 'Login successful' });
    });
  })(req, res, next);
});

app.get(`${BASE_PATH}/api/local`, (req, res) => {
  res.status(200).send(req.user);
});

passport.use('local', new LocalStrategy(async function (username, password, done) {
  try {
    const user = await prisma.user.findFirst({
      where: { username : username, password: password }
    });

    if (!user) {
      return done(null, false, { message: 'Invalid Credentials.' });
    }

    // io.emit('login', user.username);
    return done(null, user);  // Corrected to return 'user' instead of 'result'
  } catch (err) {
    return done(err);  // Handle database or other errors
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);  // Serialize only the necessary user data (e.g., user ID)
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user); // Deserialize to full user object
  } catch (err) {
    done(err); // Handle any errors
  }
});


const PORT = process.env.PORT || 4000; // Use environment variable for port or default to 4000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
