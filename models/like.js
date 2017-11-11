module.exports = function() {
	
	var express = require('express');
	var router  = express();
	var utils   = require('./utils');
	var mongo   = require('./mongo');
	var ObjectId = require('mongodb').ObjectID;

	//create the like
	router.post('/post', function(req, res) {
		res.setHeader('Content-Type', 'application/json; charset=utf-8');	
		var poetry = req.body.poetry;
		var date   = req.body.date;
		var poster = req.body.poster;
		var doc = {
			"poetry" : poetry,
			"date" : date,
			"poster" : poster
		};
		mongo.like.findOne({"poetry" : poetry, "poster" : poster}, {"poetry" : 1, "poster" : 1}, function(err, data) {
			if (err) {
				res.send(utils.getError(err));
			} else {
				if (data) {
					res.send(utils.getError("Você já curtiu essa poesia."));
				} else {
					mongo.like.insert(doc, function(err) {
						if (err) res.send(utils.getError(err));
						res.send(utils.getSuccess(doc));
					});
				}
			}
		});
	});
		
	//remove the like
	router.post('/delete', function(req, res) {
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		var id = req.body.id;
		mongo.like.findOne({ '_id' : ObjectId(id)}, function(err, data) {
			if (err) {
				res.send(utils.getError(err));
			} else if (!data) {
				res.send(utils.getError("Curtida não encontrada."));
			} else {
				mongo.like.remove({'_id' : ObjectId(id)}, function(err, result) {
					if (err) res.send(utils.getError(err));
					res.send(utils.getSuccess({}));
				});
			}
		});
		
	});
		
	// Get a like by id 
	router.get('/get', function(req, res) {
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		var id = req.query.id;
		mongo.like.findOne({'_id': ObjectId(id)}, function(err, like) {
			if (err) {
				res.send(utils.getError(err));
			} else {
				if (like) {
					res.send(utils.getSuccess(like));
				} else {
					res.send(utils.getError("Curtida não encontrada."));
				}
			}
		});
	});

	return router;
}();