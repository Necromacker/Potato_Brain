const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb+srv://krishnagorde:necromacker@trivia.jm5gy0y.mongodb.net/trivia?retryWrites=true&w=majority&tls=true';

const DB_NAME = 'trivia';

app.use(cors());
app.use(bodyParser.json());

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

    app.post('/api/scores', async (req, res) => {
      const { username, score } = req.body;

      if (!username || typeof score !== 'number') {
        return res.status(400).json({ message: 'Invalid username or score' });
      }

      try {
        const existingUser = await scores.findOne({ username });

        if (existingUser) {
          if (score > existingUser.score) {
            await scores.updateOne(
              { username },
              { $set: { score } }
            );
            console.log(`Score updated for user: ${username}`);
          }
        } else {

          await scores.insertOne({ username, score });
          console.log(`Score stored for new user: ${username}`);
        }

        res.status(200).json({ message: 'Score stored successfully' });
      } catch (err) {
        console.error('Error storing score:', err);
        res.status(500).json({ message: 'Error storing score' });
      }
    });

    app.get('/api/leaderboard', async (req, res) => {
      try {
        const leaderboardData = await scores.find({}).toArray();
        res.status(200).json(leaderboardData);
      } catch (err) {
        console.error('Error retrieving leaderboard:', err);
        res.status(500).json({ message: 'Error retrieving leaderboard' });
      }
    });

    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });

  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); 
  }
}

main();
