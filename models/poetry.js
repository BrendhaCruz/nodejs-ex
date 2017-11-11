module.exports = function() {
    
        var express = require('express');
        var router  = express();
        var utils   = require('./utils');
        var mongo   = require('./mongo');
        var ObjectId = require('mongodb').ObjectID;
    
        //create the poetry
        router.post('/post', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var poster = req.body.poster;
            var author = req.body.author;
            var poetry = req.body.poetry;
            var title  = req.body.title;
            var date   = req.body.date;
            var tags   = req.body.tags;	
            var obj = {
                "poster" : poster,
                "author" : author,
                "poetry" : poetry,
                "title" : title,
                "date" :  date,
                "tags" : tags
            };
            mongo.poetry.insert(obj, function(err) {
                if (err) {
                    res.send(utils.getError(err));
                } else {
                    res.send(utils.getSuccess(obj));
                }
            });
        });
                
        // Get a poetry by id 
        router.get('/get', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var id = req.query.id;
            mongo.poetry.findOne({'_id': ObjectId(id)}, function(err, poetry) {
                if (err) {
                    res.send(utils.getError(err));
                } else {
                    if (poetry) {
                        // Poetry exists 
                        mongo.like.find({"poetry" : poetry._id.toString()}).toArray(function(err, data) {
                            if (err) res.send(utils.getError(err));
                            poetry["liked"] = utils.count(data);
                            mongo.comment.find({ "poetry" : poetry._id.toString()}).toArray(function(err, data) {
                                if (err) res.send(utils.getError(err));
                                poetry["commented"] = utils.count(data);
                                mongo.comment.find({ "poetry" : poetry._id.toString()}, { "_id" : 1, "date" : 1}).sort({"date" : -1}).limit(999).toArray(function(err, data) {
                                    if (err) res.send(utils.getError(err));
                                    poetry["comments"] = utils.toArray(data);
                                    mongo.like.find({ "poetry" : poetry._id.toString()}, { "_id" : 1, "date" : 1}).sort({"date" : -1}).limit(999).toArray(function(err, data) {
                                        if (err) res.send(utils.getError(err));
                                        poetry["likes"] = utils.toArray(data);
                                        res.send(utils.getSuccess(poetry));
                                    });
                                });
                            });
                        });
                    } else {
                        res.send(utils.getError("Poesia não encontrada."));
                    }
                }
            });
        });
    
        // Search for a poetry 
        router.get('/search', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var author = req.query.author;
            var title  = req.query.title;
            var tag    = req.query.tag;
            var part   = req.query.part;
            var query = {};
            if (author) {
                query['author'] = new RegExp('.*' + author.toLowerCase() + '.*', 'i');
            }
            if (title) {
                query['title'] = new RegExp('.*' + title.toLowerCase() + '.*', 'i'); 
            }
            if (tag) {
                query['tags'] = new RegExp('.*' + tag.toLowerCase() + '.*', 'i'); 
            }
            if (part) {
                query['poetry'] = new RegExp('.*' + part.toLowerCase() + '.*', 'i'); 
            }
            mongo.poetry.find(query).limit(99).toArray(function(err, data) {
                if (err) {
                    res.send(utils.getError(err));
                } else {
                    res.send(utils.getSuccess({ "poetries" : utils.toArray(data) }));
                }
            });
        });
    
        router.get('/update', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var id = req.query.id;
            var doc = {};
            mongo.like.find({"poetry" : id}).toArray(function(err, data) {
                if (err) res.send(utils.getError(err));
                doc["liked"] = utils.count(data);
                mongo.comment.find({"poetry" : id}).toArray(function(err, data) {
                    if (err) res.send(utils.getError(err));
                    doc["commented"] = data.length;
                    mongo.like.find({'poetry' : id}, { "_id" : 1, "date" : 1}).sort({"date" : -1}).limit(999).toArray(function(err, data) {
                        if (err) res.send(utils.getError(err));
                        doc["likes"] = utils.toArray(data);
                        mongo.comment.find({'poetry' : id}, { "_id" : 1, "date" : 1}).sort({"date" : -1}).limit(999).toArray(function(err, data) {
                            if (err) res.send(utils.getError(err));
                            doc["comments"] = utils.toArray(data);
                            res.send(utils.getSuccess(doc));
                        });
                    });
                });
            });
        });
        
        // Edit poetry 
        router.post('/put', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var id		= req.body.id;
            var title	= req.body.title;
            var author	= req.body.author;
            var tags	= req.body.tags;
            var poetry	= req.body.poetry;
            var data = {
                "title" : title,
                "author" : author,
                "tags" : tags,
                "poetry" : poetry
            };
            mongo.poetry.findAndModify({ "_id" : ObjectId(id) }, {}, {$set: data}, {}, function(err, object) {
                if (err) {
                    res.send(utils.getError(err));
                } else {
                    res.send(utils.getSuccess({}));
                }
            });
        });
        
        //remove the poetry
        router.post('/delete', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var id = req.body.id;
            mongo.like.remove({'poetry' : id}, function(err, result) {
                if (err) {
                    res.send(utils.getError(err));
                } else {
                    mongo.comment.remove({'poetry' : id}, function(err, result) {
                        if (err) {
                            res.send(utils.getError(err));
                        } else {
                            mongo.notif.remove({'poesia' : id}, function(err, result) {
                                if (err) {
                                    res.send(utils.getError(err));
                                } else {
                                    mongo.poetry.remove({'_id' : ObjectId(id)}, function(err, result) {
                                        if (err) {
                                            res.send(utils.getError(err));
                                        } else {
                                            res.send(utils.getSuccess({}));
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
        
        router.get('/most_liked', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            mongo.like.aggregate([{$group: {_id: "$poetry", total: {$sum: 1}}}, {$sort: {"total": -1}}, {$limit: 10}], function(err, data) {
                if (err) res.send(utils.getError(err));
                var total = data.length;
                var count = 0;
                var docs = [];
                data.forEach(function(doc2) {
                    mongo.poetry.findOne({"_id" : ObjectId(doc2._id)}, {"_id" : 1, "date" : 1}, function(err, doc) {
                        if (err) res.send(utils.getError(err));
                        if (doc) docs.push({"id" : doc._id.toString(), "date" : doc.date, "total" : doc2.total});
                        count++;
                        if (count == total) {
                            res.send(utils.getSuccess({"poetries" : docs}));
                        }
                    });
                });
            });
        })
        
        router.get('/most_commented', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            mongo.comment.aggregate([{$group: {_id: "$poetry", total: {$sum: 1}}}, {$sort: {"total": -1}}, {$limit: 10}], function(err, data) {
                if (err) res.send(utils.getError(err));
                var total = data.length;
                var count = 0;
                var docs = [];
                data.forEach(function(doc2) {
                    mongo.poetry.findOne({"_id" : ObjectId(doc2._id)}, {"_id" : 1, "date" : 1}, function(err, doc) {
                        if (err) res.send(utils.getError(err));
                        if (doc) docs.push({"id" : doc._id.toString(), "date" : doc.date, "total" : doc2.total});
                        count++;
                        if (count == total) {
                            res.send(utils.getSuccess({"poetries" : docs}));
                        }
                    });
                });
            });
        })
        
        router.get('/most_recent', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            mongo.poetry.find({}).sort({"date" : -1}).limit(10).toArray(function(err, data) {
                if (err) res.send(utils.getError(err));
                var doc = {};
                doc["poetries"] = utils.toArray(data);
                res.send(utils.getSuccess(doc));
            });
        })
        
        return router;
    }();