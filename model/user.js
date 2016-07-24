var mongodb = require("./db.js");

function User(user){
	this.name = user.name;
	this.link = user.link;
	this.email = user.email;
}

module.exports = User;

//存储用户信息
User.prototype.save = function(callback){
	var user = {
		name : this.name,
		link : this.link,
		email : this.email
	};
	mongodb.open(function(error, data_base){
		if(error){
			return callback(error);
		};
		data_base.collection("user", function(error, collection){
			if(error){
				mongodb.close();
				return callback(error);
			};
			collection.insert(user, { save : true }, function(error, user){
				mongodb.close();
				if(error){
					return callback(error);
				};
				callback(null, user);
			});
		});
	});
}

//读取用户信息
User.prototype.get = function(name, callback){
	mongodb.open(function(error, data_base){
		if(error){
			return callback(error);
		};
		data_base.collection("user", function(error, collection){
			if(error){
				mongodb.close();
				return callback(error);
			};
			collection.findOne(user, { name : name }, function(error, user){
				mongodb.close();
				if(error){
					return callback(error);
				};
				callback(null, user);
			});
		});
	});
}