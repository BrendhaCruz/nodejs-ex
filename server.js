//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');
var fs       = require('fs');
var mongo    = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var url 	   = require('url');
var mdb      = require('./models/mongo');

Object.assign=require('object-assign');

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

// console.log("####################################################");
// console.log(">>> ", mongoURL);
// console.log(">>> ", process.env.DATABASE_SERVICE_NAME);
// console.log(">>> ", (mongoURL === null || mongoURL === undefined) && process.env.DATABASE_SERVICE_NAME === undefined);

if ((mongoURL === null || mongoURL === undefined)) {
    console.log("####################################################");
    console.log(">>> ", mongoURL);
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME !== null ? process.env.DATABASE_SERVICE_NAME : "",
    mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'] ||"127.0.0.1",
    mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'] || "27017",
    mongoDatabase = process.env[mongoServiceName + '_DATABASE'] || "teste",
    mongoPassword = process.env[mongoServiceName + '_PASSWORD'] || "",
    mongoUser = process.env[mongoServiceName + '_USER'] || "";

    console.log(`>>> , host: ${mongoHost} port: ${mongoPort} database: ${mongoDatabase}`);
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


/*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */
// mdb.init(function (err) {
//     if (err) {
//         throw err;
//     }
// });

var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
    if (mongoURL === null) return;
    console.log("####################################################");
    console.log(mongoURL);
    mongo.connect(mongoURL, function(err, conn) {
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

        // Custom modules
    app.use('/user',    require('./models/user'));
    app.use('/poetry',  require('./models/poetry'));
    app.use('/comment', require('./models/comment'))
    app.use('/like',    require('./models/like'));
    app.use('/notif',   require('./models/notif'));
    app.use('/follow',  require('./models/follow'));
    app.use('/share',  require('./models/share'));

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

