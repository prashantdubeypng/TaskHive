const express = require('express');
require('dotenv').config()
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user')
const Task = require('../models/Task')
const Team = require('../models/Team')
const TODO = require('../models/Task_Todo')
const { requireAuth } = require('../middleware/authentication');
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD // Use environment variables in production
    }
});
// in this we take a user unique id from the cookies , a token which we have given him , in that payload it has user id
// after getting that id , we search in the db to find the data about the user like name , team name who's part is it
// completed tasks and rest task , name , email
router.get('/profile',async (req,res)=>{
const id = req.user._id;
try{
    const data = await User.findById(id);
    // console.log(data);
    // I have to get all the tasks that are assigned to the user
    const teams = await Team.find({members:id})
    // console.log(teams)
    const tasks = await Task.find({AssignedTo:id}).populate('team',"name")
     console.log(tasks)
    res.render('profile',{data,teams , tasks});
}catch (e) {
console.log(e);
console.log("Error getting user");
}
})
router.get('/forget',async (req,res)=>{
    res.render('forget');
})
router.get('/home', requireAuth, async (req, res) => {
    console.log('on homepage', req.user);

    try {
        const userId = req.user._id;

        // Get teams where the user is a member
        const teams = await Team.find({ members: userId })
            .populate("members", "full_name email")
            .populate("Admin", "full_name");

        // Get tasks assigned to the user
        const tasks = await Task.find({ AssignedTo: userId })
            .populate("team", "name status");

        // Get user's To-Do List
        const todos = await TODO.find({ owner: userId })
            .select('title status description date');

        res.render('home', {
            user: req.user,
            Teams: teams,
            Tasks: tasks,
            TodoList: todos
        });
    } catch (error) {
        console.error("Error fetching home data:", error);
        res.status(500).send("Server Error");
    }
});
router.post('/AddMembers', async (req, res) => {
    try {
        const { memberstoadd, teamid } = req.body;

        // Validate teamid and memberstoadd
        if (!teamid || !Array.isArray(memberstoadd) || memberstoadd.length === 0) {
            return res.status(400).json({ error: "Please enter a valid teamId & memberIds" });
        }

        // Validate member IDs
        if (!memberstoadd.every(id => mongoose.Types.ObjectId.isValid(id))) {
            return res.status(400).json({ error: "Invalid member ID(s) provided" });
        }

        // Check if the user is an admin & fetch team name
        const checkadmin = await Team.findOne({ _id: teamid, Admin: req.user._id }).select('name');
        if (!checkadmin) {
            return res.status(403).json({ error: "Only admin can add new members" });
        }

        // Add members to the team (avoiding duplicates)
        await Team.findByIdAndUpdate(
            teamid,
            { $addToSet: { members: { $each: memberstoadd } } }, // Ensures no duplicates
            { new: true }
        );

        // Add the team to each user's list
        await User.updateMany(
            { _id: { $in: memberstoadd } }, // Finds all users in the array
            { $addToSet: { teams: teamid } } // Adds team ID to their `teams` field
        );

        // Fetch user emails
        const users = await User.find({ _id: { $in: memberstoadd } }, 'email full_name');

        // Send emails asynchronously
        setImmediate(async () => {
            try {
                for (const user of users) {
                    const info = await transporter.sendMail({
                        from: '"TaskHive" <TaskHive.Support@gmail.com>',
                        to: user.email,
                        subject: "You've been added to a team!",
                        text: `Hello ${user.full_name},\n\nYou have been added to the team "${checkadmin.name}" on TaskHive.\n\nBest Regards,\nTaskHive Team`
                    });
                    console.log("Email sent:", info.response);
                }
            } catch (emailError) {
                console.error("Error sending emails:", emailError);
            }
        });

        return res.status(200).json({ ok: true });

    } catch (error) {
        console.error('Error adding members:', error);
        return res.status(500).json({ error: "Something went wrong" });
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('token'); // ✅ Remove the token cookie
    res.json({ success: true, redirect: '/user/' }); // ✅ Send response to frontend
});
router.post('/addTask', async (req, res) => {
   try{
       const { teamId, taskName, taskDescription,memberId,status} = req.body;// memberId is the id of task assigned person
     const newTask =   await Task.create({
           team: teamId,
           title: taskName,
           description: taskDescription,
           AssignedTo: memberId,
           status: status,
       })
       await User.findByIdAndUpdate(memberId,{
           $push:{
               Tasks :newTask._id
           }
       },{new:true})
       await Team.findByIdAndUpdate(teamId,
           {$push:{
               tasks:newTask._id
           }
           },
           {new:true})
      return  res.json({ok:true,redirect:'/logic/home'})
   }catch (err){
       console.log('error in adding new task:',err);
       return res.status(500).json({error:err})
   }
})
router.post('/CreateTeam', async (req, res) => {
    try {
        const {teamName} = req.body;
        const userid = req.user._id
        if (!req.user || !userid) {
            return res.status(401).json({ error: "Unauthorized: User not logged in" });
        }

const newteam = await Team.create({
    name: teamName,
    Admin: userid,
    members: [userid]
})
        await User.findByIdAndUpdate(userid, {$push:{
                Teams:newteam._id
            }},{
            new:true
        })
        return res.json({ok:true})
    }catch (err){
        console.log('error in creating new team:',err);
        return res.status(400).json({error:err})
    }
})
router.post('/SearchToAdd', async (req, res) => {
    try {
        const { searchbox } = req.body;
        if (!searchbox) {
            return res.status(400).json({ error: "Search field is required" });
        }
        console.log(searchbox);
        // Find user by email (case-insensitive search)
        const user = await User.findOne({ email: { $regex: `^${searchbox}$`, $options: "i" } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        console.log('testing:',user);
        return res.status(200).json({ ok: true, user });
    } catch (err) {
        console.error("Error searching user:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
router.get('/todopage/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id)
            .select('Teams Tasks')
            .populate('Teams', 'name')  // Populate team names
            .populate({
                path: 'Tasks',
                match: { AssignedTo: id }, // Get only tasks assigned to this user
                populate: { path: 'team', select: 'name' } // Populate team details
            });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Group tasks based on teams
        const teamTasksMap = {};
        user.Teams.forEach(team => (teamTasksMap[team._id] = { name: team.name, tasks: [] }));

        user.Tasks.forEach(task => {
            if (task.team && teamTasksMap[task.team._id]) {
                teamTasksMap[task.team._id].tasks.push(task);
            }
        });
        res.render('todo', { user, teamTasksMap , userid:id });
    } catch (error) {
        console.error("Error fetching TODO page:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
router.get('/guest', async (req, res) => {
    res.render('guest');
});

module.exports = router;