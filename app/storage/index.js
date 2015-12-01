"use strict";
const Rx = require('rx');
const redis = require('redis');

class Storage {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', error => console.error(`Redis error: cache connection error: ${error}`));

    this.set = message => {
      const key = `${message.type}:${message.id}`;
      const value = JSON.stringify(message);

      const save = () => {
        return this.client.set(key, value, (err, str) => {
          if (str) {
            console.log(`Redis: "${key}" saved to redis`);
          } else {
            console.log(`Redis error: AppStorage.set(${key}) -> ${error}`);
          }
        });
      };

      if(save()) {
        console.log(`Redis: return value for "${key}"`);
        return message;
      } else {
        console.log(`Redis: no value for key "${key}"`);
        return null;
      }
    };

    this.keys = () => {
      return Rx.Observable.fromNodeCallback(this.client.keys, this.client);
    };

    this.get = () => {
      return Rx.Observable.fromNodeCallback(this.client.get, this.client);
    };

    this.getAll = () => {
      const keysStream = this.keys();
      const valueStream = this.get();
      const keys =
        keysStream('*')
          .flatMap(keys => {
            return keys
              .map(
                key =>
                  valueStream(key)
                    .map(val => JSON.parse(val))
              );
          });

      return Rx.Observable.combineLatest(
        keys,
        (vals) => vals
      )
      .flatMap(vals => vals)
      .bufferWithCount(100);
    };
  }
}


module.exports = Storage;

