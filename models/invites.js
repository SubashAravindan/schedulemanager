var mongoose=require("mongoose");

var inviteSchema = new mongoose.Schema({
	from:{
		type: mongoose.Schema.Types.ObjectId,
		ref:"User"
	},
	to:{
		type: mongoose.Schema.Types.ObjectId,
		ref:"User"
	},

	invitedEvent:{
		type: mongoose.Schema.Types.ObjectId,
		ref:"event"
	},
	status:0           //0 for waiting, 1 for accepted -1 for rejected
})

module.exports=mongoose.model("invite",inviteSchema)