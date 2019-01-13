var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  methodOverride = require("method-override"),
  mongoose = require("mongoose"),
  flash = require("connect-flash"),
  Accident = require("./models/accident"),
  Comment = require("./models/comment"),
  User = require("./models/user"),
  Reports = require('./models/reports'),
  seedDB = require("./seeds");

//Requiring Routes
var commentRoutes = require("./routes/comments"),
  accidentRoutes = require("./routes/accidents"),
  indexRoutes = require("./routes/index")

//seedDB(); //seed the databse
// mongodb://karan:karanyelpcamp30@ds227594.mlab.com:27594/karanyelpcamp
mongoose.connect("mongodb://localhost/life_line", {
  useNewUrlParser: true
});
//mongoose.connect("mongodb://karan:karanyelpcamp30@ds227594.mlab.com:27594/karanyelpcamp");
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(methodOverride("_method"));
app.use(flash());


// PASSPORT CONFIGURATION
app.use(require("express-session")({
  secret: "Once again rusty wins cutest dog",
  resave: false,
  saveUninitialized: false
}));
app.use(bodyParser.urlencoded({
  extended: true
}));
var port = process.env.PORT;

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use(indexRoutes);
app.use("/accidents", accidentRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};
var upload = multer({
  storage: storage,
  fileFilter: imageFilter
})

var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'dymh9n0ec',
  api_key: '893537448695967',
  api_secret: '7Ymdex-PRdRAhYb15sAz3lPI8CI'
});

//Here you are displaying the statistics of the accidents held at various places
app.get("/statistics", function (req, res) {
  res.render("stats");
});

app.get("/message", function (req, res) {
  res.render("message");
});

app.get("/location", function (req, res) {
  res.render("location");
});

app.post("/message", function (req, res) {
  res.render("messagesubmit");
});

app.get("/reports", function (req, res) {
  // Get all campgrounds from DB
  Reports.find({}, function (err, allReports) {
    if (err) {
      console.log(err);
    } else {
      res.render("report/index", {
        Reports: allReports
      });
    }
  });
});

//CREATE - add new campground to DB
app.post("/reports", upload.single('image'), function (req, res) {
  cloudinary.uploader.upload(req.file.path, function (result) {

    req.body.campground.image = result.secure_url;
    // add author to campground
    req.body.campground.author = {
      id: req.user._id,
      username: req.user.username
    }
    Reports.create(req.body.campground, function (err, report) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      res.redirect('/reports/' + report.id);
    });
  });
  // get data from form and add to campgrounds array
  // var location = req.body.location;
  // var image = req.body.image;
  // var desc = req.body.description;
  // var newReport = {
  //   location: location,
  //   image: image,
  //   description: desc
  // }
  // // Create a new campground and save to DB
  // Reports.create(newReport, function (err, newlyCreated) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     //redirect back to campgrounds page
  //     res.redirect("/reports");
  //   }
  // });
});

app.get("/reports/new", function (req, res) {
  res.render("report/new");
});

// SHOW - shows more info about one campground
app.get("/reports/:id", function (req, res) {
  //find the campground with provided ID
  Reports.findById(req.params.id).exec(function (err, reportPage) {
    if (err) {
      console.log(err);
    } else {
      console.log(reportPage)
      //render show template with that campground
      res.render("report/show", {
        report: reportPage
      });
    }
  });
});

app.listen(port || 3000, function () {
  console.log("Server has started!!!");
});