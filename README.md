# mongoose-fs

Mongoose plugin for large attributes storage in GridFS.

## Why ?

A basic mongo document can only keep a limited number of information. This plugin gives you the power to skip this limit by storing the big and not queried parts into GridFS.

## Installation

```shell
npm install mongoose-fs
```

or add it to your `package.json`.

## Usage

### Schema decoration

First you'll need to decorate your schema with the plugin.

Your GridFS keys **shouldn't be in your schema** and your schema should be in **strict mode** (default behavior). If you don't respect those two conditions, your keys will be stored in mongo and in GridFS **at the same time**.

You won't be able to run queries on those keys, so ensure that it's just for storing additional data in your model.

Here's an example :

```javascript
var mongoose = require('mongoose');
var mongooseFS = require('mongoose-fs');

var fileSchema = mongoose.Schema({
  name: String,
  size: Number,
  creation_date: Date
});

fileSchema.plugin(mongooseFS, {keys: ['content', 'complement'], mongoose: mongoose});
var File = mongoose.model('File', fileSchema);
```

In this example, the content of the `content` and `complement` keys will be stored in GridFS.

#### Plugin options

For more control we provide those options to the plugin :

* `keys` is mandatory. It's just an array of keys processed by the plugin.
* `mongoose` is mandatory. Pass your mongoose module (Why ? because the internal mongoose's gridfs module should be absolutely the same....)
* `bucket` is the GridFS in which you want to store this data. By default it will be `'fs'`.
* `connection` is your mongo connection. By default it uses the default mongoose connection.

### Saving a document

Nothing has to be done here. The content of the keys will be automatically sent into GridFS.

### Loading a document

When you get a document back from mongo, you'll still have to unpack it's gridfs content.

It remains very simple to use :

```javascript
File.findById(id, function (err, file) {
  if(err) {
    return done(err);
  }
  file.retrieveBlobs(function (err) {
    if(err) {
      return done(err);
    }
    // Now everything is ready !
  });
});
```
