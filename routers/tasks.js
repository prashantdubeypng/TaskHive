const express = require('express');
require('dotenv').config()
const router = express.Router();
const Tasks = require('../models/Task')
const User = require('../models/user')
const Team = require('../models/Team')
const res = require("express/lib/response");
const nodemailer = require("nodemailer");
const email = process.env.email;
const password = process.env.password;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'prashant2107pd@gmail.com',
        pass: 'qxwomdutjnssfeqn'  // Use environment variables in production
    }
});
router.post('/assigned',async (req,res)=>{
   try{
       const {teamid , title, description , member} = req.body;
       if (!teamid || !title || !description || !member) {
           return res.status(400).json({ error: "All fields are required" });
       }
       const memberdata = await User.findById(member)
       if(!memberdata){
           return res.json({error: "No user found"})
       }
       const team = await Team.findById(teamid).populate('Admin');
       await transporter.sendMail({
           from: '"TaskHive" <TaskHive.Support@gmail.com>',
           to: memberdata.email,
           subject:`New Task Assigned: ${title}` ,
           html: `<p>Hello,${memberdata.full_name}</p>
       <p>You have been assigned a new task: <strong>${title}</strong> by <strong>${team.Admin.full_name}</strong> from <strong>${team.name}</strong>.</p>
      <br>
       <p>Best regards,<br>TaskHive Team</p>
   `});
       const createtasks = await Tasks.create({AssignedTo:member,
           title:title,
           description:description,
           team:teamid})
       if(!createtasks){
           return res.status(404).send('Not Found');
       }
       await Team.findByIdAndUpdate(teamid,{$push:{tasks:createtasks._id}})
       return res.json({ok: true})
   }catch (e) {
       return res.json({error:true})
       console.log(e);
   }
})
router.put('/:id/status',async (req,res)=>{
    const {id} = req.params;
   const userid = req.user
    console.log(userid._id)
    console.log(id)
    try{
       const data = await Tasks.findOne({_id:id});
       console.log(data.AssignedTo.toString())
       if(!data){
           return res.status(404).send('Not Found');
       }
       if(data.AssignedTo.toString() !== userid._id){
           return res.send('autorization failed');
       }
       data.status='in progress';
       data.started = Date.now();
       await data.save();
        return res.json({ok: true})
    }catch (e) {
       console.log('error updating task');
       return res.json({error:true})
    }
})
router.put('/:id/end', async (req, res) => {
    const { id } = req.params;
    const userid = req.user;

    try {
        // Fetch task and populate admin details
        const data = await Tasks.findOne({ _id: id }).populate({
            path: 'team',
            populate: {
                path: 'Admin'
            }
        });
        console.log(data.team.Admin.email)

        if (!data) {
            return res.status(404).send('Not Found');
        }
        if (data.AssignedTo.toString() !== userid._id) {
            return res.status(403).send('Authorization failed');
        }
        data.status = 'completed';
        data.end = Date.now();
        await data.save();
        res.json({ ok: true });

        setImmediate(async () => {
            try {
                const duration = data.end - data.started;
                const durationSec = Math.floor(duration / 1000);
                const durationMin = Math.floor(durationSec / 60);
                const durationHours = Math.floor(durationMin / 60);
                const durationDays = Math.floor(durationHours / 24);

                let durationText = "";
                if (durationDays > 0) durationText += `${durationDays} day${durationDays > 1 ? 's' : ''}, `;
                if (durationHours % 24 > 0) durationText += `${durationHours % 24} hr${durationHours % 24 > 1 ? 's' : ''}, `;
                if (durationMin % 60 > 0) durationText += `${durationMin % 60} min${durationMin % 60 > 1 ? 's' : ''}, `;
                if (durationSec % 60 > 0) durationText += `${durationSec % 60} sec`;
                durationText = durationText.replace(/,\s*$/, '');

                if (data.team && data.team.Admin && data.team.Admin.email) {
                    await transporter.sendMail({
                        from: '"TaskHive" <TaskHive.Support@gmail.com>',
                        to: data.team.Admin.email,
                        subject: 'Task Completed Notification',
                        text: `The task "${data.title}" has been completed by the assigned user.

Task Details:
- Task Name: ${data.title}
- Description: ${data.description}
- Status: Completed ✅
- Duration Taken: ${durationText}

Best Regards, 
TaskHive`
                    });
                }
            } catch (error) {
                console.error('Error sending email:', error);
            }
        });

    } catch (e) {
        console.error('Error updating task in end:', e);
        return res.status(500).json({ error: 'Internal Server Error' }); // Ensure response is always sent
    }
});

module.exports = router;