require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://movie-master-pro10.netlify.app",
      "https://*.netlify.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.vn6lbjv.mongodb.net/moviesDB?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 1, // ← CHANGE 1: Essential for Vercel
});

// Initialize database connection
let db, moviesCollection, watchListCollection;

async function initializeDatabase() {
  try {
    await client.connect();
    db = client.db("moviesDB");
    moviesCollection = db.collection("movies");
    watchListCollection = db.collection("watchlist");
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

// Initialize on server start
initializeDatabase();

// Test route
app.get("/", (req, res) => {
  res.send("Movie API Server is Running!");
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    if (!moviesCollection) await initializeDatabase();
    res.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
    });
  }
});

// All movie data
app.get("/movies", async (req, res) => {
  try {
    if (!moviesCollection) await initializeDatabase();
    const cursor = moviesCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch movies" });
  }
});

// Get top rated 5 movies
app.get("/movies/top-rated", async (req, res) => {
  try {
    if (!moviesCollection) await initializeDatabase();
    const cursor = moviesCollection.find().sort({ rating: -1 }).limit(5);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch top rated movies" });
  }
});

// Get specific movie
app.get("/movie/:id", async (req, res) => {
  try {
    if (!moviesCollection) await initializeDatabase();
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await moviesCollection.findOne(query);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch movie" });
  }
});

/* Post a movie */
app.post("/movies/add", async (req, res) => {
  try {
    if (!moviesCollection) await initializeDatabase();
    const newMovie = req.body;
    const result = await moviesCollection.insertOne(newMovie);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to add movie" });
  }
});

/* Get user's own added movies */
app.get("/movies/my-collection", async (req, res) => {
  try {
    if (!moviesCollection) await initializeDatabase();
    const email = req.query.addedBy;
    const query = {};
    if (email) {
      query.addedBy = email;
    }
    const cursor = moviesCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch user collection" });
  }
});

/* Delete one movie */
app.delete("/movies/my-collection/:id", async (req, res) => {
  try {
    if (!moviesCollection) await initializeDatabase();
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await moviesCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to delete movie" });
  }
});

/* Send specific data to update */
app.patch("/movies/update/:id", async (req, res) => {
  try {
    if (!moviesCollection) await initializeDatabase();
    const id = req.params.id;
    const updatedMovie = req.body;
    const query = { _id: new ObjectId(id) };
    const update = { $set: updatedMovie };
    const options = {};
    const result = await moviesCollection.updateOne(query, update, options);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to update movie" });
  }
});

/* Latest movies/Recently added */
app.get("/movies/latest", async (req, res) => {
  try {
    if (!moviesCollection) await initializeDatabase();
    const cursor = moviesCollection.find().sort({ createdAt: -1 }).limit(6);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch latest movies" });
  }
});

/* Get genres */
app.get("/movies/genres", async (req, res) => {
  try {
    if (!moviesCollection) await initializeDatabase();
    const projectField = { genre: 1 };
    const genres = await moviesCollection
      .find()
      .project(projectField)
      .toArray();
    const uniqueGenres = [...new Set(genres.map((movie) => movie.genre))];
    res.send(uniqueGenres);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch genres" });
  }
});

/* Post watchlist api */
app.post("/movies/watchlist", async (req, res) => {
  try {
    if (!watchListCollection) await initializeDatabase();
    const watchlistedMovie = req.body;
    const result = await watchListCollection.insertOne(watchlistedMovie);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to add to watchlist" });
  }
});

/* Get api for watchlist */
app.get("/movies/watchlist", async (req, res) => {
  try {
    if (!watchListCollection) await initializeDatabase();
    const email = req.query.email;
    const query = {};
    if (email) {
      query.email = email;
    }
    const cursor = watchListCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch watchlist" });
  }
});

/* Delete api for watchlist */
app.delete("/movies/watchlist/:id", async (req, res) => {
  try {
    if (!watchListCollection) await initializeDatabase();
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await watchListCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to delete from watchlist" });
  }
});

/* Filter by genre and rating */
app.get("/movies/filter", async (req, res) => {
  try {
    if (!moviesCollection) await initializeDatabase();
    const { genres, minRating, maxRating } = req.query;
    const query = {};

    // Genre filter
    if (genres) {
      const genreArray = genres.split(",");
      query.genre = { $in: genreArray };
    }

    // Rating filter
    if (minRating && maxRating) {
      query.rating = {
        $gte: parseFloat(minRating),
        $lte: parseFloat(maxRating),
      };
    } else if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    } else if (maxRating) {
      query.rating = { $lte: parseFloat(maxRating) };
    }

    // Sorting logic
    let sort = {};
    if (minRating && !maxRating) sort.rating = 1;
    else if (maxRating && !minRating) sort.rating = -1;

    const cursor = moviesCollection
      .find(query)
      .project({
        title: 1,
        rating: 1,
        posterUrl: 1,
        genre: 1,
        releaseYear: 1,
      })
      .sort(sort);

    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch filtered movies" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});

// Export for Vercel serverless
module.exports = app;

// IMPORTANT: NO client.close() anywhere! ← CHANGE 2: Essential for Vercel
