import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Welcome page
app.get('/', (req, res) => {
  res.send(`
    <h1>✅ Marvel Backend is Running!</h1>
    <p><strong>Test API:</strong> <a href="/api/characters">/api/characters</a></p>
  `);
});

// Firebase with improved private key fix
let db;
try {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
  // Fix common newline and formatting issues
  privateKey = privateKey.replace(/\\n/g, '\n').trim();

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  db = admin.firestore();
  console.log('✅ Firebase Admin SDK connected successfully');
} catch (error) {
  console.error('❌ Firebase init failed:', error.message);
}

// API to get characters from Firebase
app.get('/api/characters', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Firebase not connected - check Logs' });
  }
  try {
    const snapshot = await db.collection('characters').get();
    const characters = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(characters);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
