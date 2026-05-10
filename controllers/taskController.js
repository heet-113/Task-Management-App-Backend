const storage = require('../utils/storage');
const { getIO } = require('../utils/io');

// @desc    Get tasks for user
exports.getTasks = async (req, res, next) => {
  try {
    const tasks = await storage.getTasks();
    const userTasks = tasks.filter((t) => t.user === req.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, count: userTasks.length, data: userTasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single task
exports.getTask = async (req, res, next) => {
  try {
    const tasks = await storage.getTasks();
    const task = tasks.find((t) => t.id === req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.user !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this task' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create task
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, status } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Please provide a task title' });
    }

    const tasks = await storage.getTasks();

    const newTask = {
      id: storage.genId(),
      title: title || '',
      description: description || '',
      dueDate: dueDate || null,
      status: status || 'todo',
      user: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tasks.push(newTask);
    await storage.saveTasks(tasks);

    const io = getIO();
    if (io) {
      io.to(`user:${req.user.id}`).emit('task:created', newTask);
    }

    res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task
exports.updateTask = async (req, res, next) => {
  try {
    const tasks = await storage.getTasks();
    const idx = tasks.findIndex((t) => t.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = tasks[idx];

    if (task.user !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const updates = req.body;
    const updated = { ...task, ...updates, updatedAt: new Date().toISOString() };
    tasks[idx] = updated;
    await storage.saveTasks(tasks);

    const io = getIO();
    if (io) {
      io.to(`user:${req.user.id}`).emit('task:updated', updated);
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete task
exports.deleteTask = async (req, res, next) => {
  try {
    const tasks = await storage.getTasks();
    const idx = tasks.findIndex((t) => t.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = tasks[idx];

    if (task.user !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    tasks.splice(idx, 1);
    await storage.saveTasks(tasks);

    const io = getIO();
    if (io) {
      io.to(`user:${req.user.id}`).emit('task:deleted', { id: req.params.id });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
