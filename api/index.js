const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

// ✅ CORS (allow your client domains)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      // ✅ add your Netlify live site later:
      // "https://your-netlify-site.netlify.app"
    ],
    credentials: true,
  })
);

app.use(express.json());

// MongoDB URI (Atlas)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p6fabb5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let vehiclesCollection;
let bookingsCollection;

// ✅ Connect once and reuse (Vercel needs this style)
async function connectDB() {
  if (vehiclesCollection && bookingsCollection) return;

  await client.connect();
  const db = client.db("travelEaseDB");
  vehiclesCollection = db.collection("vehicles");
  bookingsCollection = db.collection("bookings");
  console.log("✅ MongoDB Connected");
}

app.get("/", async (req, res) => {
  res.send("TravelEase Server is Running ✅");
});

// GET all vehicles OR by user email
app.get("/vehicles", async (req, res) => {
  try {
    await connectDB();

    const email = req.query.email;
    const query = email ? { userEmail: email } : {};

    const result = await vehiclesCollection.find(query).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch vehicles", error: err });
  }
});

// GET single vehicle by id
app.get("/vehicles/:id", async (req, res) => {
  try {
    await connectDB();

    const id = req.params.id;
    const result = await vehiclesCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch vehicle", error: err });
  }
});

// POST a vehicle
app.post("/vehicles", async (req, res) => {
  try {
    await connectDB();

    const vehicle = req.body;
    if (!vehicle.createdAt) vehicle.createdAt = new Date().toISOString();

    const result = await vehiclesCollection.insertOne(vehicle);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to add vehicle", error: err });
  }
});

// PATCH update vehicle by id
app.patch("/vehicles/:id", async (req, res) => {
  try {
    await connectDB();

    const id = req.params.id;
    const updatedData = req.body;

    const result = await vehiclesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update vehicle", error: err });
  }
});

// DELETE vehicle by id
app.delete("/vehicles/:id", async (req, res) => {
  try {
    await connectDB();

    const id = req.params.id;
    const result = await vehiclesCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to delete vehicle", error: err });
  }
});

// POST booking (date overlap check)
app.post("/bookings", async (req, res) => {
  try {
    await connectDB();

    const booking = req.body;
    const { vehicleId, startDate, endDate } = booking;

    const query = {
      vehicleId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    };

    const existingBooking = await bookingsCollection.findOne(query);

    if (existingBooking) {
      return res.status(400).send({
        message: "This vehicle is already booked for selected dates!",
      });
    }

    const result = await bookingsCollection.insertOne(booking);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to add booking", error: err });
  }
});

// GET bookings OR by user email
app.get("/bookings", async (req, res) => {
  try {
    await connectDB();

    const email = req.query.email;
    const query = email ? { userEmail: email } : {};

    const result = await bookingsCollection.find(query).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch bookings", error: err });
  }
});

// DELETE booking
app.delete("/bookings/:id", async (req, res) => {
  try {
    await connectDB();

    const id = req.params.id;
    const result = await bookingsCollection.deleteOne({
      _id: new ObjectId(id),
    });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to delete booking", error: err });
  }
});

// ✅ Export for Vercel (NO app.listen)
module.exports = app;