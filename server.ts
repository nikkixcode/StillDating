import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory store (for simplicity, resets on server restart)
  // In a real app, use a database or file-based storage
  let users: any[] = [];
  let couples: any[] = [];
  let joinCodes: { [code: string]: string } = {};

  // API Routes
  app.post("/api/auth/login", (req, res) => {
    const { uid, email, displayName, photoURL } = req.body;
    let user = users.find(u => u.uid === uid);
    if (!user) {
      user = {
        uid,
        email,
        displayName,
        photoURL,
        onboardingComplete: false,
        joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      };
      users.push(user);
      joinCodes[user.joinCode] = user.uid;
    }
    res.json(user);
  });

  app.get("/api/users/:uid", (req, res) => {
    const user = users.find(u => u.uid === req.params.uid);
    if (user) res.json(user);
    else res.status(404).json({ error: "User not found" });
  });

  app.patch("/api/users/:uid", (req, res) => {
    const i = users.findIndex(u => u.uid === req.params.uid);
    if (i > -1) {
      users[i] = { ...users[i], ...req.body };
      res.json(users[i]);
    } else res.status(404).json({ error: "User not found" });
  });

  app.get("/api/joinCodes/:code", (req, res) => {
    const uid = joinCodes[req.params.code.toUpperCase()];
    if (uid) res.json({ uid });
    else res.status(404).json({ error: "Invalid code" });
  });

  app.post("/api/couples", (req, res) => {
    const { partner1, partner2 } = req.body;
    const existing = couples.find(c => (c.partner1 === partner1 && c.partner2 === partner2) || (c.partner1 === partner2 && c.partner2 === partner1));
    if (existing) return res.json(existing);

    const couple = {
      id: [partner1, partner2].sort().join("_"),
      partner1,
      partner2,
      createdAt: new Date(),
    };
    couples.push(couple);
    res.json(couple);
  });

  app.get("/api/couples/:id", (req, res) => {
    const couple = couples.find(c => c.id === req.params.id);
    if (couple) res.json(couple);
    else res.status(404).json({ error: "Couple not found" });
  });

  app.patch("/api/couples/:id", (req, res) => {
    const i = couples.findIndex(c => c.id === req.params.id);
    if (i > -1) {
      couples[i] = { ...couples[i], ...req.body };
      res.json(couples[i]);
    } else res.status(404).json({ error: "Couple not found" });
  });

  app.get("/api/couples/search/:uid", (req, res) => {
    const couple = couples.find(c => c.partner1 === req.params.uid || c.partner2 === req.params.uid);
    res.json(couple || null);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
