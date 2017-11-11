module.exports = function() {
    
        var express = require('express');
        var router  = express();
        var utils   = require('./utils');
        var mongo   = require('./mongo');
        var ObjectId = require('mongodb').ObjectID;
     
        // Create a new user
        router.post('/post', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var email    = req.body.email;
            var date	 = req.body.date;
            var password = req.body.password;
            var name     = req.body.name;
            // Find user with same email
            mongo.user.findOne({ "email" : email }, function(err, data) {
                if (err) {
                    res.send(utils.getError(err));
                } else {
                    if (data) { 
                        res.send(utils.getError("Usuário já cadastrado."));
                    } else {
                        // OK. There's no user with given username
                        var doc = {
                            "email"    : email,
                            "date"	   : date, 
                            "password" : password,
                            "name"     : name,
                            "enable_notifications" : true
                        };
                        mongo.user.insert(doc, function(err) {
                            if (err) {
                                res.send(utils.getError(err));
                            } else {
                                res.send(utils.getSuccess({ "id" : doc.email }));
                            }
                        });
                    }
                }
            });
        });
    
        // Users
        // Authenticate in the application
        router.get('/get', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var email    = req.query.email;
            var password = req.query.password;
            var regid    = req.query.regid;
            // Find user matching username and password
            var data;
            if (password) {
                data = { "email" : email, "password" : password };
            } else {
                data = { "email" : email }; 
            }
            mongo.user.findOne(data, function(err, doc) {
                if (err) {
                    res.send(utils.getError(err));
                } else {
                    if (doc) {
                        // Sucessfull
                        doc["followed"] = mongo.follow.find({'followed': email}).toArray(function(err, data) {
                            if (err) res.send(utils.getError(err));
                            doc["followed"] = utils.count(data);;
                            mongo.poetry.find({ "poster" : email}, { "_id" : 1, "date" : 1}).toArray(function(err, data) {
                                if (err) res.send(utils.getError(err));
                                doc["poetries"] = utils.toArray(data);
                                mongo.like.find({ "poster" : email}, { "_id" : 1, "date" : 1}).toArray(function(err, data) {
                                    if (err) res.send(utils.getError(err));
                                    doc["likes"] = utils.toArray(data);
                                    mongo.notif.find({ "enderecado" : email}, { "_id" : 1, "date" : 1}).sort({"date" : -1}).limit(100).toArray(function(err, data) {
                                        if (err) res.send(utils.getError(err));
                                        doc["notifications"] = utils.toArray(data);
                                        mongo.follow.find({ "follower" : email}, { "_id" : 1, "date" : 1}).sort({"date" : -1}).limit(1000).toArray(function(err, data) {
                                            if (err) res.send(utils.getError(err));
                                            doc["followeds"] = utils.toArray(data);
                                            mongo.follow.find({ "followed" : email}, { "_id" : 1, "date" : 1}).sort({"date" : -1}).limit(1000).toArray(function(err, data) {
                                                if (err) res.send(utils.getError(err));
                                                doc["followers"] = utils.toArray(data);
                                                mongo.share.find({ "poster" : email}, { "_id" : 1, "date" : 1}).toArray(function(err, data) {
                                                    if (err) res.send(utils.getError(err));
                                                    doc["shares"] = utils.toArray(data);
                                                    if (regid && password) {
                                                        mongo.regid.update({'regid' : regid }, { $set: { 'user' : email } }, { upsert: true }, function(err) {
                                                            if (err) {
                                                                res.send(utils.getError(err));
                                                            } else {
                                                                res.send(utils.getSuccess(doc));
                                                            }
                                                        });
                                                    } else {
                                                        res.send(utils.getSuccess(doc));
                                                    }
                                                });
                                            });
                                        }); 
                                    });
                                });
                            });
                        });
                    } else {
                        res.send(utils.getError("Usuário ou senha inválidos."));
                    }
                }
            });
        });
    
        // Edit bio 
        router.post('/put', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var name     = req.body.name;
            var email    = req.body.email;
            var password = req.body.password;
            var bio      = req.body.bio;
            var data = {
                "bio" : bio,
                "name" : name
            };
            if (password) {
                data["password"] = password;
            }
            mongo.user.findAndModify({ "email" : email }, {}, {$set: data}, {}, function(err, object) {
                if (err) {
                    res.send(utils.getError(err));
                } else {
                    res.send(utils.getSuccess({}));
                }
            });
        });
    
        // Edit photo 
        router.post('/photo_upload', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var email = req.body.email;
            var photo = req.body.photo;
            mongo.user.findAndModify({ "email" : email }, {}, {$set: {'photo': photo}}, {}, function(err, object) {
                if (err) {
                    res.send(utils.getError(err));
                } else {
                    res.send(utils.getSuccess({}));
                }
            });
        });
    
        // Get updated info from the user 
        router.get('/update', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var email = req.query.email;
            var doc = {};
            mongo.follow.find({'followed': email}).toArray(function(err, data) {
                if (err) res.send(utils.getError(err));
                doc["followed"] = utils.count(data);;
                mongo.poetry.find({'poster' : email}, { "_id" : 1, "date" : 1}).toArray(function(err, data) {
                    if (err) res.send(utils.getError(err));
                    doc["poetries"] = utils.toArray(data);
                    mongo.like.find({'poster' : email}, { "_id" : 1, "date" : 1}).toArray(function(err, data) {
                        if (err) res.send(utils.getError(err));
                        doc["likes"] = utils.toArray(data);
                        mongo.follow.find({'follower' : email}, { "_id" : 1, "date" : 1}).sort({"date" : -1}).limit(999).toArray(function(err, data) {
                            if (err) res.send(utils.getError(err));
                            doc["followeds"] = utils.toArray(data);
                            mongo.follow.find({'followed' : email}, { "_id" : 1, "date" : 1}).sort({"date" : -1}).limit(999).toArray(function(err, data) {
                                if (err) res.send(utils.getError(err));
                                doc["followers"] = utils.toArray(data);
                                mongo.notif.find({'enderecado' : email}, { "_id" : 1, "date" : 1}).sort({"date" : -1}).limit(99).toArray(function(err, data) {
                                    if (err) res.send(utils.getError(err));
                                    doc["notifications"] = utils.toArray(data);
                                    mongo.share.find({'poster' : email}, { "_id" : 1, "date" : 1}).toArray(function(err, data) {
                                        if (err) res.send(utils.getError(err));
                                        doc["shares"] = utils.toArray(data);
                                        res.send(utils.getSuccess(doc));
                                    });
                                });
                            });
                        }); 
                    });
                }); 
            });
        });
        
        // Change notifications option 
        router.post('/notifications', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var email = req.body.email;
            var notifications = req.body.notifications == "1";
            mongo.user.findAndModify({ "email" : email }, {}, {$set: {'enable_notifications': notifications}}, {}, function(err, object) {
                if (err) {
                    res.send(utils.getError(err));
                } else {
                    res.send(utils.getSuccess({}));
                }
            });
        })
        
        router.get('/most_followed', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            mongo.follow.aggregate([{$group: {_id: "$followed", total: {$sum: 1}}}, {$sort: {"total": -1}}, {$limit: 10}], function(err, data) {
                if (err) res.send(utils.getError(err));
                var total = data.length;
                var count = 0;
                var docs = [];
                data.forEach(function(doc) {
                    mongo.user.findOne({"email" : doc._id}, {"email" : 1, "date" : 1}, function(err, doc) {
                        if (err) res.send(utils.getError(err));
                        if (doc) docs.push(doc);
                        count++;
                        if (count == total) {
                            res.send(utils.getSuccess({"users" : docs}));
                        }
                    });
                });
            });
        })
        
        // Search for a poetry 
        router.get('/search', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var name = req.query.name;
            var query = {};
            query['name'] = new RegExp('.*' + name.toLowerCase() + '.*', 'i');
            mongo.user.find(query).limit(99).toArray(function(err, data) {
                if (err) {
                    res.send(utils.getError(err));
                } else {
                    res.send(utils.getSuccess({ "users" : utils.toArray2(data) }));
                }
            });
        });
        
        return router;
    }();