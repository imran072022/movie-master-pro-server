require("dotenv").config();
console.log(process.env);
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("HEllO WORLD!");
});

//#121422

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.vn6lbjv.mongodb.net/?appName=Cluster0`;

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
    //Created DB
    const moviesDB = client.db("moviesDB");
    const moviesCollection = moviesDB.collection("movies");
    //All movie data
    app.get("/movies", async (req, res) => {
      const cursor = moviesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // Get top rated 5 movies
    app.get("/movies/top-rated", async (req, res) => {
      const cursor = moviesCollection.find().sort({ rating: -1 }).limit(5);
      const result = await cursor.toArray();
      res.send(result);
    });
    // Get specific movie
    app.get("/movie/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await moviesCollection.findOne(query);
      res.send(result);
    });

    /*Post a movie */
    app.post("/movies/add", async (req, res) => {
      const newMovie = req.body;
      const result = await moviesCollection.insertOne(newMovie);
      res.send(result);
    });

    /*Get user's own added movies */

    app.get("/movies/my-collection", async (req, res) => {
      const email = req.query.addedBy;
      const query = {};
      if (email) {
        query.addedBy = email;
      }
      const cursor = moviesCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    /*Delete one movie */
    app.delete("/movies/my-collection/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await moviesCollection.deleteOne(query);
      res.send(result);
    });

    /*Send specific data to update */
    app.patch("/movies/update/:id", async (req, res) => {
      const id = req.params.id;
      const updatedMovie = req.body;
      const query = { _id: new ObjectId(id) };
      const update = { $set: updatedMovie };
      const options = {};
      const result = await moviesCollection.updateOne(query, update, options);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
