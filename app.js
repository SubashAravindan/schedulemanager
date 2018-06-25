var   express  = require("express"),
	      app  = express(),
   bodyParser  = require("body-parser"),
 	   moment  = require("moment"),
     mongoose  = require("mongoose"),
         User  = require("./models/user.js"),
   	    Event  = require("./models/event.js"),
methodOverride = require("method-override"),
      passport = require("passport"),
 LocalStrategy = require("passport-local");


app.use(methodOverride("_method"));
mongoose.connect("mongodb://localhost/scheduler");
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");

//==========================PASSPORT CONFIG===============

app.use(require("express-session")({
	secret:"sshhh this a secret",
	resave:false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.currentUser=req.user;
	next();
})

//HOME ROUTE
app.get("/",isLoggedIn,(req,res)=>{
	res.render("calendar");
})


//NEW EVENT ROUTE
app.get("/events/new",isLoggedIn,(req,res)=>{
	res.render("new")
})

//CREATE EVENT ROUTE
app.post("/events/new",isLoggedIn,(req,res)=>{
	Event.create({title:req.body.title,description:req.body.description,day:moment(req.body.day).format("DDDYYYY"),startTime:req.body.startTime,endTime:req.body.endTime},(err,event)=>{
		if (err) {
			console.log(err)
		} else {
			User.findByIdAndUpdate(req.user.id,{$push:{events:event}},{'new':true},(err,result)=>{
				if (err) {
					console.log(err)
				} else {
					console.log(result);
					res.redirect("/day/"+event.day);
				}
			})
		}
	})
})

//DELETE EVENT ROUTE

app.delete("/events/:id",isLoggedIn,isAuthorised,(req,res)=>{
	Event.findOneAndDelete({_id:req.params.id},(err,event)=>{
		if (err) {
			console.log(err)
		} else {
			console.log(event);
			res.redirect("/day/"+event.day);
		}
	})
})

//UPDATE EVENT ROUTE
app.put("/events/:id",isLoggedIn,isAuthorised,(req,res)=>{
	Event.findOneAndUpdate({_id:req.params.id},{title:req.body.title,description:req.body.description,day:moment(req.body.day).format("DDDYYYY"),startTime:req.body.startTime,endTime:req.body.endTime},(err,event)=>{
		if (err) {
			console.log(err)
		} else {
			res.redirect("/day/"+event.day);
		}
	})
})

//EDIT UPDATE ROUTE
app.get("/events/:id/edit",isLoggedIn,isAuthorised,(req,res)=>{
	Event.findById(req.params.id,(err,event)=>{
		if (err) {
			console.log(err)
		} else {
			res.render("edit",{event:event})
		}
	})
})

//SHOW DATE
app.get("/day/:date",isLoggedIn,(req,res)=>{
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


//===================================================================
//========================AUTH ROUTES================================
//===================================================================
app.get("/register",(req,res)=>{
	res.render("register");
})

app.get("/usernameCheck",(req,res)=>{
	User.find({username:req.query.input},(err,result)=>{
		if (err) {
			console.log(err)
		} else {
			if (result.length) {
				res.send("1");
			} else {
				res.send("0");
			}
		}
	})
})

app.post("/register",(req,res)=>{
	User.register(new User({username:req.body.username}),req.body.password,function(err,user){
		if (err) {
			console.log(err)
			return res.render("register")
		} else {
			passport.authenticate("local")(req,res,()=>{
				res.redirect("/")
			})
		}
	})
})

app.get("/login",(req,res)=>{
	res.render("login");
})

app.post("/login",passport.authenticate("local",
	{
		successRedirect:"/",
		failureRedirect:"/login"
	}),(req,res)=>{}
);

app.get("/logout",(req,res)=>{
	req.logout();
	res.redirect("/");
})

function isLoggedIn(req,res,next){
	if (req.isAuthenticated()) {
		return next()
	}
	res.redirect("/login");
}

function isAuthorised(req,res,next){
	User.findById(req.user.id,(err,user)=>{
		if(user.events.indexOf(req.params.id)==-1){
			res.send("You dont have acces to this event");
		}
		else{
			return next();
		}
	})
}

app.listen(3000,()=>{
	console.log("server started");
})