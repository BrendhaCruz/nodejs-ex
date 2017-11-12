module.exports = function() {

	var express = require('express');
	var router  = express();
	var utils   = require('./utils');
	var mongo   = require('./mongo');
	var ObjectId = require('mongodb').ObjectID;

	router.post('/post', function(req, res) {
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		var poster = req.body.poster;
		var poetry = req.body.poetry;
		var date   = req.body.date;
		doc = {
			"poster" : poster,
			"poetry" : poetry,
			"date"   : date
		};
		mongo.share.findOne({ "poster" : poster, "poetry" : poetry }, function(err, data) {
			if (err) res.send(utils.getError(err));
			if (data) {
				res.send(utils.getError("Você já compartilhou essa poesia."));
			} else {
				mongo.share.insert(doc, function(err) {
					if (err) {
						res.send(utils.getError(err));
					} else {
						res.send(utils.getSuccess({ "id" : doc._id.toString() }));
					}
				});
			}
		});
	});
	
	router.post('/delete', function(req, res) {
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		var id = req.body.id;
		mongo.share.remove({'_id' : ObjectId(id)}, function(err, result) {
			if (err) {
				res.send(utils.getError(err));
			} else {
				res.send(utils.getSuccess({}));
			}
		});
	});
	
	router.get('/get', function(req, res) {
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		var id = req.query.id;
		mongo.share.findOne({'_id' : ObjectId(id)}, function(err, data) {
			if (err) {
				res.send(utils.getError(err));
			} else {
				if (data) {
					res.send(utils.getSuccess(data));
				} else {
					res.send(utils.getError("Compartilhamento não encontrado."));
				}
				
			}
		});
	}); 
	
	return router;
}();