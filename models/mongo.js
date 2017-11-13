var mongo = require('mongodb');

module.exports.init = function(callback) {
	new mongo.Db('nodejs-ex', new mongo.Server(process.env.OPENSHIFT_MONGODB_DB_HOST || "localhost", 
	process.env.OPENSHIFT_MONGODB_DB_PORT || 8080, {auto_reconnect: false, poolSize: 4}), 
	{w:0, native_parser: false}).open(function(err, client) {
		if (!err) {
			
				if (err) {
					callback(err);
				} else {
					module.exports.client = client;
					client.collection('user', function(err, collection) {
						if (err) callback(err);
						module.exports.user = collection;
					});
					client.collection('poetry', function(err, collection) {
						if (err) callback(err);
						module.exports.poetry = collection;
					});
					client.collection('like', function(err, collection) {
						if (err) callback(err);
						module.exports.like = collection;
					});
					client.collection('comment', function(err, collection) {
						if (err) callback(err);
						module.exports.comment = collection;
					});
					client.collection('notif', function(err, collection) {
						if (err) callback(err);
						module.exports.notif = collection;
					});
					client.collection('follow', function(err, collection) {
						if (err) callback(err);
						module.exports.follow = collection;
					});
					client.collection('share', function(err, collection) {
						if (err) callback(err);
						module.exports.share = collection;
					});
					client.collection('regid', function(err, collection) {
						if (err) callback(err);
						module.exports.regid = collection;
					});
				}
			
		} else {
			callback(err);
		}
	});
};
