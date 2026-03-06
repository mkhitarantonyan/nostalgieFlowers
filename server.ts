import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import dotenv from "dotenv";
import session from "express-session";
import path from 'path';


dotenv.config();

const db = new Database("orders.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_surname TEXT,
    phone TEXT,
    address TEXT,
    items TEXT,
    total_price REAL,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    stripe_payment_intent_id TEXT,
    is_archived INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add is_archived if it doesn't exist (for existing databases)
try {
  db.prepare("ALTER TABLE orders ADD COLUMN is_archived INTEGER DEFAULT 0").run();
} catch (e) {
  // Column likely already exists
}

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    image TEXT,
    description TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed initial data if empty
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (productCount.count === 0) {
  const insertProduct = db.prepare("INSERT INTO products (name, price, image, description, category) VALUES (?, ?, ?, ?, ?)");
  insertProduct.run("Signature Velvet Box", 120, "https://ais-pre-kmoknsmjgxv3ytsswjjvfl-265915447700.europe-west2.run.app/input_file_0.png", "Our signature arrangement in a premium velvet box.", "Premium");
  insertProduct.run("Elegance Bouquet", 85, "https://ais-pre-kmoknsmjgxv3ytsswjjvfl-265915447700.europe-west2.run.app/input_file_2.png", "A classic arrangement of white roses and seasonal greenery.", "Bouquets");
  insertProduct.run("Nostalgie Gift Bag", 45, "https://ais-pre-kmoknsmjgxv3ytsswjjvfl-265915447700.europe-west2.run.app/input_file_3.png", "A charming floral gift in our branded eco-friendly bag.", "Gifts");
}

// Force update settings to Nostalgie branding if they are still set to the old defaults or empty
const currentShopName = db.prepare("SELECT value FROM settings WHERE key = 'shop_name'").get() as { value: string } | undefined;
if (!currentShopName || currentShopName.value === 'Flora & Bloom') {
  const upsertSetting = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  upsertSetting.run("hero_title", "NOSTALGIE FLOWERS");
  upsertSetting.run("hero_subtitle", "Where elegance becomes memory. Premium floral design in Los Angeles.");
  upsertSetting.run("shop_name", "Nostalgie Flowers");
  upsertSetting.run("contact_phone", "+1 (213) 555-0199");
  upsertSetting.run("contact_address", "Los Angeles, CA");
}

// Extend session type
declare module 'express-session' {
  interface SessionData {
    isAdmin: boolean;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Говорим Express доверять HTTPS-соединению от Render
app.set('trust proxy', 1);

app.use(session({
  // ... тут ваши настройки сессии
}));
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "nostalgie-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth middleware
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.session.isAdmin) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  // --- Orders API ---
  app.post("/api/orders", (req, res) => {
    const { name, surname, phone, address, items, totalPrice } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO orders (customer_name, customer_surname, phone, address, items, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(name, surname, phone, address, JSON.stringify(items), totalPrice);
      res.json({ success: true, orderId: result.lastInsertRowid });
    } catch (error) {
      console.error("Order error:", error);
      res.status(500).json({ error: "Failed to save order" });
    }
  });

  app.get("/api/orders", requireAdmin, (req, res) => {
    try {
      const orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
      res.json(orders.map(order => ({
        ...order,
        items: JSON.parse(order.items as string)
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/orders/:id/status", requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.patch("/api/orders/:id/archive", requireAdmin, (req, res) => {
    const { id } = req.params;
    const { is_archived } = req.body;
    try {
      db.prepare("UPDATE orders SET is_archived = ? WHERE id = ?").run(is_archived ? 1 : 0, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to archive order" });
    }
  });

  app.delete("/api/orders/:id", requireAdmin, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM orders WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  app.post("/api/orders/archive-old", requireAdmin, (req, res) => {
    try {
      // Archive orders older than 7 days
      const result = db.prepare("UPDATE orders SET is_archived = 1 WHERE created_at < datetime('now', '-7 days') AND is_archived = 0").run();
      res.json({ success: true, count: result.changes });
    } catch (error) {
      res.status(500).json({ error: "Failed to archive old orders" });
    }
  });

  // --- Products API ---
  app.get("/api/products", (req, res) => {
    try {
      const products = db.prepare("SELECT * FROM products ORDER BY id DESC").all();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", requireAdmin, (req, res) => {
    const { name, price, image, description, category } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO products (name, price, image, description, category) VALUES (?, ?, ?, ?, ?)");
      const result = stmt.run(name, price, image, description, category);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to add product" });
    }
  });

  app.delete("/api/products/:id", requireAdmin, (req, res) => {
    const { id } = req.params;
    console.log(`Attempting to delete product with ID: ${id}`);
    try {
      const result = db.prepare("DELETE FROM products WHERE id = ?").run(Number(id));
      console.log(`Delete result: ${JSON.stringify(result)}`);
      if (result.changes > 0) {
        res.json({ success: true });
      } else {
        console.warn(`Product with ID ${id} not found for deletion.`);
        res.status(404).json({ error: "Product not found" });
      }
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // --- Settings API ---
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    try {
      const dbPasswordRow = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get() as { value: string } | undefined;
      const adminPassword = dbPasswordRow?.value || process.env.ADMIN_PASSWORD || "admin123";
      
      if (password === adminPassword) {
        req.session.isAdmin = true;
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, error: "Invalid password" });
      }
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/admin/check", (req, res) => {
    res.json({ isAdmin: !!req.session.isAdmin });
  });

  app.get("/api/settings", (req, res) => {
    try {
      const settings = db.prepare("SELECT * FROM settings WHERE key != 'admin_password'").all() as { key: string, value: string }[];
      const settingsObj = settings.reduce((acc: any, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      res.json(settingsObj);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", requireAdmin, (req, res) => {
    const { settings } = req.body; // Expecting { key: value }
    try {
      const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
      const transaction = db.transaction((data) => {
        for (const [key, value] of Object.entries(data)) {
          upsert.run(key, value);
        }
      });
      transaction(settings);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }
// 1. Раздаем скомпилированные файлы React (папку dist)
app.use(express.static(path.resolve('dist')));

// 2. Все остальные запросы (например, прямая ссылка на /admin) перенаправляем в React
app.get('*', (req, res) => {
  res.sendFile(path.resolve('dist', 'index.html'));
});

// app.listen(PORT, () => console.log('Server is running...'));
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
