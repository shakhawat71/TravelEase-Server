const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());


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

    // ✅ Root test
    app.get("/", (req, res) => {
      res.send("TravelEase Server is Running ✅");
    });

    // ✅ GET all vehicles
    app.get("/vehicles", async (req, res) => {
    const email = req.query.email;

    let query = {};
    if (email) {
    query = { userEmail: email };
    }

    const result = await vehiclesCollection.find(query).toArray();
    res.send(result);
    });


    // POST a vehicle
    app.post("/vehicles", async (req, res) => {
      const vehicle = req.body;
      const result = await vehiclesCollection.insertOne(vehicle);
      res.send(result);
    });

    // GET single vehicle
    app.get("/vehicles/:id", async (req, res) => {
      const id = req.params.id;
      const result = await vehiclesCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // DELETE a vehicle
    app.delete("/vehicles/:id", async (req, res) => {
      const id = req.params.id;
      const result = await vehiclesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    //  UPDATE a vehicle
    app.patch("/vehicles/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const result = await vehiclesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );

      res.send(result);
    });

    console.log("MongoDB Connected & API Ready");
  } catch (error) {
    console.log(error);
  }
}

run();

app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});
