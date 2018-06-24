var express  = require("express"),
	    app  = express(),
 bodyParser  = require("body-parser"),
 	 moment  = require("moment"),
   mongoose  = require("mongoose"),
   	  Event  = require("./models/event.js"),
methodOverride = require("method-override");

app.use(methodOverride("_method"));
mongoose.connect("mongodb://localhost/scheduler");
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");

app.get("/",(req,res)=>{
	res.render("calendar");
})

app.get("/events/new",(req,res)=>{
	res.render("new")
})

app.post("/events/new",(req,res)=>{
	Event.create({title:req.body.title,description:req.body.description,day:moment(req.body.day).format("DDDYYYY"),startTime:req.body.startTime,endTime:req.body.endTime},(err,event)=>{
		if (err) {
			console.log(err)
		} else {
			console.log(event);
			res.redirect("/")
		}
	})
})



app.delete("/events/:id",(req,res)=>{
	Event.findOneAndDelete({_id:req.params.id},(err,event)=>{
		if (err) {
			console.log(err)
		} else {
			console.log(event);
			res.redirect("/day/"+event.day);
		}
	})
})

app.put("/events/:id",(req,res)=>{
	Event.findOneAndUpdate({_id:req.params.id},{title:req.body.title,description:req.body.description,day:moment(req.body.day).format("DDDYYYY"),startTime:req.body.startTime,endTime:req.body.endTime},(err,event)=>{
		if (err) {
			console.log(err)
		} else {
			res.redirect("/day/"+event.day);
		}
	})
})

app.get("/events/:id/edit",(req,res)=>{
	Event.findById(req.params.id,(err,event)=>{
		if (err) {
			console.log(err)
		} else {
			res.render("edit",{event:event})
		}
	})
})

app.get("/day/:date",(req,res)=>{
	m=moment(req.params.date,"DDDYYYY");
	Event.find({day:req.params.date},(err,events)=>{
		if (err) {
			console.log(err);
		} else {
			events.sort((a,b)=>(a.startTime-b.startTime));
			res.render("timeline",{date:m,events:events});
		}
	})
	
})


app.listen(3000,()=>{
	console.log("server started");
})