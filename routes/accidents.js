var express = require("express");
var router = express.Router();
var Accident = require("../models/accident");
var middleware = require("../middleware");

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

//INDEX Route!!!!!
router.get("/", function (req, res) {
	//Get all accidents from the databse
	Accident.find({}, function (err, allAccidents) {
		if (err) {
			console.log(err);
		} else {
			res.render("accidents/index", {
				accidents: allAccidents,
				currentUser: req.user
			});
		}
	})

});

//Here you are adding a new dog to the database
//CREATE Route!!!!
router.post("/", middleware.isLoggedIn, upload.single('image'), function (req, res) {

	cloudinary.uploader.upload(req.file.path, function (result) {

		req.body.campground.image = result.secure_url;
		// add author to campground
		req.body.campground.author = {
			id: req.user._id,
			username: req.user.username
		}
		Accident.create(req.body.campground, function (err, accident) {
			if (err) {
				req.flash('error', err.message);
				return res.redirect('back');
			}
			res.redirect('/accidents/' + accident.id);
		});
	});


	//get data from form an add to accidents array
	// var name = req.body.name;
	// var image = req.body.image;
	// var desc = req.body.description;
	// var author = {
	// 	id: req.user._id,
	// 	username: req.user.username
	// }
	// var place = req.body.place;
	// var newAccident = {
	// 	name: name,
	// 	image: image,
	// 	description: desc,
	// 	author: author,
	// 	place: place
	// };
	// //Create a new Accident and save it to database
	// Accident.create(newAccident, function (err, newlycreated) {
	// 	if (err) {
	// 		console.log(err);
	// 	} else {
	// 		//redirect back to accidentss page
	// 		console.log(newlycreated);
	// 		res.redirect("/accidents");
	// 	}
	// })
});

//Here you are displaying a form to make a new route 
//NEW Route!!!!
router.get("/new", middleware.isLoggedIn, function (req, res) {
	res.render("accidents/new");
});

//Here we are showing more information about a particular accident 
// SHOW Route!!!!!!!
router.get("/:id", function (req, res) {
	//find the accident with the provided ID
	Accident.findById(req.params.id) /*.populate("comments")*/ .exec(function (err, foundAccident) {
		if (err) {
			console.log(err);
		} else {
			res.render("accidents/show", {
				accident: foundAccident
			});
		}
	});
	// //render show template with that campground
	//res.send("This will be the showpage one day!!!");
});

//EDIT ACCIDENT
router.get("/:id/edit", middleware.CheckAccidentOwnership, function (req, res) {
	Accident.findById(req.params.id, function (err, foundAccident) {
		res.render("accidents/edit", {
			campground: foundAccident
		});
	});
});
//UPDATE ACCIDENT
router.put("/:id", middleware.CheckAccidentOwnership, function (req, res) {
	//find and update the correct campground
	Accident.findByIdAndUpdate(req.params.id, req.body.accident, function (err, updatedAccident) {
		if (err) {
			res.redirect("/");
		} else {
			//redirect somewhere(show page)
			res.redirect("/accidents/" + req.params.id);
		}
	});
});

//DESTROY ACCIDENT ROUTE
router.delete("/:id", middleware.CheckAccidentOwnership, function (req, res) {
	Accident.findByIdAndRemove(req.params.id, function (err) {
		if (err) {
			res.redirect("/accidents");
		} else {
			res.redirect("/accidents");
		}
	});
});

module.exports = router;