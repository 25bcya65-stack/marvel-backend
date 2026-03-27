import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// API endpoint to get all characters
app.get('/api/characters', async (req, res) => {
  try {
    const snapshot = await db.collection('characters').get();
    const characters = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(characters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Marvel Backend running on http://localhost:${PORT}`);
});
