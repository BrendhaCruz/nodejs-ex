//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');
   // utils   = require('./utils');
//var mongo = require('mongodb');
//var ObjectId = require('mongodb').ObjectID;
var utils   = require('./models/utils');

Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
        mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
        mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
        mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
        mongoPassword = process.env[mongoServiceName + '_PASSWORD']
        mongoUser = process.env[mongoServiceName + '_USER'];

    if (mongoHost && mongoPort && mongoDatabase) {
        mongoURLLabel = mongoURL = 'mongodb://';
        if (mongoUser && mongoPassword) {
            mongoURL += mongoUser + ':' + mongoPassword + '@';
        }
        // Provide UI label that excludes user id and pw
        mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
        mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

    }
}

var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
    if (mongoURL == null) return;

    var mongodb = require('mongodb');
    if (mongodb == null) return;

    mongodb.connect(mongoURL, function(err, conn) {
        if (err) {
            callback(err);
            return;
        }

        db = conn;
        dbDetails.databaseName = db.databaseName;
        dbDetails.url = mongoURLLabel;
        dbDetails.type = 'MongoDB';

        console.log('Connected to MongoDB at: %s', mongoURL);
    });
};

app.get('/', function (req, res) {
    // try to initialize the db on every request if it's not already
    // initialized.
    if (!db) {
        initDb(function(err){});
    }
    if (db) {
        var col = db.collection('counts');
        // Create a document with request IP and current time of request
        col.insert({ip: req.ip, date: Date.now()});
        col.count(function(err, count){
            res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
        });
    } else {
        res.render('index.html', { pageCountMessage : null});
    }
});

app.get('/pagecount', function (req, res) {
    // try to initialize the db on every request if it's not already
    // initialized.
    if (!db) {
        initDb(function(err){});
    }
    if (db) {
        db.collection('counts').count(function(err, count ){
            res.send('{ pageCount: ' + count + '}');
        });
    } else {
        res.send('{ pageCount: -1 }');
    }
});

// Create a new user
app.post('/post', function(req, res) {
    // try to initialize the db on every request if it's not already
    // initialized.
    if (!db) {
        initDb(function(err){});
    }
    if (db) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JS_Script);
        var email    = req.body.email;
        var date	 = req.body.date;
        var password = req.body.password;
        var name     = req.body.name;
        // Find user with same email
        db.user.findOne({ "email" : email }, function(err, data) {
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
                    db.user.insert(doc, function(err) {
                        if (err) {
                            res.send(utils.getError(err));
                        } else {
                            res.send(utils.getSuccess({ "id" : doc.email }));
                        }
                    });
                }
            }
        });
    }
});


// Users
	// Authenticate in the application
	app.get('/get', function(req, res) {
        if (!db) {
            initDb(function(err){});
        }
        if (db) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JS_Script);
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
            db.user.findOne(data, function(err, doc) {
                if (err) {
                    db.collection('user', function(err, collection){
                        res.send(utils.getError(err));
                    });
                }else {
                        res.send(utils.getError("Usuário ou senha inválidos."));
                }
            });
        }
          
    });
    




// error handling
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500).send('Something bad happened!');
});

initDb(function(err){
    console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;