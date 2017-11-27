var express = require('express');

module.exports = function() {
	
	this.getError = function(message) {
		var response = { "success" : false, "message" : message };
		return JSON.stringify(response);
	};
	
	this.getSuccess = function(data) {
		data["success"] = true; 
		if (data._id) {
			data.id = data._id.toString();
		}
		return JSON.stringify(data);
	};
	
	this.toArray = function(data) {
		var array = [];
		data.forEach(function(doc) {
			array.push({ id : doc._id.toString(), date : doc.date });
		});
		return array;
	};
	
	this.toArray2 = function(data) {
		var array = [];
		data.forEach(function(doc) {
			array.push({ email : doc.email, date : doc.date });
		});
		return array;
	};
	
	this.count = function(data) {
		var count = 0;
		data.forEach(function(doc) {
			count++;
		});
		return count;
	}

	return this;
}();