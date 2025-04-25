const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// === SET YOUR MONGODB CONNECTION URL HERE ===
const MONGODB_URL = 'mongodb+srv://krishnagorde:necromacker@trivia.jm5gy0y.mongodb.net/?retryWrites=true&w=majority&appName=Trivia'; // <-- Replace this with your MongoDB URL
const DB_NAME = 'trivia'; // Your DB name

// Middleware
app.use(cors());
app.use(bodyParser.json());

const client = new MongoClient(MONGODB_URL);

async function main() {
    await client.connect();
    console.log('Connected successfully to MongoDB server');

    const db = client.db(DB_NAME);
    const scores = db.collection('scores');

    // POST route to insert or update score
    app.post('/api/scores', async (req, res) => {
        const { username, score } = req.body;

        if (!username || typeof score !== 'number') {
            return res.status(400).send({ message: 'Invalid username or score' });
        }

        try {
            const existingUser = await scores.findOne({ username });

            if (existingUser) {
                // Update score if new score is higher (optional)
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

            res.status(200).send({ message: 'Score stored successfully' });
        } catch (err) {
            console.error('Error storing score:', err);
            res.status(500).send({ message: 'Error storing score' });
        }
    });

    // GET route to fetch leaderboard
    app.get('/api/leaderboard', async (req, res) => {
        try {
            const leaderboardData = await scores.find({}).toArray();
            res.status(200).send(leaderboardData);
        } catch (err) {
            console.error('Error retrieving leaderboard:', err);
            res.status(500).send({ message: 'Error retrieving leaderboard' });
        }
    });

    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
}

main().catch(console.error);
