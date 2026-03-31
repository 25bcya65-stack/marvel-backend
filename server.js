import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());   // Important: to read JSON from frontend

// Welcome route
app.get('/', (req, res) => {
  res.send('<h1>✅ Marvel Backend is Running! Try /api/characters or POST to /api/comments</h1>');
});

// Firebase setup with improved private key handling
let db;
try {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
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
  console.log('✅ Firebase connected successfully');
} catch (error) {
  console.error('❌ Firebase init failed:', error.message);
}

// GET all characters (existing)
app.get('/api/characters', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not connected' });
  try {
    const snapshot = await db.collection('characters').get();
    const characters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(characters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// NEW: POST a new comment
app.post('/api/comments', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not connected' });

  const { characterName, commentText, userName = "Anonymous" } = req.body;

  if (!characterName || !commentText) {
    return res.status(400).json({ error: 'characterName and commentText are required' });
  }

  try {
    const commentData = {
      characterName,
      userName,
      commentText,
      timestamp: new Date().toISOString()
    };

    const docRef = await db.collection('comments').add(commentData);
    res.status(201).json({ success: true, id: docRef.id, message: 'Comment saved successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save comment' });
  }
});

const PORT = process.env.PORT || 3000;
// GET comments for a character 
app.get('/api/comments', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
  }

  const { characterName } = req.query;

  try {
    let query = db.collection('comments');
    
    if (characterName) {
      query = query.where('characterName', '==', characterName);
    }
    
    const snapshot = await query.get();
    const comments = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    res.json(comments);
  } catch (error) {
    console.error('Comments error:', error.message);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});
