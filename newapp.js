
var cluster = require('cluster');

//currently spawns two servers for cluster
if ( cluster.isMaster ) {
	var workers = 4;
	console.log('start cluster with %s workers', workers);

	for (var i = 0; i < workers; ++i) {
	  var worker = cluster.fork().process;
	  console.log('worker %s started.', worker.pid);
	}

	cluster.on('exit', function(worker) {
	  console.log('worker %s died. restart...', worker.process.pid);
	  cluster.fork();
	});
} else {
	var express = require('express')
	  , routes = require('./routes')
	  , user = require('./routes/user')
	  , http = require('http')
	  , path = require('path')
	  , fs = require('fs')
	  , mysql = require('mysql')
	  , memcached = require('memcachejs')
	  , cluster = require('cluster');

	process.on('uncaughtException', function (err) {
  	  console.log((new Date).toUTCString() + ' uncaughtException:',err.message);
  	});

	var app = express();

	app.configure(function(){
	  app.set('port', process.env.PORT || 80);
	  app.set('views', __dirname + '/views');
	  app.set('view engine', 'jade');
	  app.use(express.favicon());
	  app.use(express.logger('dev'));
	  app.use(express.bodyParser());
	  app.use(express.methodOverride());
	  app.use(app.router);
	  app.use(express.static(path.join(__dirname, 'public')));
	});

	//not sure what this is or why it is necessary...leaving it in
	app.configure('development', function(){
	  app.use(express.errorHandler());
	});

	var mysqlc = mysql.createConnection({
	  host:'127.0.0.1',
	  user:'attakmule',
	  database:'ads',
	  password:'Not4u2!',
	});
	mysqlc.connect();

	function get_default(size) {
		var def_id = size;
		connection.get(def_id,function(result) {
			if (result.success && result.data) {
				return result.data;  
			} else {
				if(mysqlc) {
					query = 'SELECT ad FROM passbacks WHERE pb_id = \'' + def_id + '\'';
					mysqlc.query(query,function(err,rows,fields) {
						if (err) {
						  console.log('Error from MySQL while searching for default creative');
						  return;
						} else if (rows[0]) {
						  connection.set(def_id,rows[0].ad,function(result) {
				  			if (result.success) {
				  			  console.log('app.get:Added default creative to memcached');
				  			} else {
				  			  console.log('app.get:Couldn\'t add default creative to memcached');
				  			}
				  		  });
						  return rows[0].ad;
						} else {
						  console.log('No default creative found for ' + def_id);
						  return;
						}
					});
				} else {
					console.log('No MySQL connection established when finding default creative');
					return;
				}
			}
		});
	}

	function modify_tag(adtag,keys) {
		var new_adtag = adtag;
		if (keys != 'NA') {
			new_adtag = adtag.replace(/ados_load\(\);/im,"ados_setKeywords('" + keys + "');\nados_load();");
			//console.log('Added keywords to tag.');
		}
		return new_adtag;
	}

	var connection = new memcached('localhost', 11211);

	app.get('/', function(req,res) {
	  res.writeHead(200,{'Content-type':'text/html'});
	  res.end();
	});

	app.get('/index.html', function(req,res) {
	  res.writeHead(200,{'Content-type':'text/html'});
	  res.end();
	});

	// get the lymuads.js file from the server
	app.get('/lymuads.js',function(req,res) {
        fs.readFile('./lymuads.js',function(error,content) {
	    //console.log('Request for lymuads.js');
        if (error) {
          res.writeHead(200,{'Content-type':'text/html'});
          res.end();
        } else {
          res.writeHead(200,{'Content-type':'text/html'});
          res.end(content,'utf-8');
        }
      });
    });

    // get the adtest.html file from the server
	app.get('/adtest.html',function(req,res) {
        fs.readFile('./adtest.html',function(error,content) {
        if (error) {
          res.writeHead(200,{'Content-type':'text/html'});
          res.end();
        } else {
          res.writeHead(200,{'Content-type':'text/html'});
          res.end(content,'utf-8');
        }
      });
    });

	app.get('/a',function(req,res) {
	  // we do not send an ad if host is none or garbage is 1
	  var garbage = 0;
      var host='none';

      //keys are used to modify the adzerk tag 
      var keys = unescape(req.query.keys);
      if (!keys) {
      	keys = 'NA';
      } else {
      	keys = keys.replace(/["']/im,"");
      }

      // size is a string that must be less than 7chars and be 'height' + 'x' + 'width'
	  var size = req.query.size;
	  if (size.length > 7) {
	  	console.log('app.get:Bad size:'+size);
	  	size = '1x1';
	  	garbage = 1;
	  }

	  // adpos is either atf or btf
	  var adpos = req.query.adpos;
	  if (adpos != 'atf' && adpos != 'btf') {
	  	console.log('app.get:Bad pos:'+adpos);
	  	adpos = 'atf';
	  	garbage = 1;
	  }
	  keys = adpos;

	  // aid is the ad id and is only numeric
	  var aid = req.query.aid;
	  if (isNaN(aid) == 'false') {
	  	console.log('app.get:Bad aid:'+aid+' '+isNaN(aid));
	  	aid = 0;
	  	garbage = 1;
	  }

	  // referrer must have leading http://
	  var referrer = req.query.ref;
	  if (referrer) {
	  	var ref = unescape(referrer);
	  	console.log('app.get:Referrer:' + ref);
	  	var re = /^http:\/\/([a-zA-Z0-9\.\-\/]+)/im;
	    var urlarray = re.exec(ref);
	    if (urlarray && garbage == 0) {
		  host = urlarray[1];
		  //now check for leading www and take it out
		  var nhost = host.replace(/^www\.(.*?)/im,"$1");
		  if (nhost) host=nhost;
		  var phost = host;
		  host = host.replace(/^([A-Za-z0-9\.\-]+).*$/im,"$1");
		  console.log('PHOST:' + phost + ' HOST:' + host);
		  //now we have the host...will have to change this later on for dnainfo
  	    }
      } else {
      	garbage = 1;
      }
      //console.log('Status:' + host + ' ' + aid + ' ' + adpos + ' ' + size);
  
  	  // if everything is good we process the request
	  if (host != 'none' && garbage == 0) {
		console.log('app.get:Found ' + host + ' in ' + referrer);
		var node = host + ':' + aid + ':' + size + ':' + adpos;
		//console.log('app.get:'+node);
		//connection goes to memcache...
		if (connection) {
			connection.get(node,function(result) {
			//console.log('memcache_get:Getting ' + node);
			if (result.success && result.data) {
			  console.log('app.get:Found ' + node + ' in memcached');
			  res.writeHead(200,{'Content-type':'text/html'});
			  var adtag = result.data;
			  var new_adtag = modify_tag(adtag,keys);
			  res.end(new_adtag);
			} else {
			  console.log('app.get:Not found in memcached ' + node);
			  console.log('app.get:Checking for uni-passback');
			  var pb_id = 'pb_' + aid;
			  connection.get(pb_id,function(result) {
			  	if (result.success && result.data) {
			  	  res.writeHead(200,{'Content-type':'text/html'});
			  	  res.end(result.data);
			  	} else {
			  	  console.log('app.get:Not a UNI Passback...checking MySQL');
				  if (mysqlc) {
					var query = 'SELECT ad FROM ads WHERE size =\'' + size + '\' and node = \''+host+'\' and aid='+aid+' and adpos=\''+adpos+'\'';
					mysqlc.query(query,function(err,rows,fields) {
					  if (err) {
					  	// write header and empty response
					  	// maybe deliver default creative
					  	console.log('app.get:error getting ad from MySQL for ' + host);
						res.writeHead(200,{'Content-type':'text/html'});
						res.end();
					  } else if (rows[0]) {
						var adtag = rows[0];
						// now enter the tag in memcached
						connection.set(node,adtag.ad,function(result) {
						  if (result.success) {
						    console.log('app.get:Added tag for ' + node + ' to memcached');
						  } else {
						    console.log('app.get:Couldn\'t add ' + node + ' to memcached');
						  }
						});
						// deliver ad tag from mysql
						res.writeHead(200,{'Content-type':'text/html'});
						var new_adtag = modify_tag(adtag.ad,keys);
						res.end(new_adtag);
					  } else {
					  	console.log('app.get:Not found in MySQL...checking for Passback');
					  	query = 'SELECT ad FROM passbacks WHERE pb_id = \'' + pb_id + '\'';
					  	mysqlc.query(query,function(err,rows,fields) {
					  		if (err) {
					  		  res.writeHead(200,{'Content-type':'text/html'});
					  		  var default = get_default(size);
					  		  res.end(default);
					  		} else if (rows[0]) {
				  			  var tag = rows[0];
				  			  connection.set(pb_id,tag.ad,function(result) {
				  				if (result.success) {
				  					console.log('app.get:Added passback to memcached');
				  				} else {
				  					console.log('app.get:Couldn\'t add passback to memcached');
				  				}
				  			  }); // end connection.set
				  			  res.writeHead(200,{'Content-type':'text/html'});
				  			  res.end(tag.ad);
					  		} else {
					  		  //maybe send a default creative
					  		  console.log('app.get:No passback found in MySQL');
					  		  var default = get_default(size);
					  		  res.writeHead(200,{'Content-type':'text/html'});
					  		  res.end(default);
					  		}     // end if err
					  	});       // end of mysql.query for passback
					  }           // end of if err for mysql query
					});           // end of mysql.query for tag
				  } else {
				  	//maybe send a default creative
					console.log('app.get:No MySQL Connection available');
					var default = get_default(size);
					res.writeHead(200,{'Content-type':'text/html'});
					res.end(default);
				  } // end if mysqlc
			  	}   // end if result.success for pb_id in memcached
			  });   // end connection get pb_id
			} 		// end of result.success
		  }); 		// end of connection.get
		} else {
		  //maybe send a default creative
		  console.log('app.get:No Memcached connection');
		  res.writeHead(200,{'Content-type':'text/html'});
		  res.end();
		} // end of if connection(checking for memcached connection
	  } else {
	  	//maybe send a default creative
		console.log('app.get:Problem with request');
		res.writeHead(200,{'Content-type':'text/html'});
		var default = get_default(size);
		res.end(default);
	  } // end of if host

	}); // end of app.get

	http.createServer(app).listen(app.get('port'), function(){
	  console.log("Express server listening on port " + app.get('port'));
	});

} //end of cluster if then
