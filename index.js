const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
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

async function run() {
  try {
    await client.connect();

    const db = client.db("travelEaseDB");
    const vehiclesCollection = db.collection("vehicles");
    const bookingsCollection = db.collection("bookings");

    // Root test route
    app.get("/", (req, res) => {
      res.send("TravelEase Server is Running");
    });


    // GET all vehicles OR by user email
    // /vehicles
    // /vehicles?email=someone@gmail.com
    app.get("/vehicles", async (req, res) => {
      try {
        const email = req.query.email;

        let query = {};
        if (email) {
          query = { userEmail: email };
        }

        const result = await vehiclesCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to fetch vehicles", error: err });
      }
    });

    // GET single vehicle by id
    app.get("/vehicles/:id", async (req, res) => {
      try {
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
        const vehicle = req.body;

        // Optional: ensure createdAt exists
        if (!vehicle.createdAt) {
          vehicle.createdAt = new Date().toISOString();
        }

        const result = await vehiclesCollection.insertOne(vehicle);
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to add vehicle", error: err });
      }
    });

    // PATCH update vehicle by id
    app.patch("/vehicles/:id", async (req, res) => {
      try {
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
        const id = req.params.id;
        const result = await vehiclesCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to delete vehicle", error: err });
      }
    });


    // POST booking
    app.post("/bookings", async (req, res) => {
  const booking = req.body;

  const { vehicleId, startDate, endDate } = booking;

  const query = {
    vehicleId: vehicleId,
    $or: [
      {
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      },
    ],
  };

  const existingBooking = await bookingsCollection.findOne(query);

  if (existingBooking) {
    return res.status(400).send({
      message: "This vehicle is already booked for selected dates!",
    });
  }

  const result = await bookingsCollection.insertOne(booking);
  res.send(result);
});


    // GET bookings OR by user email
    // /bookings
    // /bookings?email=someone@gmail.com
    app.get("/bookings", async (req, res) => {
      try {
        const email = req.query.email;

        let query = {};
        if (email) {
          query = { userEmail: email };
        }

        const result = await bookingsCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to fetch bookings", error: err });
      }
    });

    console.log("MongoDB Connected & API Ready");
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
}

run();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
