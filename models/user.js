var mongoose=require("mongoose");
var Schema = mongoose.Schema;

var user_schema = new Schema({
	link : { type : String, required : true },
	email : { type : String, required : true }
});

module.exports = mongoose.model("user", user_schema);