const express = require('express');
const router = express.Router();
const User = require('../models/user')
require('dotenv').config();
const nodemailer = require('nodemailer');
const genrateotp = require('../services/otpgenrater')
const {setUser} = require('../services/auth')
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'prashant2107pd@gmail.com',
        pass: 'qxwomdutjnssfeqn' // Use environment variables in production
    }
});
router.get('/',async (req,res)=>{
    res.render('login')
})
router.post('/login',async (req,res)=>{
    const {email, password} = req.body;
    console.log(email , password);
    if(!email || !password){
        return res.status(400).json({error: 'email or password'})
    }
    const user = await User.findOne({email})
    if(!user){
        return res.status(400).send('User not found');
    }
    try {
        const token = await User.matchPasswordAndGenerateToken(email, password);
        res.cookie('token', token, { httpOnly: true });
        res.json({ success: true, redirect: '/logic/home' });
    } catch (e) {
        console.log(e.message);
        return res.redirect('/user/');
    }
})
router.get('/res',async (req,res)=>{
    res.render('register')
})
router.post('/reg',async (req,res)=>{
   try{
       const {username, email, password} = req.body;
       if(!username || !email || !password){
           return res.status(400).json('Please enter a valid username & password');
       }
       const user = await User.findOne({email})
       if(user){
           return res.status(400).json('User already exists');
       }
       const otp =  await genrateotp();
       const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
       const newUser = new User({
           full_name: username,
           email: email,
           password: password,
           otp:otp,
           otpexpiry:otpExpires,
       });
       await newUser.save();
       await transporter.sendMail({
           from: '"TaskHive" <your-email@gmail.com>',
           to: email,
           subject: 'Verify Your Email - TaskHive',
           html: `<p>Your OTP for verification is <b>${otp}</b>. It is valid for 10 minutes.</p>`
       });
       res.json({ ok:true});
   }
   catch(err){
       console.log(err);
       return res.status(400).send(err)
   }
})
router.post('/verify',async (req,res)=>{
   try{
       const {email,otp} = req.body;
       const data = await User.findOne({email})
       if(!data){
           return res.status(400).json({error: 'User not found'});
       }
       const genotp = data.otp;
       if(!genotp){
           return res.status(500).json({error: 'Something went wrong'});
       }
       if(data.otpexpiry<Date.now()){
           return res.json({error:'Otp expired'});
       }
       if (Number(genotp) !== Number(otp)) {
           return res.status(400).json({ error: 'Invalid OTP' });
       }
       data.otp = undefined;
       data.otpexpiry = undefined;
       await data.save();
       const token = await setUser(data);
       res.cookie('token', token, { httpOnly: true});
       await transporter.sendMail({
           from: '"TaskHive" <support.TaskHive>',
           to: data.email,
           subject: 'Welcome to TaskHive',
           html: `<p>Dear ${data.full_name}, welcome to TaskHive!</p>`
       });
       console.log('Verification successful, sending response to frontend');
      return  res.json({ ok:true,redirect: '/logic/home'});
   }catch (e) {
       console.log('error in verification section'+e.message);
       return res.json('internal server error');
   }
})
module.exports = router;