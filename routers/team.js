const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Task = require('../models/Task');
const User = require('../models/user');
const req = require("express/lib/request");
const mongoose = require("mongoose");
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.redirect('/user/');
        }
        const check = await Team.findOne({ members: req.user._id });
        if (!check) {
            return res.status(403).json({ error: 'Access Denied: You are not part of this team' });
        }
        const teamdata = await Team.findById(id)
            .select('name Admin members tasks _id')
            .populate('Admin', 'full_name _id')
            .populate('members', 'full_name _id')
            .populate('tasks', 'title description  status _id');
        if (!teamdata) {
            return res.status(404).json({ error: 'Team not found' });
        }
        res.render('team', { teamdata , TeamName: teamdata.name,id:teamdata._id});
    } catch (err) {
        console.error('Error fetching team details:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:teamid/:userid', async (req, res) => {
    try{
        const { teamid, userid } = req.params;
        if (!req.user) {
            return res.redirect('/user/');
        }
        const team = await Team.findById(teamid).populate('Admin','_id')
        if (team.Admin._id.toString()!==req.user._id.toString()&&(req.user._id.toString()!==userid)){
            return res.status(403).json({error:'Access Denied'})
        }
        const Tasks = await Task.find({AssignedTo:userid,team:teamid})
res.render('taskassined',{Tasks:Tasks,userid:userid})
    }catch (e) {
        console.log(e)
    }
})
router.get('/assigntask/:id', async (req, res) => {
    try {
        const {id} = req.params.id;
        const user = await User.findById(id,).select('Teams',{
            $match:{Admin:id}
        })
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('assigntask', {
            teams: user.Teams || [], // Ensure teams is always an array
            user: req.user // Pass current user if needed
        });

    } catch (e) {
        console.error(e);
        res.status(500).send('Server Error');
    }
});
router.get('members/:id', async (req, res) => {
   try{
       const {id} = req.params.id;
       const memebers = await Team.find(id).select('members Admin').populate('Admin', 'full_name _id').populate('members', 'full_name _id');
       if (!memebers) {
           return res.status(403).json({error: 'something went wrong'})
       }
       return res.status(200).json({memebers})
   }catch (e) {
       console.log(e)
   }
})
router.post('/addmember/team', async (req, res) => {
    const { id } = req.body;
    return res.render('addmember',{id});
});
router.delete('/delete/:id',async (req, res) => {
    try{
        const { id } = req.params;
        const userid = req.user;
        // const data = await Team.findByIdAndDelete(id)
        const data = await Team.findOneAndDelete({_id: id , Admin:userid} )
        if(!data){
            return res.json({error:true , message:'Team not found || Unauthorized'})
        }
        return res.json({ok:true})
    }catch (error){
        console.error(error)
        return res.status(500).send('Server Error');
    }
})
router.delete('/removemember/:teamid/:memberid',async (req, res) => {
   try{
       const {teamid , memberid} = req.params;
       const teamid1 = new mongoose.Types.ObjectId(teamid);
       const memberid1 = new mongoose.Types.ObjectId(memberid);
       const userid = req.user;
       console.log("###",teamid1)
       const check = await Team.find(teamid1);
       console.log("check",check)
       let _Team;
       _Team= check[0]
       if(userid._id !== _Team.Admin._id.toString()){
           return res.json({error:true , message:'Unauthorized'})
       }
       const data = await Team.findOneAndUpdate({_id:teamid1},{$pull:{members:memberid1}},{new:true})
       if(!data){
           return res.json({error:'Team not found || Unauthorized'})
       }
       return res.json({ok:true})
   }catch (error){
       console.error(error)
       return res.status(500).send('Server Error');
   }
})
module.exports = router;
