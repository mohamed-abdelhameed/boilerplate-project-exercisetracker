const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended:false}));

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true },
  exercises: [{ type : mongoose.Schema.Types.ObjectId, ref : 'Exercise' }]
});

const User = mongoose.model('User', userSchema);

const exerciseSchema = new Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

app.post('/api/exercise/new-user',(req,res)=>{
  let user = new User({username:req.body.username});
  user.save((err, data)=>{
      res.json({username:data.username,_id:data._id});
  });
});

app.get('/api/exercise/users',(req,res)=>{
  let user = new User({username:req.body.username});
  User.find((err, data)=>{
      res.json(data.map((u)=>{return {username:u.username,_id:u._id}}));
  });
});

app.post('/api/exercise/add',(req,res)=>{
  let tmp=req.body.date?new Date(req.body.date):new Date();
  let exercise = new Exercise({user:req.body.userId,          description:req.body.description,duration:req.body.duration,date:tmp});
  exercise.save((err, data)=>{
    User.findByIdAndUpdate(
      req.body.userId,
      { $push: { exercises: exercise._id } },
      { new: true, useFindAndModify: false }
    ,(err, user)=>{
      res.json({_id:user._id,username:user.username,date:exercise.date.toDateString(),duration:exercise.duration,description:exercise.description});
    });
  });
});

app.get('/api/exercise/log',(req,res)=>{
  User.findById(req.query.userId).populate('exercises').exec((err, user)=>{
      let logs=user.exercises.map((e)=>{return {description:e.description,duration:e.duration,date:e.date}});
      if (req.query.from) {
        logs=logs.filter((l)=>l.date>=new Date(req.query.from));
      }
      if (req.query.to) {
        logs=logs.filter((l)=>l.date<=new Date(req.query.to));
      }
      if (req.query.limit) {
        logs=logs.slice(0,req.query.limit);
      }
      let result={_id:user._id,username:user.username,count:logs.length,log:logs};
      res.json(result);
  });
});

/*.populate('exercises').exec((err, user)=>{
      res.json(user);
    });*/

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
