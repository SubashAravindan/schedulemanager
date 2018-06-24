var mongoose=require("mongoose");

mongoose.connect("mongodb://localhost/scheduler");

var eventSchema= new mongoose.Schema({
	title:String,
	description :String,
	day:String,
	startTime:String,
	endTime: String
}) 

module.exports=mongoose.model("event",eventSchema)