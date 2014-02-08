# mongoose-fs

Mongoose plugin for large attributes storage in GridFS.

## Why ?

A basic mongo document can only keep a limited number of information. If you want to attach big buffers to your mongo documents, now you can with this plugin.

## Installation

```shell
npm install mongoose-fs
```

or add it to your `package.json`.

## Usage

### Schema decoration

First you'll need to decorate your schema.

You'll have to choose your GridFS keys from your schema.

You won't be able to run queries on those keys, so ensure that it's just for storing additianal data in your model.

Here's an example :

```javascript
var mongoose = require('mongoose');
var mongooseFS = require('mongoose-fs');

var fileSchema = mongoose.Schema({
  name: String,
  size: Number,
  creation_date: Date,
  content: String,
  complement: {}
});

fileSchema.plugin(mongooseFS, {keys: ['content', 'complement']});
var File = mongoose.model('File', fileSchema);
```

In this example, the content of the `content` and `complement` keys will be stored in GridFS.

#### Plugin options

For more control we provide those options to the plugin :

* `keys` is mandatory. It's just an array of keys processed by the plugin.
* `bucket` is the GridFS in which you want to store this data. By default it will be `'fs'`.
* `connection` is your mongo connection. By default it uses the default mongoose connection.

### Saving a document

Nothing has to be done here. The content of the keys will be automatically sent into GridFS.

### Loading a document

When you load a document, we chose to not unpack data from GridFS but to add an enhancement method which will unpack objects from GridFS. This lazy approach gives you more control on your data flow.

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
    // Don't forget you can use async !
  });
});
```