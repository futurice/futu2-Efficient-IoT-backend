'use strict';
const Rx = require('rx');
const redis = require('redis');
const url = require('url');

const storageUtils = {
  createConnection() {
    let client;
      if (process.env.REDISTOGO_URL) {
        let prodRedis = url.parse(process.env.REDISTOGO_URL);

        client = redis.createClient(prodRedis.href);
        client.auth(prodRedis.auth.split(":")[1]);
      } else {
        client = redis.createClient();
      }
      return client;
  }
};

const storage = {
  client: null,

  connect() {
    this.client = storageUtils.createConnection();
    this.client.on('error', error => console.error(`Redis error: cache connection error: ${error}`));
    return this;
  },

  get(key) {
    const observable = Rx.Observable.fromNodeCallback(this.client.get, this.client);
    return observable(key)
      .map(val => {
        console.log(`Redis: Storage.get fetched  -> ${key}`);
        return JSON.parse(val);
      })
      .doOnError(error => console.error(`Redis error: Storage.get(${key}) -> ${error}`));
  },

  set(message) {
    const observable = Rx.Observable.fromNodeCallback(this.client.set, this.client);
    const key = `${message.type}:${message.id}`;
    return observable(key, JSON.stringify(message))
      .zip(this.get(key)) // return value from database
      .map(([status, dbValue]) => {
        console.log(`Redis: Storage.set saved ${key}`);
        return dbValue;
      })
      .doOnError(error => console.error(`Redis error: Storage.set(${key}) -> ${error}`));
  },

  keys() {
    return Rx.Observable.fromNodeCallback(this.client.keys, this.client)('*')
      .map(keys => {
        console.log(`Redis: Storage.keys fetched -> ${keys}`);
        return keys;
      })
      .distinct()
      .doOnError(error => console.error(`Redis error: Storage.keys -> ${error}`));
  },

  getAll() {  // TODO: needs improvements -- ugly code
    const observable = Rx.Observable.fromNodeCallback(this.client.keys, this.client);
    const keys =
      this.keys()
        .flatMap(keys => {
          return keys.map(key => { console.log(key); return this.get(key); });
        });

    return Rx.Observable.combineLatest(
      keys,
      (vals) => vals
      )
      .flatMap(vals => vals)
      .bufferWithCount(1000)
      .doOnError(error => console.error(`Redis error: Storage.getAll -> ${error}`));
  }
};

module.exports = storage;

