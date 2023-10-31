import mongoose from 'mongoose';
import { logger } from '@/utils/color-logger';
import { DB_NAME, MONGODB_URI } from '@/config';
const mongodb = require("mongodb");
import { MongoClient } from "mongodb";

// const dbName = 'app';
const client = new MongoClient(MONGODB_URI);
const db = client.db(DB_NAME);
const bucket = new mongodb.GridFSBucket(db, { bucketName: "audio" });

const videoBucket = new mongodb.GridFSBucket(client.db(), {
  bucketName: "videos",
});

const connection = async (uri: string, options?: mongoose.ConnectOptions) => {
  try {
    await mongoose.connect(uri, options);
    logger('success','[monogo]')(`Connected To Database`);
  } catch (error) {
    logger('error','[monogo]')(error);
  }
};

export { connection,client,bucket, videoBucket };


export default connection;
