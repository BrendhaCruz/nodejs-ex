module.exports = function() {

	var express = require('express');
	var router  = express();
	var utils   = require('./utils');
	var mongo   = require('./mongo');
	var ObjectId = require('mongodb').ObjectID;

	router.post('/post', function(req, res) {
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		var follower = req.body.follower;
		var followed = req.body.followed;
		var date = req.body.date;
		doc = {
			"follower" : follower,
			"followed" : followed,
			"date" : date
		};
		mongo.follow.findOne({ "follower" : follower, "followed" : followed }, function(err, data) {
			if (err) {
				res.send(utils.getError(err))
			} else if (data) {
				res.send(utils.getError("Você já está seguindo essa pessoa."));
			} else {
				mongo.follow.insert(doc, function(err) {
					if (err) res.send(utils.getError(err));
					res.send(utils.getSuccess({ "id" : doc._id.toString() }));
				});
			}
		});
	});
	
	router.post('/delete', function(req, res) {
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		var id = req.body.id;
		mongo.follow.findOne({ "_id" : ObjectId(id) }, function(err, data) {
			if (err) {
				res.send(utils.getError(err));
			} else if (!data) {
				res.send(utils.getError("Seguida não encontrada."));
			} else {
				mongo.follow.remove({'_id' : ObjectId(id)}, function(err, result) {
					if (err) res.send(utils.getError(err));
					res.send(utils.getSuccess({}));
				});
			}
		});
		
	});
	
	router.get('/get', function(req, res) {
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		var id = req.query.id;
		mongo.follow.findOne({'_id' : ObjectId(id)}, function(err, data) {
			if (err) {
				res.send(utils.getError(err));
			} else {
				if (data) {
					res.send(utils.getSuccess(data));
				} else {
					res.send(utils.getError("Seguida não encontrada."));
				}
				
			}
		});
	}); 
	
	return router;
}();