const express = require('express');

const app = express();

app.get('/health',(req,res)=>{
    res.send("Server is running");
})

app.listen(8080,() =>{
    console.log("Server is running on port 8080");
})


