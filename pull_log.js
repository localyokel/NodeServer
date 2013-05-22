
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , fs = require('fs')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

process.on('uncaughtException', function (err) {
  console.log((new Date).toUTCString() + ' uncaughtException:',err.message);
});

app.get('/at',function(req,res) {
  var key = req.query.key;
  if (key == 'attakmule') {
    fs.readFile('./log/ad_trans.log',function(error,content) {
      //console.log('Request for lymuads.js');
      if (error) {
        res.writeHead(200,{'Content-type':'text/html'});
        res.end();
      } else {
        res.writeHead(200,{'Content-type':'text/html'});
        res.end(content,'utf-8');
      }
    });
  } else {
    res.writeHead(200,{'Content-type':'text/html'});
    res.end();
  }
});

app.get('/c',function(req,res) {
  var key = req.query.key;
  if (key == 'attakmule') {
    fs.readFile('./log/console.log',function(error,content) {
      //console.log('Request for lymuads.js');
      if (error) {
        res.writeHead(200,{'Content-type':'text/html'});
        res.end();
      } else {
        res.writeHead(200,{'Content-type':'text/html'});
        res.end(content,'utf-8');
      }
    });
  } else {
    res.writeHead(200,{'Content-type':'text/html'});
    res.end();
  }
});



app.get('*', function(req, res){
  res.end('', 404);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
