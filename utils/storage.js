const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

const dataDir = path.join(__dirname, '..', 'data');
const usersFile = path.join(dataDir, 'users.json');
const tasksFile = path.join(dataDir, 'tasks.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    // ignore
  }
}

async function readJson(file, fallback = []) {
  await ensureDataDir();
  try {
    const content = await fs.readFile(file, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    return fallback;
  }
}

async function writeJson(file, data) {
  await ensureDataDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

async function getUsers() {
  return readJson(usersFile, []);
}

async function saveUsers(users) {
  return writeJson(usersFile, users);
}

async function getTasks() {
  return readJson(tasksFile, []);
}

async function saveTasks(tasks) {
  return writeJson(tasksFile, tasks);
}

function genId() {
  return randomUUID();
}

module.exports = {
  getUsers,
  saveUsers,
  getTasks,
  saveTasks,
  genId,
};
