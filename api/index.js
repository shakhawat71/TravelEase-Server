const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

// ✅ Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      // ✅ add your Netlify URL after deploy:
      // "https://YOUR-NETLIFY-SITE.netlify.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

// ✅ MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p6fabb5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ✅ Cache DB connection for serverless
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

// ✅ Root
app.get("/", (req, res) => {
  res.send("TravelEase Server is Running ✅");
});

// ✅ Vehicles
app.get("/vehicles", async (req, res) => {
  try {
    const db = await connectDB();
    const vehiclesCollection = db.collection("vehicles");

    const email = req.query.email;
    const query = email ? { userEmail: email } : {};

    const result = await vehiclesCollection.find(query).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch vehicles", error: err.message });
  }
});

app.get("/vehicles/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const vehiclesCollection = db.collection("vehicles");

    const id = req.params.id;
    const result = await vehiclesCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch vehicle", error: err.message });
  }
});

app.post("/vehicles", async (req, res) => {
  try {
    const db = await connectDB();
    const vehiclesCollection = db.collection("vehicles");

    const vehicle = req.body;
    if (!vehicle.createdAt) vehicle.createdAt = new Date().toISOString();

    const result = await vehiclesCollection.insertOne(vehicle);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to add vehicle", error: err.message });
  }
});

app.patch("/vehicles/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const vehiclesCollection = db.collection("vehicles");

    const id = req.params.id;
    const updatedData = req.body;

    const result = await vehiclesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update vehicle", error: err.message });
  }
});

app.delete("/vehicles/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const vehiclesCollection = db.collection("vehicles");

    const id = req.params.id;
    const result = await vehiclesCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to delete vehicle", error: err.message });
  }
});

// ✅ Bookings
app.post("/bookings", async (req, res) => {
  try {
    const db = await connectDB();
    const bookingsCollection = db.collection("bookings");

    const booking = req.body;
    const { vehicleId, startDate, endDate } = booking;

    const query = {
      vehicleId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    };

    const existing = await bookingsCollection.findOne(query);
    if (existing) {
      return res.status(400).send({
        message: "This vehicle is already booked for selected dates!",
      });
    }

    const result = await bookingsCollection.insertOne(booking);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to add booking", error: err.message });
  }
});

app.get("/bookings", async (req, res) => {
  try {
    const db = await connectDB();
    const bookingsCollection = db.collection("bookings");

    const email = req.query.email;
    const query = email ? { userEmail: email } : {};

    const result = await bookingsCollection.find(query).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch bookings", error: err.message });
  }
});

app.delete("/bookings/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const bookingsCollection = db.collection("bookings");

    const id = req.params.id;
    const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to delete booking", error: err.message });
  }
});

// ✅ Vercel export
module.exports = app;
