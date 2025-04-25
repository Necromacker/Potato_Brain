const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000; // Use environment port or 3000

// === SET YOUR MONGODB CONNECTION URL HERE ===
// IMPORTANT:
// - Replace <password> with your actual password (URL-encoded if needed)
// - Add your default database name after the cluster URL (e.g., /trivia)
// - Include tls=true to enforce SSL/TLS connection
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb+srv://krishnagorde:necromacker@trivia.jm5gy0y.mongodb.net/trivia?retryWrites=true&w=majority&tls=true';

// Database name
const DB_NAME = 'trivia';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create MongoDB client with recommended options
const client = new MongoClient(MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
});

async function main() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB server');

    const db = client.db(DB_NAME);
    const scores = db.collection('scores');

    // POST route to insert or update score
    app.post('/api/scores', async (req, res) => {
      const { username, score } = req.body;

      if (!username || typeof score !== 'number') {
        return res.status(400).json({ message: 'Invalid username or score' });
      }

      try {
        const existingUser = await scores.findOne({ username });

        if (existingUser) {
          // Update score only if new score is higher
          if (score > existingUser.score) {
            await scores.updateOne(
              { username },
              { $set: { score } }
            );
            console.log(`Score updated for user: ${username}`);
          }
        } else {
          // Insert new user score
          await scores.insertOne({ username, score });
          console.log(`Score stored for new user: ${username}`);
        }

        res.status(200).json({ message: 'Score stored successfully' });
      } catch (err) {
        console.error('Error storing score:', err);
        res.status(500).json({ message: 'Error storing score' });
      }
    });

    // GET route to fetch leaderboard
    app.get('/api/leaderboard', async (req, res) => {
      try {
        const leaderboardData = await scores.find({}).toArray();
        res.status(200).json(leaderboardData);
      } catch (err) {
        console.error('Error retrieving leaderboard:', err);
        res.status(500).json({ message: 'Error retrieving leaderboard' });
      }
    });

    // Start server
    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });

  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); // Exit with failure
  }
}

main();
