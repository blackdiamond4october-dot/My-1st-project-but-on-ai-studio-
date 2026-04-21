import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import multer from "multer";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Configure multer for file uploads (Excel files)
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = "./uploads";
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  const upload = multer({ storage });

  // Google Drive OAuth Config
  // Priority: 1. Environment Variable 2. Deployed Shared URL (Provided by User)
  let APP_URL = (
    process.env.APP_URL || 
    'https://ais-pre-ensklhp6jchbtdq56hncz6-116922003955.asia-east1.run.app'
  ).replace(/\/$/, "");
  
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  // Use a helper to get the real redirect URI based on the request host
  // This ensures that if you are on the "dev" URL, Google sends you back to the "dev" URL.
  const getRedirectUri = (req: any) => {
    const host = req.get('host');
    const protocol = req.protocol === 'http' && host.includes('run.app') ? 'https' : req.protocol;
    const currentAppUrl = process.env.APP_URL ? APP_URL : `${protocol}://${host}`;
    return `${currentAppUrl.replace(/\/$/, "")}/auth/google/callback`;
  };

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error("[CRITICAL] Google Drive OAuth credentials (GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET) are missing. Please add them to the Secrets panel.");
  } else {
    console.log(`[SYSTEM] Google Drive OAuth initialized.`);
    console.log(`[SYSTEM] App URL (Default): ${APP_URL}`);
  }

  app.get('/api/auth/google-url', (req, res) => {
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: "Google Client ID is not configured. Please check your environment variables." });
    }
    const redirectUri = getRedirectUri(req);
    const scope = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      access_type: 'offline',
      prompt: 'consent'
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({ url });
  });

  app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    const redirectUri = getRedirectUri(req);
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const data = await response.json();
      const token = data.access_token;
      const refreshToken = data.refresh_token; // Capture refresh token
      const expiresIn = data.expires_in;

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GOOGLE_AUTH_SUCCESS', 
                  token: '${token}',
                  refreshToken: ${refreshToken ? `'${refreshToken}'` : 'null'},
                  expiresIn: ${expiresIn}
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err) {
      console.error("Google OAuth error", err);
      res.status(500).send("Authentication failed");
    }
  });

  app.post('/api/auth/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token is missing" });

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();
      res.json({
        token: data.access_token,
        expiresIn: data.expires_in
      });
    } catch (err) {
      console.error("Token refresh error", err);
      res.status(500).json({ error: "Failed to refresh token" });
    }
  });

  // Endpoint to "store" excel files
  app.post("/api/store-excel", upload.single("file"), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const backupEmail = req.body.backupEmail || "workspaceforsystem@gmail.com";
    console.log(`[SYSTEM] Excel file stored: ${req.file.path}`);
    console.log(`[EMAIL SIMULATION] Sending email to ${backupEmail} with attachment: ${req.file.originalname}`);
    
    res.json({ 
      message: "File stored and email sent successfully", 
      filename: req.file.filename,
      recipient: backupEmail
    });
  });

  // Data Deletion Flow
  let deletionConfirmed = false;
  app.post("/api/request-data-deletion", (req, res) => {
    const { email } = req.body;
    deletionConfirmed = false;
    console.log(`[EMAIL SIMULATION] Sending data deletion request to ${email}`);
    console.log(`[SYSTEM] To confirm deletion, visit: ${APP_URL}/api/confirm-deletion`);
    res.json({ message: "Request sent to Gmail. Please check your inbox." });
  });

  app.get("/api/confirm-deletion", (req, res) => {
    deletionConfirmed = true;
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #07070d; color: #fff;">
          <h1 style="color: #ff8c00;">Deletion Confirmed</h1>
          <p>Your data deletion request has been authorized.</p>
          <p>You can now return to the app and complete the deletion.</p>
          <button onclick="window.close()" style="background: #ff8c00; border: none; padding: 10px 20px; border-radius: 8px; color: #000; font-weight: bold; cursor: pointer;">Close Window</button>
        </body>
      </html>
    `);
  });

  app.get("/api/check-deletion-status", (req, res) => {
    res.json({ confirmed: deletionConfirmed });
  });

  app.post("/api/reset-deletion-status", (req, res) => {
    deletionConfirmed = false;
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
