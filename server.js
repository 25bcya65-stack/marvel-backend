import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("🚀 Starting Marvel Backend...");

// Safe Firebase Initialization
let db = null;
try {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();

  if (!process.env.FIREBASE_PROJECT_ID || 
      !process.env.FIREBASE_CLIENT_EMAIL || 
      !privateKey) {
    throw new Error("Missing one or more Firebase environment variables");
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  db = admin.firestore();
  console.log("✅ Firebase Admin SDK connected successfully");
} catch (error) {
  console.error("❌ Firebase initialization FAILED:", error.message);
  console.error("Please check your Environment Variables on Render");
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Marvel Backend Status</h1>
    <p>Firebase: ${db ? '✅ Connected' : '❌ Failed'}</p>
    <p><a href="/api/characters">Test Characters</a></p>
  `);
});

app.get('/api/characters', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Firebase not connected' });
  try {
    const snapshot = await db.collection('characters').get();
    const characters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(characters);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/comments', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Firebase not connected' });
  const { characterName } = req.query;
  try {
    let query = db.collection('comments');
    if (characterName) query = query.where('characterName', '==', characterName);
    const snapshot = await query.get();
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(comments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/comments', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Firebase not connected' });

  const { characterName, commentText, userName = "Anonymous" } = req.body;

  if (!characterName || !commentText) {
    return res.status(400).json({ error: 'characterName and commentText required' });
  }

  try {
    const commentData = {
      characterName,
      userName,
      commentText,
      timestamp: new Date().toISOString()
    };

    const docRef = await db.collection('comments').add(commentData);
    console.log(`✅ Comment saved with ID: ${docRef.id}`);
    res.json({ success: true, id: docRef.id });
  } catch (e) {
    console.error("Save error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
