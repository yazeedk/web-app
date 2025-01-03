const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const path = require("path");

// Initialize Express
const app = express();
const port = 5000;

// MongoDB connection URI and details
const uri = "mongodb+srv://teamtp10:test123@cluster0.5jb5h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "twitter_db";
const collectionName = "tweets";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

// Persistent MongoDB Client
let db;

const connectToDatabase = async () => {
  try {
    const client = await MongoClient.connect(uri); // Removed deprecated options
    console.log("Connected to MongoDB");
    db = client.db(dbName);
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1); // Stop server if DB connection fails
  }
};

// Connect to MongoDB before starting the server
connectToDatabase();

// Default route (Optional: Redirect to your app's main page)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Endpoint to fetch tweets based on a keyword
app.get("/api/tweets", async (req, res) => {
  const keyword = req.query.keyword || "";
  if (!keyword) {
    return res.status(400).json({ error: "Keyword is required." });
  }

  try {
    const collection = db.collection(collectionName);
    const tweets = await collection
      .find({ text: { $regex: keyword, $options: "i" } })
      .toArray();

    res.json({ tweets });
  } catch (err) {
    console.error("Error fetching tweets:", err);
    res.status(500).json({ error: "Failed to fetch tweets." });
  }
});

// Endpoint to fetch trend data (hourly or daily aggregation)
app.get("/api/tweets/trend", async (req, res) => {
  const { aggregation } = req.query;

  if (!aggregation || !['hourly', 'daily'].includes(aggregation)) {
    return res.status(400).json({ error: "Invalid aggregation level. Use 'hourly' or 'daily'." });
  }

  try {
    const collection = db.collection(collectionName);

    const groupBy = aggregation === "hourly"
      ? {
          year: { $year: "$created_at" },
          month: { $month: "$created_at" },
          day: { $dayOfMonth: "$created_at" },
          hour: { $hour: "$created_at" },
        }
      : {
          year: { $year: "$created_at" },
          month: { $month: "$created_at" },
          day: { $dayOfMonth: "$created_at" },
        };

    const trends = await collection
      .aggregate([
        { $group: { _id: groupBy, count: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
      ])
      .toArray();

    res.json({ trends });
  } catch (err) {
    console.error("Error fetching trend data:", err);
    res.status(500).json({ error: "Failed to fetch trend data." });
  }
});

// Start the server only after successful DB connection
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
