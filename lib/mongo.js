'use strict';

var util = require('util');
var MongoClient = require('mongodb').MongoClient;

var SCHEMA = 'mongodb';

function buildMongodbUri(opts) {
  if (opts.username) {
    return util.format("%s://%s:%s@%s:%d", SCHEMA, opts.username, opts.password, opts.host, opts.port);
  } else {
    return util.format("%s://%s:%d", SCHEMA, opts.host, opts.port);
  }
}

function buildField(fields) {
  if (!fields || fields.length === 0) {
    return null;
  }

  var fs = {};
  fields.forEach(function (f) {
    fs[f] = 1;
  });
  return fs;
}

function Mongo(opts) {
  this.opts = opts;
  this.mongodbUri = buildMongodbUri(opts);
  this.collection = opts.collection;
  this.query = opts.query || {};
  this.fields = buildField(opts.fields);
  this.limit = opts.limit;
  this.skip = opts.skip;
  this.db = null;
}

Mongo.prototype.connect = function (callback) {
  var self = this;

  MongoClient.connect(this.mongodbUri, function (err, client) {
    if (err) return callback(err);
    self.db = client.db(self.opts.database);
    callback();
  });
};

Mongo.prototype.stream = function (batchSize) {
  var collection = this.db.collection(this.collection);
  var cursor = null;
  batchSize = batchSize || 1000;

  if (this.fields) {
    cursor = collection.find(this.query, this.fields);
  } else {
    cursor = collection.find(this.query);
  }

  if (this.limit) cursor = cursor.limit(this.limit);
  if (this.skip) cursor = cursor.skip(this.skip);

  return cursor.batchSize(batchSize).stream(true);
};

Mongo.prototype.close = function () {
  if (this.db) {
    this.db.close();
  }
};

module.exports = Mongo;
