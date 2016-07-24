var settings = require("../setting.js");
var Db = require("mongodb").Db;
var Connection = require("mongodb").Connection;
var Server = require("mongodb").Server;

module.exports = new Db(settings.data_base.db, new Server(settings.data_base.host, settings.data_base.port), { safe: true });