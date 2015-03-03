var Bookshelf = require('bookshelf');
var path = require('path');

var db = Bookshelf.initialize({
  client: 'sqlite3',
  connection: {
    host: '127.0.0.1',
    user: 'your_database_user',
    password: 'password',
    database: 'shortlydb',
    charset: 'utf8',
    filename: path.join(__dirname, '../db/shortly.sqlite')
  }
});

db.knex.schema.hasTable('urls').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('urls', function (link) {
      link.increments('id').primary();
      link.string('url', 255);
      link.string('base_url', 255);
      link.string('code', 100);
      link.string('title', 255);
      link.integer('visits');
      link.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

db.knex.schema.hasTable('clicks').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('clicks', function (click) {
      click.increments('id').primary();
      click.integer('link_id');
      click.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

/************************************************************/
// Add additional schema definitions below
/************************************************************/
// db.knex.schema.dropTable('users');

db.knex.schema.hasTable('users').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('users', function (user) {
      user.increments('id').primary();
      user.string('username', 100);
      user.string('password', 100);
      user.string('salt', 100);
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

// db.knex.schema.hasTable('userlinks').then(function(exists) {
//   if (!exists) {
//     db.knex.schema.createTable('userlinks', function (userlink) {
//       userlink.increments('id').primary();
//       userlink.integer('user_id').references('users.id');
//       userlink.integer('link_id').references('urls.id');
//     }).then(function (table) {
//       console.log('Created Table', table);
//     });
//   }
// });

// db.knex.select('*').from('userlinks')



module.exports = db;
