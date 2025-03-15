const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cookiesparser = require('cookie-parser');
const checkAuth = require("./middleware/authentication");
const user = require('./routers/static');
const logic = require('./routers/logic');
const todo = require('./routers/todo');
const Team = require('./routers/team')
const TeamModel = require('./models/Team')
const tasks = require('./routers/tasks');
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskhive', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));
const app = express();
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookiesparser());
app.use('/user', user); // Public routes first
app.use(checkAuth('token')); // Auth middleware applied after
app.get('/', (req, res) => {
    return res.redirect('logic/home')
})
app.use('/logic', logic)
app.use('/todo',todo)
app.use('/team',Team)
app.use('/tasks',tasks)
// to render the addmember page
app.get('/testing/addmember/:id', (req, res) => {
    const {id} = req.params;
    res.render('addmember', { id: id });
})
app.get('/teasting/assigntask/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const data = await TeamModel.findOne({ _id: id, Admin: user });
        if (!data) {
            return res.status(403).send('Only the admin can assign work');
        }
        const teamdata = await TeamModel.findById(id)
            .select('members')
            .populate('members', 'full_name _id');
        return res.render('assigntask', { id, teamdata });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});
const server = app.listen(port, () => {
    const assignedPort = server.address().port;
    console.log(`Server running at http://localhost:${assignedPort}`);
});