var async = require("async");
var eventproxy = require("eventproxy");
var cheerio = require("cheerio");
var request = require("superagent");
var path = require("path");
var setting = require("./setting.js");
var unique = require("./mini_func/unique.js");
var User = require("./model/user.js");

var eventproxy = new eventproxy();
var header = setting.header;
var asyncLink = setting.asyncLink;	//获取主页链接并发连接数
var asyncEmail = setting.asyncEmail;	//获取Email并发连接数
var user = setting.user;	//目标用户
var followersAll = 0;	//目标用户的跟随者总数
var followingAll = 0;	//目标用户的关注者总数
var followersLink = [];	//目标用户所有跟随者的主页链接
var followingLink = [];	//目标用户所有关注者的主页链接
var EmailList = [];	//存放所抓取Email的数组
var count = 0;	//计数器 

function start(){
	//获取所有跟随者的主页链接
	getLinks("followers", followersAll, followersLink);
	//获取所有关注者的主页链接
	getLinks("following", followingAll, followingLink);
	//获取完所有user的主页链接后触发此函数
	eventproxy.all("getFollowersLinks", "getFollowingLinks", function(followersLinks, followingLinks){
		allFollowLinks = unique(followersLinks.concat(followingLinks));
		console.log(allFollowLinks.length);
		console.log(allFollowLinks);
		console.log("全部跟随者及关注者的主页链接已抓取完毕，即将异步并发抓取所有跟随者及关注者的Email，当前并发数为：" + asyncEmail);
		//根据所有user的主页链接并发抓取相对应的Email
		async.mapLimit(allFollowLinks, asyncEmail, function(Link, callback){
			getHomepage(Link)
				.then((result) => {
					count++;
					console.log("正在抓取第 " + count + " 个用户的Email");
					var $ = cheerio.load(result.text);
					var email = $(".vcard-details li[itemprop=email] a").text() || "";
					if(email && email!=""){
						console.log(email);
					};
					callback(null, email);
				})
				.catch((error) => {
					console.log(error);
				});
		},function(error, result){
			if(error){
				console.log(error);
			}else{
				console.log("all right");
				console.log(result);
				return;
			};
		});
	});
}

//获取跟随者或关注者所有的主页链接
function getLinks(type, all, links){
	getNum(type)
		.then((result) => {
			var $ = cheerio.load(result.text);
			//跟随者或关注者总人数
			all = parseInt(($(".selected .counter").text().trim()).replace(/,/g,''));
			//跟随者或关注者列表页数(github最多只予许查询至100页)
			var pages = Math.ceil(all/51)>100 ? 100 : Math.ceil(all/51);
			//查询参数数组
			var queryList = [];
			console.log(type + " 总人数：" + all);
			console.log(type + " 列表页数：" + pages);
			for(var query=1; query<pages+1; query++){
				queryList.push(query);
			};
			console.log("即将异步并发抓取所有 " + type + " 主页链接，当前并发数为：" + asyncLink);
			async.mapLimit(queryList, asyncLink, function(query, callback){
				console.log("正在抓取 page = "+ query + " 的 " + type + " 列表");
				getPage(type, query)
					.then((result) => { 
						var $ = cheerio.load(result.text);
						//当前所在页所有的跟随者或关注者
						var follow = $(".follow-list-name a");
						//当前所在页所有跟随者或关注者主页链接
						for(var i = 0; i < follow.length; i ++){
							if(follow[i].attribs.href){
								links.push("https://github.com" + follow[i].attribs.href);
							};
						};
						console.log("已成功抓取 " + links.length + " 条 " + type + " 主页链接");
						callback(null, null);
					})
					.catch((error) => {
						console.log(error);
					});
			},function(error, result){
				if(error){
					console.log(error);
				}else{
					console.log(type + " 所有的链接已抓取完毕,一共有 " + links.length + "条链接,去重之后为：");
					console.log(unique(links));
					if(type == "followers"){
						eventproxy.emit('getFollowersLinks', unique(links));
					}else{
						eventproxy.emit('getFollowingLinks', unique(links));
					};
				};
			});
		})
		.catch((error) => {
			console.log(error);
		});
}

//获取跟随者或关注者总数以及列表页数
function getNum(type){
	return new Promise((resolve, reject) => {
			request.get("https://github.com/" + user + "/" + type)
				.set(header)
				.end((error, result) => {
					error ? reject(error) : resolve(result);
				})
		});
}

//获取跟随者或关注者列表页
function getPage(type, query){
	return new Promise((resolve, reject) => {
			request.get("https://github.com/" + user + "/" + type + "?page=" + query)
				.set(header)
				.end((error, result) => {
					error ? reject(error) : resolve(result);
				})
		});
}

//获取跟随者或关注者主页
function getHomepage(Link){
	return new Promise((resolve, reject) => {
			request.get(Link)
				.set(header)
				.end((error, result) => {
					error ? reject(error) : resolve(result);
				})
		});
}

start();
