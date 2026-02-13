const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

/* ======================================
   ✅ PROPER CORS FOR VERCEL (FINAL)
====================================== */

const allowedOrigins = [
  "http://localhost:5173",
  "https://travelease-288b7.web.app",
  "https://travelease-288b7.firebaseapp.com",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // 🔥 Handle Preflight Requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());

/* ======================================
   ✅ MongoDB Setup
====================================== */

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p6fabb5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let cachedDb = null;
let cachedClientPromise = null;

async function connectDB() {
  if (cachedDb) return cachedDb;

  if (!cachedClientPromise) {
    cachedClientPromise = client.connect();
  }

  await cachedClientPromise;
  cachedDb = client.db("travelEaseDB");
  console.log("✅ MongoDB Connected");

  return cachedDb;
}

/* ======================================
   ✅ Root Route
====================================== */

app.get("/", (req, res) => {
  res.send("TravelEase Server is Running ✅");
});

/* ======================================
   ✅ Vehicles Routes
====================================== */

app.get("/vehicles", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("vehicles");

    const email = req.query.email;
    const query = email ? { userEmail: email } : {};

    const result = await collection.find(query).toArray();
    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch vehicles",
      error: err.message,
    });
  }
});

app.get("/vehicles/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("vehicles");

    const result = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch vehicle",
      error: err.message,
    });
  }
});

app.post("/vehicles", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("vehicles");

    const vehicle = req.body;
    vehicle.createdAt = new Date().toISOString();

    const result = await collection.insertOne(vehicle);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Failed to add vehicle",
      error: err.message,
    });
  }
});

app.patch("/vehicles/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("vehicles");

    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Failed to update vehicle",
      error: err.message,
    });
  }
});

app.delete("/vehicles/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("vehicles");

    const result = await collection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete vehicle",
      error: err.message,
    });
  }
});

/* ======================================
   ✅ Bookings Routes
====================================== */

app.post("/bookings", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("bookings");

    const booking = req.body;
    const { vehicleId, startDate, endDate } = booking;

    const existing = await collection.findOne({
      vehicleId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });

    if (existing) {
      return res.status(400).json({
        message: "Vehicle already booked for selected dates!",
      });
    }

    const result = await collection.insertOne(booking);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Failed to add booking",
      error: err.message,
    });
  }
});

app.get("/bookings", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("bookings");

    const email = req.query.email;
    const query = email ? { userEmail: email } : {};

    const result = await collection.find(query).toArray();
    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch bookings",
      error: err.message,
    });
  }
});

app.delete("/bookings/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("bookings");

    const result = await collection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete booking",
      error: err.message,
    });
  }
});

/* ======================================
   ✅ Export for Vercel
====================================== */

module.exports = app;
