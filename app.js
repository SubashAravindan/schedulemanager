var   express  = require("express"),
	      app  = express(),
   bodyParser  = require("body-parser"),
 	   moment  = require("moment"),
     mongoose  = require("mongoose"),
        Invite = require("./models/invites.js")
         User  = require("./models/user.js"),
   	    Event  = require("./models/event.js"),
methodOverride = require("method-override"),
      passport = require("passport"),
  randomString = require("randomstring"),
      text2png = require("text2png"),
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
			Invite.deleteMany({invitedEvent:req.params.id},(err,inv)=>{
				if (err) {
					console.log(err)
				} else {
					console.log(inv);
					res.redirect("/day/"+event.day);
				}
			})
			
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

//SHOW EVENTS ON DATE
app.get("/day/:date",isLoggedIn,(req,res)=>{
	m=moment(req.params.date,"DDDYYYY");
	User.findById(req.user.id).populate("events").exec(function(err,foundUser){
		if (err) {
			console.log(err);
		} else {
			eventList=[];
			if(foundUser.events.length){
				foundUser.events.forEach(ev=>{
					if (ev.day===req.params.date) {
						eventList.push(ev);
					}
				})	
			}

			eventList.sort((a,b)=>(a.startTime-b.startTime));
			res.render("timeline",{date:m,events:eventList});
		}
	})
	
})

//CREATE INVITE 

app.post("/invite",isLoggedIn,(req,res)=>{
	User.find({username:req.body.to},(err,toUser)=>{
		if (toUser.length) {
			console.log(toUser);
			Invite.create({from:req.user.id,to:toUser[0]._id,invitedEvent:req.body.id,status:0},(err,invite)=>{
				if (err) {
					console.log(err)
				} else {
					console.log(invite)
					res.send("1");
				}
			})
		}else{
			res.send("0")
		}
	})
})

//SHOW MEETING INVITES
app.get("/invites",isLoggedIn,(req,res)=>{
	Invite.find({to:req.user.id,status:0}).populate("invitedEvent").exec((err,invites)=>{
		if (err) {
			console.log(err)
		} else {
			res.render("invites",{invites:invites});
		}
	})

})

app.get("/invites/:id/:response",isLoggedIn,(req,res)=>{
	Invite.findById(req.params.id).populate("invitedEvent").exec(function(err,invite){
		if (req.params.response==1) {
			if (err) {
				console.log(err);
			} else {
				User.findByIdAndUpdate(req.user.id,{$push:{events:invite.invitedEvent}},(err,user)=>{
					if (err) {
						console.log(err)
					} else {
						invite.status=1;
						invite.save();
					}
				})
			}		
		} else {
			invite.status=-1;
			invite.save();
		}
	})
	res.redirect("/invites")
})

app.get("/invitesupdate",isLoggedIn,(req,res)=>{
	Invite.find({to:req.query.user,status:0}).populate("invitedEvent").exec((err,invites)=>{
		if (err) {
			console.log(err)
		} else {
			res.send(JSON.stringify(invites));
		}
	})
})
//===================================================================
//========================AUTH ROUTES================================
//===================================================================
app.get("/register",(req,res)=>{
	captchaString=randomString.generate(7);
	captchaSrc=text2png(captchaString,{bgColor:"grey",padding:20,textColor:"black",output:"dataURL"});
	res.render("register",{captchaSrc:captchaSrc});
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
	if (req.body.captcha!=captchaString) {
		return res.send("Your captcha was wrong !<a href = '/register'>Sign Up</a> again")
	}
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