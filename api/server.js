import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Check if running on Vercel
const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel ? '/tmp' : path.join(__dirname, '..', 'data');

const EXERCISES_FILE = path.join(DATA_DIR, 'exercises.json');
const WORKOUTS_FILE = path.join(DATA_DIR, 'workouts.json');
const SESSION_FILE = path.join(DATA_DIR, 'session.json');

// Static paths for seeding (statically analyzed and bundled by Vercel Node File Trace)
const SEED_EXERCISES = path.join(__dirname, '../data/exercises.json');
const SEED_WORKOUTS = path.join(__dirname, '../data/workouts.json');
const SEED_SESSION = path.join(__dirname, '../data/session.json');

// Helper to seed file from repository if it does not exist in /tmp
async function ensureFileExists(filePath, seedPath, defaultValue = []) {
  try {
    await fs.access(filePath);
  } catch (error) {
    // File doesn't exist, try to seed it from seedPath
    try {
      const data = await fs.readFile(seedPath, 'utf-8');
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, data);
    } catch (seedError) {
      // If seed file doesn't exist, write defaultValue
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
    }
  }
}

// Helper to safely read JSON files
async function readJsonFile(filePath, seedPath, defaultValue = []) {
  try {
    await ensureFileExists(filePath, seedPath, defaultValue);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

// Helper to write JSON files
async function writeJsonFile(filePath, data) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
}

// Exercises Endpoints
app.get('/api/exercises', async (req, res) => {
  const exercises = await readJsonFile(EXERCISES_FILE, SEED_EXERCISES, []);
  res.json(exercises);
});

app.post('/api/exercises', async (req, res) => {
  const exercises = await readJsonFile(EXERCISES_FILE, SEED_EXERCISES, []);
  const newExercise = {
    id: Date.now(),
    name: req.body.name,
    muscle: req.body.muscle
  };
  exercises.push(newExercise);
  await writeJsonFile(EXERCISES_FILE, exercises);
  res.status(201).json(newExercise);
});

// Workouts History Endpoints
app.get('/api/workouts', async (req, res) => {
  const workouts = await readJsonFile(WORKOUTS_FILE, SEED_WORKOUTS, []);
  res.json(workouts);
});

app.post('/api/workouts', async (req, res) => {
  const workouts = await readJsonFile(WORKOUTS_FILE, SEED_WORKOUTS, []);
  const completedWorkout = {
    id: Date.now(),
    name: req.body.name || "Workout Session",
    date: new Date().toISOString(),
    elapsed: req.body.elapsed || 0,
    exercises: req.body.exercises || [],
    heartRates: req.body.heartRates || [],
    activeDuration: req.body.activeDuration || 0,
    restDuration: req.body.restDuration || 0
  };
  workouts.push(completedWorkout);
  await writeJsonFile(WORKOUTS_FILE, workouts);
  res.status(201).json(completedWorkout);
});

// Active Session Endpoints
app.get('/api/session', async (req, res) => {
  const sessionState = await readJsonFile(SESSION_FILE, SEED_SESSION, null);
  res.json(sessionState);
});

app.post('/api/session', async (req, res) => {
  await writeJsonFile(SESSION_FILE, req.body);
  res.json({ success: true, state: req.body });
});

export default app;
