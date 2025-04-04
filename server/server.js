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
  // req.logout((err) => {
  //   if (err) {
  //     return res.status(500).send('Failed to log out');
  //   }
  //   res.send({message:'successfully logged out', redirect:'/'}); // Redirect to login page after logout
  // });
});

app.post('/api/unbilled', async (req, res) => {
  // const { provider="onetime", invoicelineitemtype = "billinglineitems",  currencycode = "usd", period} = req.body
  const { provider, invoicelineitemtype,  currencycode, period} = req.body
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

// const fetchInvoiceIds = async () => {
//   try {
//     const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/billed`, {}, { withCredentials: true });
//     setInvoiceIds(res.data.invoiceIds || []); // Set the invoice IDs in state
//   } catch (err) {
//     console.error("Error fetching invoice IDs:", err);
//   }
// };

app.post('/api/invoiceIds', async (req, res) => {
  const token = await getToken(); // Retrieve the token
  const filePath = path.join(__dirname, './data/invoices.json'); // Path to the fallback JSON file

  try {
    // Fetch invoice IDs dynamically
    let invoiceIds = await fetchInvoiceIds(token);

    // If no IDs are fetched, fall back to reading from the JSON file
    if (!invoiceIds || invoiceIds.length === 0) {
      console.warn("Falling back to collectIds...");
      invoiceIds = collectIds(filePath);
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

app.post('/api/billed', async (req, res) => {
  const { invoiceId } = req.body; // Get the selected invoice ID from the request
  const token = await getToken(); // Retrieve the token

  try {
    const url = `https://graph.microsoft.com/v1.0/reports/partners/billing/reconciliation/billed/export?invoiceId=${invoiceId}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Billed Export Response Headers:", response.headers);

    return res.status(200).send({
      message: "success",
      data: response.data,
    });
  } catch (err) {
    console.error("Error in /api/billed:", err);
    return res.status(500).send("Failed to fetch billed export data");
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
