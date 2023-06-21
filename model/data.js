const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://mariyanixon:mariyanixon@cluster0.fcvdevs.mongodb.net/")
.then(()=>{
    console.log("ee");
})
.catch(err=>console.log(err));
let Schema = mongoose.Schema;
const studentSchema = new Schema({
    sname:String,
    sgrade:Number
})
var studentModel = mongoose.model("students",studentSchema);
module.exports = studentModel