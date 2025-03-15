const express = require('express');
const router = express.Router();
const Todod = require('../models/Task_Todo')
router.get('/:id',async (req,res)=>{
   try{
       const {id} = req.params;
       const data = await Todod.findById(id).select('description  title  date  status createdAt')
       if(!data){
           return res.status(400).json({error: 'Todo not found'})
       }
       return res.json(data)
   }catch (err){
       console.log(err)
       return res.status(500).json({error:'Internal server error'})
   }
})
router.post('/addtodo/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        // Find and update the todo task OR create if it doesn’t exist
        const data = new Todod(
            { owner: id ,  // Find by owner ID
            title: title, description: description ,  // Update fields
             new: true, upsert: true } // Create if not found
        );
await data.save();
        res.status(200).json({ success: true, message: "Task updated", data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.put('/todoupdate/:id',async (req,res)=>{
   try{
       const { id } = req.params;
       const data = await Todod.findByIdAndUpdate(id,{status:'in progress'},{new:true})
       if(!data){
           return res.json({error:true , message:'Task not found'})
       }
       return res.status(200).json({ ok: true});
   }catch (err){
       console.log(err)
       return res.status(500).json({error:'Internal server error'})
   }
})
router.put('/todoend/:id',async (req,res)=>{
    try{
        const {id} = req.params;
        const data = await Todod.findByIdAndUpdate(id,{status:'completed'},{new:true})
        if(!data){
            return res.json({error:true , message:'Task not found'})
        }
        return res.status(200).json({ ok: true});
    }catch (err){
        console.log(err)
        return res.status(500).json({error:'Internal server error'})
    }
})
router.delete('/tododelete/:id',async (req,res)=>{
   try{
       const {id} = req.params;
       const data = await Todod.findByIdAndDelete(id)
       if(!data){
           return res.json({error:true , message:'Task not found'})
       }
       return res.status(200).json({ ok: true});
   }catch (err){
       console.log(err)
       return res.status(500).json({error:'Internal server error'})
   }
})

module.exports = router;