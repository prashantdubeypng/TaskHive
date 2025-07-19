const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const { checkAuth, requireAuth } = require('./middleware/authentication'); // Updated
const { getUser } = require('./services/auth');

const userRoutes = require('./routers/static');
const logicRoutes = require('./routers/logic');
const todoRoutes = require('./routers/todo');
const teamRoutes = require('./routers/team');
const taskRoutes = require('./routers/tasks');

const TeamModel = require('./models/Team');

mongoose.connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

const app = express();
const port = process.env.PORT || 8000;

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// Public routes first
app.use('/user', userRoutes);

// ✅ Attach user if token exists
app.use(checkAuth('token'));

// ✅ Root route logic: redirect based on token
app.get('/', (req, res) => {
    if (req.user) {
        return res.redirect('/logic/home'); // Logged in
    }
    return res.redirect('/logic/guest'); // Guest
});

// ✅ Authenticated routes
app.use('/logic', logicRoutes);
app.use('/todo', todoRoutes);
app.use('/team', teamRoutes);
app.use('/tasks', taskRoutes);

// ✅ Protected route: Add member page
app.get('/testing/addmember/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    res.render('addmember', { id });
});

// ✅ Protected route: Chatroom
app.get('/chatroom', requireAuth, async (req, res) => {
    try {
        const id = req.user._id;
        const userdata = await TeamModel.find({
            $or: [{ Admin: id }, { members: id }]
        }).select('name _id');

        res.render('chatroom', { userdata });
    } catch (error) {
        console.error('Error in chatroom route:', error);
        res.status(500).send('Internal Server Error');
    }
});

// ✅ Protected route: Assign Task
app.get('/testing/assigntask/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const data = await TeamModel.findOne({ _id: id, Admin: userId });
        if (!data) {
            return res.status(403).send('Only the admin can assign work');
        }

        const teamdata = await TeamModel.findById(id)
            .select('members')
            .populate('members', 'full_name _id');

        return res.render('assigntask', { id, teamdata });
    } catch (error) {
        console.error('Error in assign task route:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// Start server
const server = app.listen(port, () => {
    const assignedPort = server.address().port;
    console.log(`✅ Server running at http://localhost:${assignedPort}`);
});
