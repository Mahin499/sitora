import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { createClient } from '@supabase/supabase-js';

const db = new Database("sitora.db");

// Supabase Client (Lazy Initialization)
let supabaseClient: any = null;
const getSupabase = () => {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL || `https://zgmsvcucnzbotrbffxbj.supabase.co`;
    const key = process.env.SUPABASE_KEY;
    if (url && key) {
      supabaseClient = createClient(url, key);
    }
  }
  return supabaseClient;
};

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    category TEXT,
    image_url TEXT,
    origin TEXT
  );
`);

// Seed initial data if empty
const catCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
if (catCount.count === 0) {
  const insertCat = db.prepare("INSERT INTO categories (name) VALUES (?)");
  ['New Arrivals', 'Plastic Chair', 'Lounge Series', 'Office Essential'].forEach(cat => insertCat.run(cat));
}

const count = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare("INSERT INTO products (name, description, price, category, image_url, origin) VALUES (?, ?, ?, ?, ?, ?)");
  insert.run("Elegance Lounge Chair", "Premium velvet finish with ergonomic support.", 12500, "Lounge Series", "https://picsum.photos/seed/chair1/800/600", "Indonesia");
  insert.run("Modern Plastic Stool", "Durable, stackable, and weather-resistant plastic.", 850, "Plastic Chair", "https://picsum.photos/seed/stool/800/600", "China");
  insert.run("Teak Wood Dining Table", "Solid teak wood with a natural finish.", 45000, "New Arrivals", "https://picsum.photos/seed/table/800/600", "Indonesia");
  insert.run("Minimalist Office Chair", "Sleek design with adjustable height.", 8500, "Office Essential", "https://picsum.photos/seed/office/800/600", "China");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Auth Route
  app.post("/api/login", (req, res) => {
    const { password } = req.body;
    if (password === "admin##223") { // Updated password
      res.json({ success: true, token: "demo-token" });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  // API Routes
  app.get("/api/categories", async (req, res) => {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('categories').select('*');
      if (!error) return res.json(data);
    }
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.post("/api/categories", async (req, res) => {
    const { name, password } = req.body;
    if (password !== "admin##223") {
      return res.status(401).json({ error: "Invalid password" });
    }
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('categories').insert([{ name }]).select();
      if (!error) return res.json(data[0]);
    }
    try {
      const info = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
      res.json({ id: info.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Category already exists" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    const { password } = req.body;
    if (password !== "admin##223") {
      return res.status(401).json({ error: "Invalid password" });
    }
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
      if (!error) return res.json({ success: true });
    }
    db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/products", async (req, res) => {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
      if (!error) return res.json(data);
    }
    const products = db.prepare("SELECT * FROM products ORDER BY id DESC").all();
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    const { name, description, price, category, image_url, origin, password } = req.body;
    if (password !== "admin##223") {
      return res.status(401).json({ error: "Invalid password" });
    }
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('products').insert([{ name, description, price, category, image_url, origin }]).select();
      if (!error) return res.json({ id: data[0].id });
    }
    const info = db.prepare("INSERT INTO products (name, description, price, category, image_url, origin) VALUES (?, ?, ?, ?, ?, ?)")
      .run(name, description, price, category, image_url, origin);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/products/:id", async (req, res) => {
    const { name, description, price, category, image_url, origin, password } = req.body;
    if (password !== "admin##223") {
      return res.status(401).json({ error: "Invalid password" });
    }
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('products').update({ name, description, price, category, image_url, origin }).eq('id', req.params.id);
      if (!error) return res.json({ success: true });
    }
    db.prepare("UPDATE products SET name = ?, description = ?, price = ?, category = ?, image_url = ?, origin = ? WHERE id = ?")
      .run(name, description, price, category, image_url, origin, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", async (req, res) => {
    const { password } = req.body;
    if (password !== "admin##223") {
      return res.status(401).json({ error: "Invalid password" });
    }
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', req.params.id);
      if (!error) return res.json({ success: true });
    }
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
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
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sitora Server running on http://localhost:${PORT}`);
  });
}

startServer();
