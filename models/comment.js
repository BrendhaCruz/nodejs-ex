module.exports = function() {
    
        var express = require('express');
        var router  = express();
        var utils   = require('./utils');
        var mongo   = require('./mongo');
        var ObjectId = require('mongodb').ObjectID;
    
        //create the comment
        router.post('/post', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var poetry   = req.body.poetry;
            var comment  = req.body.comment;
            var date     = req.body.date;
            var poster   = req.body.poster;	      
            var doc = {
                "poetry" : poetry,
                "comment" : comment,
                "date" :  date,
                "poster" : poster
            };
            mongo.comment.insert(doc, function(err) {
                if (err) res.send(utils.getError(err));
                res.send(utils.getSuccess(doc));
            });
        });
                
        // Get a comment by id 
        router.get('/get', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var id = req.query.id;
            mongo.comment.findOne({'_id' : ObjectId(id)}, function(err, data) {
                if (err) {
                    res.send(utils.getError(err));
                } else {
                    if (data) {
                        // Comment exists 
                        res.send(utils.getSuccess(data));
                    } else {
                        res.send(utils.getError("Comentário não encontrado."));
                    }
                }
            });
        });
    
        //remove the like
        router.post('/delete', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var id = req.body.id;
            mongo.comment.findOne({'_id' : ObjectId(id)}, function(err, data) {
                if (err) {
                    res.send(utils.getError(err));
                } else if (!data) {
                    res.send(utils.getError("Comentário não encontrado."));
                } else {
                    mongo.comment.remove({'_id' : ObjectId(id)}, function(err, result) {
                        if (err) res.send(utils.getError(err));
                        res.send(utils.getSuccess({}));
                    });
                }
            });
        });
            
        return router;
    }();