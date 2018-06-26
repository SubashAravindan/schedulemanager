var          mongoose = require("mongoose"),
passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
	username:String,
	password:String,
	events:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"event"
		}
	]
});

userSchema.plugin(passportLocalMongoose);
module.exports=mongoose.model("user",userSchema);
