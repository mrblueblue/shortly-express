var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
});

module.exports = User;



// var Click = db.Model.extend({
//   tableName: 'clicks',
//   hasTimestamps: true,
//   link: function() {
//     return this.belongsTo(Link, 'link_id');
//   }
// });
