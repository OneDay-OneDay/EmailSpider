//数组去重
function unique(arr){
	var res = [];
 	var json = {};
 	for(var i = 0; i < arr.length; i++){
  		if(!json[arr[i]]){
   			res.push(arr[i]);
   			json[arr[i]] = 1;
  		};
 	};
 	return res;
}

module.exports = unique;