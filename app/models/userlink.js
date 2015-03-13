var db = require('../config');
var Promise = require('bluebird');

var Userlink = db.Model.extend({
  tablename: 'urls_users'
});

module.exports = Userlink;
