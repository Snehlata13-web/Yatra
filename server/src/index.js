const dotenv = require('dotenv');
dotenv.config();
const supabase = require('./config/supabase');
const userRoutes = require('./routes/userRoutes');
const wardenRoutes = require('./routes/wardenRoutes');
const adminRoutes = require('./routes/adminRoutes');
const guardRoutes = require('./routes/guardRoutes');
const express = require('express');

const app = express();
app.use(express.json());

app.get('/health',(req,res)=>{
    res.send("Server is running");
})

app.use('/user', userRoutes);
app.use('/warden', wardenRoutes);
app.use('/admin', adminRoutes);
app.use('/guard', guardRoutes);
app.listen(3000,() =>{
    console.log("Server is running on port 3000");
})
