
var cluster = require('cluster');

//currently spawns two servers for cluster
if ( cluster.isMaster ) {
	var workers = 8;
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

	  // adpos is either atf or btf
	  var adpos = req.query.adpos;
	  if (adpos != 'atf' && adpos != 'btf') {
	  	console.log('app.get:Bad pos:'+adpos);
	  	adpos = 'atf';
	  	garbage = 1;
	  }

      //keys are used to modify the adzerk tag 
      //adpos gets added onto the end of keys for ATF/BTF targeting
      var keys = unescape(req.query.keys);
      if (!keys) {
      	keys = 'NA' + ',' + adpos;
      } else {
      	keys = keys.replace(/["']/im,"");
        keys = keys + ',' + adpos;
      }

      // size is a string that must be less than 7chars and be 'height' + 'x' + 'width'
	  var size = req.query.size;
	  if (size.length > 7) {
	  	console.log('app.get:Bad size:'+size);
	  	size = '1x1';
	  	garbage = 1;
	  }

	  // aid is the ad id and is only numeric
	  var aid = req.query.aid;
	  if (isNaN(aid)) {
	  	console.log('app.get:Bad aid:'+aid);
	  	aid = 0;
	  	garbage = 1;
	  }
	  var pb_id = 'pb_' + aid;

	  // referrer must have leading http://
	  var referrer = req.query.ref;
	  if (referrer) {
	  	var ref = unescape(referrer);
	  	//console.log('app.get:Referrer:' + ref);
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
		var node = host + ':' + aid + ':' + size + ':' + adpos;
		//connection goes to memcache...
		if (connection) {
			connection.get(node,function(result) {
			if (result.success && result.data) {
			  console.log('0:app.get:Found ' + node + ' in memcached');
			  res.writeHead(200,{'Content-type':'text/html'});
			  var adtag = result.data;
			  var new_adtag = modify_tag(adtag,keys);
			  res.end(new_adtag);
			} else {
			  console.log('1:app.get:Not found in memcached ' + node);
			  if (mysqlc) {
				var query = 'SELECT ad FROM ads WHERE size =\'' + size + '\' and node = \''+host+'\' and aid='+aid+' and adpos=\''+adpos+'\'';
				mysqlc.query(query,function(err,rows,fields) {
				  if (err) {
				  	// Error from MySQL...check for default ad
				  	  console.log('2:app.get:Error getting ad from MySQL: ' + err.message);
					  res.writeHead(200,{'Content-type':'text/html'});
					  var def_id = size;
					  connection.get(def_id,function(result) {
						if (result.success && result.data) {
							res.end(result.data);  
						} else {
							query = 'SELECT ad FROM passbacks WHERE pb_id = \'' + def_id + '\'';
							console.log(query)
							mysqlc.query(query,function(err,rows,fields) {
								if (err) {
								  console.log('3:app.get:Error from MySQL while searching for default creative: ' + err.message);
								  res.end();
								} else if (rows[0]) {
								  connection.set(def_id,rows[0].ad,function(result) {
						  			if (result.success) {
						  			  //console.log('app.get:Added default creative to memcached');
						  			} else {
						  			  console.log('4:app.get:Couldn\'t add default creative to memcached');
						  			}
						  		  });
								  res.end(rows[0].ad);
								} else {
								  console.log('5:app.get:MySQL:No default creative found for ' + def_id);
								  res.end();
								}
							});
						}
					  });
				  } else if (rows[0]) {
					var adtag = rows[0];
					//console.log('app.get:Found ad in MySQL...adding to memcache and delivering');
					// now enter the tag in memcached
					connection.set(node,adtag.ad,function(result) {
					  if (result.success) {
					    //console.log('app.get:Added tag for ' + node + ' to memcached');
					  } else {
					    console.log('5a:app.get:Couldn\'t add ' + node + ' to memcached');
					  }
					});
					// deliver ad tag from mysql
					res.writeHead(200,{'Content-type':'text/html'});
					var new_adtag = modify_tag(adtag.ad,keys);
					res.end(new_adtag);
				  } else { // We didn't find the ad in mysql...check for passback and if none send default
				  	var pb_id = 'pb_' + aid;
				  	console.log('6:app.get:Not found in MySQL...checking for Passback ' + pb_id);
				  	connection.get(pb_id, function(result) {
				  		if (result.success && result.data) {
				  			console.log('6a:app.get:Passback found in memcached:' + result.data);
				  			res.writeHead(200,{'Content-type':'text/html'});
				  			res.end(result.data);
				  		} else {
				  			console.log('6b:app.get:Passback not found in memcached');
						  	query = 'SELECT ad FROM passbacks WHERE pb_id = \'' + pb_id + '\'';
						  	mysqlc.query(query,function(err,rows,fields) {
						  		if (err) {
						  		  res.writeHead(200,{'Content-type':'text/html'});
								  var def_id = size;
								  console.log('6c:app.get:Error trying to get passback from MySQL');
								  connection.get(def_id,function(result) {
									if (result.success && result.data) {
										console.log('6d:app.get:Found passback in memcache:'+result.data);
										res.end(result.data);  
									} else {
										console.log('6e:app.get:Passback not found in memcached');
										query = 'SELECT ad FROM passbacks WHERE pb_id = \'' + def_id + '\'';
										mysqlc.query(query,function(err,rows,fields) {
											if (err) {
											  console.log('7:app.get:Error from MySQL while searching for default creative:' + err.message);
											  res.end();
											} else if (rows[0]) {
											  console.log('7a:app.get:Found passback in MySQL:' + rows[0]);
											  connection.set(def_id,rows[0].ad,function(result) {
									  			if (result.success) {
									  			  //console.log('app.get:Added default creative to memcached');
									  			} else {
									  			  console.log('8:app.get:Couldn\'t add default creative to memcached');
									  			}
									  		  });
											  res.end(rows[0].ad);
											} else {
											  console.log('9:app.get:No default creative found for ' + def_id);
											  res.end();
											}
										});
									}
								  });
						  		} else if (rows[0]) { // we have data from the mysql query for a passback...
					  			  var tag = rows[0];
					  			  var pb_id = 'pb_' + aid;
					  			  console.log('10a:app.get:Found passback in MySQL:'+tag);
					  			  connection.set(pb_id,tag.ad,function(result) {
					  				if (result.success) {
					  					//console.log('app.get:Added passback to memcached');
					  				} else {
					  					console.log('11:app.get:Couldn\'t add passback to memcached');
					  				}
					  			  }); // end connection.set
					  			  res.writeHead(200,{'Content-type':'text/html'});
					  			  res.end(tag.ad);
						  		} else {
						  		  //send default creative since no passback found in mysql
						  		  console.log('11a:app.get:No passback found in MySQL');
								  res.writeHead(200,{'Content-type':'text/html'});
								  var def_id = size;
								  connection.get(def_id,function(result) {
										if (result.success && result.data) {
											console.log('11b:app.get:Found default in memcached');
											res.end(result.data);  
										} else {
											console.log('11c:app.get:Default not found in memcached');
											query = 'SELECT ad FROM passbacks WHERE pb_id = \'' + def_id + '\'';
											mysqlc.query(query,function(err,rows,fields) {
												if (err) {
												  console.log('12:app.get:Error from MySQL while searching for default creative:' + err.message);
												  res.end();
												} else if (rows[0]) {
												  console.log('12a:app.get:Found default in MySQL');
												  connection.set(def_id,rows[0].ad,function(result) {
										  			if (result.success) {
										  			  //console.log('app.get:Added default creative to memcached');
										  			} else {
										  			  console.log('13:app.get:Couldn\'t add default creative to memcached');
										  			}
										  		  });
												  res.end(rows[0].ad);
												} else {
												  console.log('14:app.get:No default creative found for ' + def_id);
												  res.end();
												}
											});
										}
								  });
						  		}     // end if err
						  	});       // end of mysql.query for passback
				    	}     // end if result.success
				    });       // end connection.get for passback
				  }           // end of if err for mysql query
				});           // end of mysql.query for tag
			  } else {
			  	  //need to do something about the mysql connection...can't keep running like this...
				  console.log('16:app.get:No MySQL connection');
				  res.writeHead(200,{'Content-type':'text/html'});
				  res.end();
			  }   // end if mysqlc
			} 	  // end of result.success for get ad
		  }); 	  // end of connection.get for get ad
		} else {
		  //maybe search MySQL...though it ads a ton of code...
		  console.log('17:app.get:No Memcached connection');
		  res.writeHead(200,{'Content-type':'text/html'});
		  res.end();
		} // end of if connection checking for memcached connection
	  } else {
	  	  //malformed request...send default creative
		  console.log('18:app.get:Problem with request');
		  res.writeHead(200,{'Content-type':'text/html'});
		  var def_id = size;
		  connection.get(def_id,function(result) {
			if (result.success && result.data) {
				res.end(result.data);  
			} else {
				if(mysqlc) {
					query = 'SELECT ad FROM passbacks WHERE pb_id = \'' + def_id + '\'';
					mysqlc.query(query,function(err,rows,fields) {
						if (err) {
						  console.log('19:app.get:Error from MySQL while searching for default creative:' + err.message);
						  res.end();
						} else if (rows[0]) {
						  if (connection) {
							  connection.set(def_id,rows[0].ad,function(result) {
					  			if (result.success) {
					  			  //console.log('app.get:Added default creative to memcached');
					  			} else {
					  			  console.log('20:app.get:Couldn\'t add default creative to memcached');
					  			}
					  		  });
						  }
						  res.end(rows[0].ad);
						} else {
						  console.log('21:app.get:No default creative found for ' + def_id);
						  res.end();
						}
					});
				} else {
					console.log('22:app.get:No MySQL connection');
					res.end();
				}
			}
		  });
	  } // end of if host
	}); // end of app.get

	http.createServer(app).listen(app.get('port'), function(){
	  console.log("Express server listening on port " + app.get('port'));
	});

} //end of cluster if then
