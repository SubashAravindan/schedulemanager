var mongoose=require("mongoose");

var inviteSchema = new mongoose.Schema({
	from:{
		type: mongoose.Schema.Types.ObjectId,
		ref:"User"
	}
	to:{
		type: mongoose.Schema.Types.ObjectId,
		ref:"User"
	}

	invitedEvent:{
		type: mongoose.Schema.Types.ObjectId,
		ref:"Event"
	}
})