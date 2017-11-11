module.exports = function() {
    
        var express = require('express');
        var router  = express();
        var utils   = require('./utils');
        var mongo   = require('./mongo');
        var ObjectId = require('mongodb').ObjectID;
        var http    = require('http');
        
        sendNotification = function(data, regids, callback) {
            var post_data = JSON.stringify (
                {
                    "collapse_key": data.mensagem,
                    "data": data,
                    "registration_ids": regids
                }
            );
            var options = {
                hostname: "android.googleapis.com",
                port: 80,
                path: "/gcm/send",
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "content-length": post_data.length,
                    "authorization": "key=AIzaSyAQAX7lBDRNpqDLyDkEzMk3tKRLpFRL0O0"
                }
            };
            var req = http.request(options, function(res) {
                res.setEncoding("utf8");
                callback();
            });
            req.on("error", function(e) {
                callback(e);
            });
            req.write(post_data);
            req.end();
        };
        
        //create the notification
        router.post('/post', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var enderecado = req.body.enderecado;
            var titulo = req.body.titulo;
            var mensagem = req.body.mensagem;
            var dataCriacao = req.body.dataCriacao;	
            var chave = req.body.chave;
            var poesia = req.body.poesia;
            var tipo = req.body.tipo;
            doc = {
                "enderecado": enderecado,
                "titulo" :  titulo,
                "chave" : chave,
                "mensagem" : mensagem,
                "date" : dataCriacao,
                "poesia" : poesia,
                "tipo" : tipo
            };
            var ress = res;
            mongo.notif.insert(doc, function(err) {
                if (err) {
                    res.send(utils.getError(err));
                } else {
                    mongo.regid.find({"user" : enderecado}, {"regid" : 1}).toArray(function(err, data) {
                        if (err) res.send(utils.getError(err));
                        regids = [];
                        data.forEach(function(doc) {
                            regids.push(doc.regid);
                        });
                        mongo.user.findOne({"email" : enderecado}, {"enable_notifications" : 1}, function(err, doc2) {
                            if (doc2["enable_notifications"]) {
                                sendNotification(doc, regids, function(err) {
                                    if (err) {
                                        ress.send(utils.getError(err));
                                    } else {
                                        ress.send(utils.getSuccess({ "id" : doc._id.toString()}));
                                    }
                                });
                            } else {
                                ress.send(utils.getSuccess({ "id" : doc._id.toString()}));
                            }
                        });
                    });
                }
            });
        });
                
        // Get a notification by id 
        router.get('/get', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');	
            var id = req.query.id;
            mongo.notif.findOne({'_id' : ObjectId(id)}, function(err, notif) {
                if (err) {
                    res.send(self.getError(err));
                } else {
                    if (notif) {
                        // notif exists 
                        res.send(utils.getSuccess(notif));
                    } else {
                        res.send(utils.getError("Notificação não encontrada."));
                    }
                }
            });
        });
    
        //remove the like
        router.post('/delete', function(req, res) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var id = req.body.id;
            mongo.notif.remove({'_id' : ObjectId(id)}, function(err, result) {
                if (err) {
                    res.send(utils.getError(err));
                } else {
                    res.send(utils.getSuccess({}));
                }
            });
        });
            
        return router;
    }();