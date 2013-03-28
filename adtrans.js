
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

	//not sure what this is or why it is necessary...leaving it in
	app.configure('development', function(){
	  app.use(express.errorHandler());
	});

	var connection = new memcached('localhost', 11211);

	var mysqlc = mysql.createConnection({
	  host:'127.0.0.1',
	  user:'attakmule',
	  database:'ads',
	  password:'Not4u2!',
	});
	var mysql_connected = 1;
	mysqlc.connect(function(err) {
		if (err) {
			console.log('MySQL connection failed:' + err.message);
			mysql_connected = 0;
		}
	});

	var basetag = '<script type="text/javascript">var ados = ados || {};ados.run = ados.run || [];ados.run.push(function() {ados_setDomain(\'engine.localyokelmedia.com\');_KEYWORDS_ados_addInlinePlacement(4413, _SITEID_, _SIZE_)_SETZONE_.setClickUrl(\'-optional-click-macro-\').loadInline();});</script><script type="text/javascript" src="http://static.localyokelmedia.com/ados.js"></script>';

	function default_ad(size,basetag) {
		var new_adtag = basetag;
		new_adtag = new_adtag.replace(/_SIZE_/,size);
		new_adtag = new_adtag.replace(/_KEYWORDS_/,"");
		new_adtag = new_adtag.replace(/_SITEID_/,"28036");
		new_adtag = new_adtag.replace(/_SETZONE_/,"");
		return new_adtag;
	}

	app.get('/', function(req,res) {
	  res.writeHead(200,{'Content-type':'text/html'});
	  res.end();
	});

	app.get('/index.html', function(req,res) {
	  res.writeHead(200,{'Content-type':'text/html'});
	  res.end();
	});

	// get the lymuads.js file from the server
	app.get('/lymads.js',function(req,res) {
        fs.readFile('./lymads.js',function(error,content) {
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
	app.get('/ntest.html',function(req,res) {
        fs.readFile('./ntest.html',function(error,content) {
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
        var size    = req.query.size;
	    var adpos   = req.query.adpos;
	    var keys    = req.query.keys;
	    var ref     = req.query.ref;
	    var garbage = 0;

	    //This is the thread id for logging purposes
	    var tid = Math.floor(Math.random()*100);

	    // aid is the ad id and is only numeric
	    var aid = req.query.aid;
	    if (isNaN(aid)) {
	  		console.log(tid+':1:Bad aid:'+aid);
	  		//send default creative
	  		var new_adtag = default_ad(size,basetag);
			res.writeHead(200,{'Content-type':'text/html'});
			res.end(new_adtag);
	    } else {
	    	var host = ref.replace(/^http:\/\//im,"");
	    	host = host.replace(/^www\./im,"");
	    	host = host.replace(/^([^\/]+).*?$/im,"$1");
	    	var hkey = "WL:" + host;
	    	//first check to see if it is a whitelisted URL
	    	if (connection) {
		    	connection.get(hkey,function(result) {
		    		if (result.success && result.data) {
		    			//now check for its memcache aid entry
					    console.log(tid+':2:' + host + ' is whitelisted');
					    connection.get(aid, function(result) {
						  	if (result.success && result.data) {
						  		console.log(tid + ':3:' + aid + ' found in memcached');
						  		var aid_data   = result.data.split(":");
						  		if (aid_data.length > 2) {
						    		var siteid = aid_data[0];
							  		var zoneid = aid_data[1];
							  		var apos   = aid_data[2];

							  		var new_adtag = basetag;
						  			new_adtag = new_adtag.replace(/_SIZE_/,size);

							  		if (!apos && adpos) {
							  			apos = adpos;
							  		} else if (!apos && !adpos) {
							  			apos = 'atf';
							  		}

							  		if (keys) {
								  		keys = keys.replace(/["']+/g,"");
								  		keys = keys + ',' + apos;
								  	} else {
								  		keys = apos;
								  	}
								  	new_adtag = new_adtag.replace(/_KEYWORDS_/,"ados_setKeywords('" + keys + "');");

							  		if (!siteid) {
							  			garbage = 1;
							  		} else {
							  			new_adtag = new_adtag.replace(/_SITEID_/im,siteid);
							  		}

							  		if (!zoneid) {
							  			console.log(tid + ':4:No zoneid defined');
							  			//do we check paths at this point?
							  			//if we store all zones for an aid, then we just replace _SETZONE_ with nothing, right?
							  			new_adtag = new_adtag.replace(/_SETZONE_/im,"");
							  		} else {
							  			//check to see if there is more than one zone
							  			console.log(tid + ':5a:zoneid:' + zoneid);
							  			var zones = zoneid.split(",");
							  			if (zones.length == 1) {
							  				console.log(tid + ':5b:Just one zoneid');
							  				new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + zoneid + ")");
							  			} else {
							  				console.log(tid + ':5c:More than one zoneid');
							  				ref = ref.replace(/^http:\/\//im,"");
							  				ref = ref.replace(/^www\./im,"");
							  				var elements = ref.split("/");
							  				var path = "/";
							  				console.log(tid + ':5c.a:' + elements.length);
							  				var j = 0;
							  				var nodes = new Array();
							  				for (var i=0; i < elements.length; i++) {
							  					console.log(tid + ':5c.a:' + elements[i]);
							  					path = path + elements[i] + '/';
							  					nodes[i] = path;
							  					console.log(tid + ':5c.ab:' + nodes[i]);
							  				}
							  				var done = 0;
							  				for (var i=nodes.length -1; i >= 0; i--) {
							  					console.log(tid + ':5c.b:' + nodes[i]);
							  					connection.get(nodes[i], function(result) {
							  						if (result.success && result.data) {
							  							console.log(tid + ':5d:' + nodes[i] + ' has zoneid');
							  							done = 1;
							  							zoneid = result.data;
							  							new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + zoneid + ")");
							  						} else {
							  							var query = 'SELECT zoneid FROM sitezones WHERE url=\'' + nodes[i] + '\'';
							  							mysqlc.query(query,function(err,rows,fields) {
							  								if (err || !rows[0]) {
							  									//no zoned in mysql...
							  								} else {
							  									console.log(tid + ':5d.a:' + nodes[i] + ' has zoneid:' + rows[0].zoneid);
							  									done = 1;
							  									new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + rows[0].zoneid + ")");
							  									connection.set(nodes[i],rows[0].zoneid,function(result) {
							  										if (result.success) {
							  											console.log(tid + ':5d.b:Added path/zone to memcached');
							  										} else {
							  											console.log(tid + ':5d.c:Couldn\'t add path/zone to memcached');
							  										}
							  									});
							  								}
							  							});
							  						}
							  					});
							  					if (done == 1) break;
							  				}
							  				if (!done) {
							  					console.log(tid + ':5e:No zoneid defined');
							  					//the aid had more than one zone, but none applied to the ref
							  					//use no zone
							  					new_adtag = new_adtag.replace(/_SETZONE_/im,"");
							  				}
							  			}
							  		}
							  		console.log(tid + ':5f:Writing ad');
							    	res.writeHead(200,{'Content-type':'text/html'});
							    	res.end(new_adtag);
							    } else {
							    	console.log(tid + ':6:Invalid aid data' + result.data + ', Writing ad(default)');
							    	var new_adtag = default_ad(size,basetag);
							    	res.writeHead(200,{'Content-type':'text/html'});
							    	res.end(new_adtag);
							    }
						  	} else {
						  		console.log(tid + ':7:' + aid + ' not found in memcached');
						  		if (mysql_connected) {
							  		var query = "SELECT info FROM aid_info WHERE aid = " + aid;
							  		mysqlc.query(query,function(err,rows,fields) {
							  			if (err || !rows[0]) {
							  				console.log(tid + ':8:' + aid + ' not found in MySQL...Writing ad(default)');
											//send default creative
											var new_adtag = default_ad(size,basetag);
											res.writeHead(200,{'Content-type':'text/html'});
											res.end(new_adtag);
							  			} else {
							  				console.log(tid + ':9:' + aid + ' found in MySQL');
							  				connection.set(aid, rows[0].info, function(result) {
							  					if (result.success) {
							  						//worked
							  					} else {
							  						//didn't work
							  					}
							  				});
							  				var aid_data = rows[0].info.split(":");
									  		if (aid_data.length > 2) {
									  			console.log(tid + ':9a:aid_data:' + rows[0].info + ' is good');
									    		var siteid = aid_data[0];
										  		var zoneid = aid_data[1];
										  		var apos   = aid_data[2];
										  		
										  		var new_adtag = basetag;
									  			new_adtag = new_adtag.replace(/_SIZE_/,size);

										  		if (!apos && adpos) {
										  			apos = adpos;
										  		} else if (!apos && !adpos) {
										  			apos = 'atf';
										  		}

										  		if (keys) {
											  		keys = keys.replace(/["']+/g,"");
											  		keys = keys + ',' + apos;
											  	} else {
											  		keys = apos;
											  	}
											  	new_adtag = new_adtag.replace(/_KEYWORDS_/,"ados_setKeywords('" + keys + "');");

										  		if (!siteid) {
										  			garbage = 1;
										  		} else {
										  			new_adtag = new_adtag.replace(/_SITEID_/im,siteid);
										  		}

										  		if (!zoneid) {
										  			//do we check paths at this point?
										  			//if we store all zones for an aid, then we just replace _SETZONE_ with nothing, right?
										  			console.log(tid + ':9b:No zoneid');
										  			new_adtag = new_adtag.replace(/_SETZONE_/im,"");
										  		} else {
										  			//check to see if there is more than one zone
										  			console.log(tid + ':9c:zoneid:' + zoneid);
										  			var zones = zoneid.split(",");
										  			if (zones.length == 1) {
										  				console.log(tid + ':9d:Only one zone');
										  				new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + zoneid + ")");
										  			} else {
										  				console.log(tid + ':9e:More than one zone');
										  				ref = ref.replace(/^http:\/\//im,"");
										  				ref = ref.replace(/^www\./im,"");
										  				var elements = ref.split("/");
										  				var path = "/";
										  				console.log(tid + ':5c.a:' + elements.length);
										  				var j = 0;
										  				var nodes = new Array();
										  				for (var i=0; i < elements.length; i++) {
										  					console.log(tid + ':5c.a:' + elements[i]);
										  					path = path + elements[i] + '/';
										  					nodes[i] = path;
										  					console.log(tid + ':5c.ab:' + nodes[i]);
										  				}
										  				var done = 0;
										  				for (var i=nodes.length -1; i >= 0; i--) {
										  					connection.get(nodes[i], function(result) {
										  						if (result.success && result.data) {
										  							console.log(tid + ':9f:' + nodes[i] + ' has zone ' + result.data);
										  							done = 1;
										  							zoneid = result.data;
										  							new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + zoneid + ")");
										  						} else {
										  							var query = 'SELECT zoneid FROM sitezones WHERE url=\'' + nodes[i] + '\'';
										  							mysqlc.query(query,function(err,rows,fields) {
										  								if (err || !rows[0]) {
										  									//no zoned in mysql...
										  								} else {
										  									console.log(tid + ':9f.a:' + nodes[i] + ' has zoneid:' + rows[0].zoneid);
										  									done = 1;
										  									new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + rows[0].zoneid + ")");
										  									connection.set(nodes[i],rows[0].zoneid,function(result) {
										  										if (result.success) {
										  											console.log(tid + '9f.b:Added path/zone to memcached');
										  										} else {
										  											console.log(tid + '9f.c:Couldn\'t add path/zone to memcached');
										  										}
										  									});
										  								}
										  							});
										  						}
										  					});
										  					if (done == 1) break;
										  				}
										  				if (!done) {
										  					//the aid had more than one zone, but none applied to the ref
										  					//use no zone
										  					console.log(tid + ':9g:No zoneid');
										  					new_adtag = new_adtag.replace(/_SETZONE_/im,"");
										  				}
										  			}
										  		}
										  		console.log(tid + ':9h:Writing ad');
										    	res.writeHead(200,{'Content-type':'text/html'});
										    	res.end(new_adtag);
										    } else {
										    	//send default creative
										    	console.log(tid + ':10:aid_data:' + rows[0].info + ' is malformed...Writing ad(default)');
										    	var new_adtag = default_ad(size,basetag);
												res.writeHead(200,{'Content-type':'text/html'});
												res.end(new_adtag);
										    } // end if aid_data.length > 0
							  			} // end if have mysql results for aid
							  		}); // end mysql get aid
								} else {
									//no mysql connection...
									console.log(tid + ':10a:No MySQL connection...Writing ad(default)');
									var new_adtag = default_ad(size,basetag);
									res.writeHead(200,{'Content-type':'text/html'});
									res.end(new_adtag);
								} // end if mysqlc for mysql get aid_info
						  	} // end if result.success for connection.get aid
					    }); // end connection.get aid
					} else { // if result.success for connection.get hkey else for no results
						//check mysql to see if site is whitelisted
						console.log(tid + ':11:' +  host + ' not whitelisted in memcached');
						if (mysql_connected) {
							var query = 'SELECT flag FROM whitelist WHERE host = \'' + host + '\'';
							mysqlc.query(query,function(err,rows,fields) {
								if (rows[0]) {
									console.log(tid + ':12:' + host + ' is whitelisted in MySQL');
									//site is whitelisted...go through the whole routine
									connection.set(hkey,'1',function(result) {
										if (result.success) {
											//added whitelist for host to memcache
										}
									});

					    			//now check for its memcache aid entry
								    connection.get(aid, function(result) {
									  	if (result.success && result.data) {
									  		console.log(tid + ':13:' + aid + ' found in memcached');
									  		var aid_data   = result.data.split(":");
									  		if (aid_data.length > 2) {
									  			console.log(tid + ':13a:aid_data ' + result.data + ' is good');
									    		var siteid = aid_data[0];
										  		var zoneid = aid_data[1];
										  		var apos   = aid_data[2];

										  		var new_adtag = basetag;
									  			new_adtag = new_adtag.replace(/_SIZE_/,size);

										  		if (!apos && adpos) {
										  			apos = adpos;
										  		} else if (!apos && !adpos) {
										  			apos = 'atf';
										  		}

										  		if (keys) {
											  		keys = keys.replace(/["']+/g,"");
											  		keys = keys + ',' + apos;
											  	} else {
											  		keys = apos;
											  	}
											  	new_adtag = new_adtag.replace(/_KEYWORDS_/,"ados_setKeywords('" + keys + "');");

										  		if (!siteid) {
										  			garbage = 1;
										  		} else {
										  			new_adtag = new_adtag.replace(/_SITEID_/im,siteid);
										  		}

										  		if (!zoneid) {
										  			//do we check paths at this point?
										  			//if we store all zones for an aid, then we just replace _SETZONE_ with nothing, right?
										  			console.log(tid + ':13b:No zoneid');
										  			new_adtag = new_adtag.replace(/_SETZONE_/im,"");
										  		} else {
										  			//check to see if there is more than one zone
										  			console.log(tid + ':13c:zoneid:' + zoneid);
										  			var zones = zoneid.split(",");
										  			if (zones.length == 1) {
										  				console.log(tid + ':13d:Only one zoneid');
										  				new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + zoneid + ")");
										  			} else {
										  				console.log(tid + ':13e:Multiple zoneids')
										  				ref = ref.replace(/^http:\/\//im,"");
										  				ref = ref.replace(/^www\./im,"");
										  				var elements = ref.split("/");
										  				var path = "/";
										  				console.log(tid + ':5c.a:' + elements.length);
										  				var j = 0;
										  				var nodes = new Array();
										  				for (var i=0; i < elements.length; i++) {
										  					console.log(tid + ':5c.a:' + elements[i]);
										  					path = path + elements[i] + '/';
										  					nodes[i] = path;
										  					console.log(tid + ':5c.ab:' + nodes[i]);
										  				}
										  				var done = 0;
										  				for (var i=nodes.length -1; i >= 0; i--) {
										  					connection.get(nodes[i], function(result) {
										  						if (result.success && result.data) {
										  							console.log(tid + ':13f:' + nodes[i] + ' has zoneid ' + result.data);
										  							done = 1;
										  							zoneid = result.data;
										  							new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + zoneid + ")");
										  						} else {
									  								var query = 'SELECT zoneid FROM sitezones WHERE url=\'' + nodes[i] + '\'';
										  							mysqlc.query(query,function(err,rows,fields) {
										  								if (err || !rows[0]) {
										  									//no zoned in mysql...
										  								} else {
										  									console.log(tid + ':13f.a:' + nodes[i] + ' has zoneid:' + rows[0].zoneid);
										  									done = 1;
										  									new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + rows[0].zoneid + ")");
										  									connection.set(nodes[i],rows[0].zoneid,function(result) {
										  										if (result.success) {
										  											console.log(tid + ':13f.b:Added path/zone to memcached');
										  										} else {
										  											console.log(tid + ':13f.c:Couldn\'t add path/zone to memcached');
										  										}
										  									});
										  								}
										  							});
										  						}
										  					});
										  					if (done == 1) break;
										  				}
										  				if (!done) {
										  					//the aid had more than one zone, but none applied to the ref
										  					//use no zone
										  					console.log(tid + ':13g:No zoneid');
										  					new_adtag = new_adtag.replace(/_SETZONE_/im,"");
										  				}
										  			}
										  		}
										  		console.log(tid + ':13h:Writing ad');
										    	res.writeHead(200,{'Content-type':'text/html'});
										    	res.end(new_adtag);
										    } else {  // if aid_data.length > 2
										    	// we don't have good data to work with, send default
										    	//send default creative
										    	console.log(tid + ':14:aid_data malformed...Writing ad(default)');
										    	var new_adtag = default_ad(size,basetag);
												res.end(new_adtag);
										    } // end if aid_data.length > 0
									  	} else { // if result.success for connection.get aid
									  		console.log(tid + ':15:' + aid + ' not found in memcache');
									  		var query = "SELECT info FROM aid_info WHERE aid = " + aid;
									  		mysqlc.query(query,function(err,rows,fields) {
									  			if (err || !rows[0]) {
									  				console.log(tid + ':15a:' + aid + 'not found in MySQL...Writing ad(default)');
													//send default creative
													var new_adtag = default_ad(size,basetag);
													res.writeHead(200,{'Content-type':'text/html'});
													res.end(new_adtag);
									  			} else {
									  				console.log(tid + ':15b:' + aid + ' found in MySQL');
									  				connection.set(aid, rows[0].info, function(result) {
									  					if (result.success) {
									  						//worked
									  					} else {
									  						//didn't work
									  					}
									  				});
									  				var aid_data = rows[0].info.split(":");
											  		if (aid_data.length > 2) {
											  			console.log(tid + ':15c:aid_data:' + rows[0].info + ' is good');
											    		var siteid = aid_data[0];
												  		var zoneid = aid_data[1];
												  		var apos   = aid_data[2];

												  		var new_adtag = basetag;
											  			new_adtag = new_adtag.replace(/_SIZE_/,size);

												  		if (!apos && adpos) {
												  			apos = adpos;
												  		} else if (!apos && !adpos) {
												  			apos = 'atf';
												  		}

												  		if (keys) {
													  		keys = keys.replace(/["']+/g,"");
													  		keys = keys + ',' + apos;
													  	} else {
													  		keys = apos;
													  	}
													  	new_adtag = new_adtag.replace(/_KEYWORDS_/,"ados_setKeywords('" + keys + "');");

												  		if (!siteid) {
												  			garbage = 1;
												  		} else {
												  			new_adtag = new_adtag.replace(/_SITEID_/im,siteid);
												  		}

												  		if (!zoneid) {
												  			//do we check paths at this point?
												  			//if we store all zones for an aid, then we just replace _SETZONE_ with nothing, right?
												  			console.log(tid + ':15d:No zoneid');
												  			new_adtag = new_adtag.replace(/_SETZONE_/im,"");
												  		} else {
												  			console.log(tid + ':15e:zoneid:' + zoneid);
												  			//check to see if there is more than one zone
												  			var zones = zoneid.split(",");
												  			if (zones.length == 1) {
												  				console.log(tid + ':15f:One zoneid');
												  				new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + zoneid + ")");
												  			} else {
												  				console.log(tid + ':15g:Multiple zoneids');
												  				ref = ref.replace(/^http:\/\//im,"");
												  				ref = ref.replace(/^www\./im,"");
												  				var elements = ref.split("/");
												  				var path = "/";
												  				console.log(tid + ':5c.a:' + elements.length);
												  				var j = 0;
												  				var nodes = new Array();
												  				for (var i=0; i < elements.length; i++) {
												  					console.log(tid + ':5c.a:' + elements[i]);
												  					path = path + elements[i] + '/';
												  					nodes[i] = path;
												  					console.log(tid + ':5c.ab:' + nodes[i]);
												  				}
												  				var done = 0;
												  				for (var i=nodes.length -1; i >= 0; i--) {
												  					connection.get(nodes[i], function(result) {
												  						if (result.success && result.data) {
												  							console.log(tid + ':15h:' + nodes[i] + ' has zoneid:' + result.data);
												  							done = 1;
												  							zoneid = result.data;
												  							new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + zoneid + ")");
												  						} else {
												  							var query = 'SELECT zoneid FROM sitezones WHERE url=\'' + nodes[i] + '\'';
												  							mysqlc.query(query,function(err,rows,fields) {
												  								if (err || !rows[0]) {
												  									//no zoned in mysql...
												  								} else {
												  									console.log(tid + ':15h.a:' + nodes[i] + ' has zoneid:' + rows[0].zoneid);
												  									done = 1;
												  									new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + rows[0].zoneid + ")");
												  									connection.set(nodes[i],rows[0].zoneid,function(result) {
												  										if (result.success) {
												  											console.log(tid + ':15h.b:Added path/zone to memcached');
												  										} else {
												  											console.log(tid + ':15h.c:Couldn\'t add path/zone to memcached');
												  										}
												  									});
												  								}
												  							});
												  						}
												  					});
												  					if (done == 1) break;
												  				}
												  				if (!done) {
												  					console.log(tid + ':15i:No zoneid');
												  					//the aid had more than one zone, but none applied to the ref
												  					//use no zone
												  					new_adtag = new_adtag.replace(/_SETZONE_/im,"");
												  				}
												  			}
												  		}
												  		console.log(tid + ':15j:Writing ad');
												    	res.writeHead(200,{'Content-type':'text/html'});
												    	res.end(new_adtag);
												    } else { // if aid_data.length > 0
												    	//send default creative
												    	console.log(tid + ':15j:Malformed aid_data:' + rows[0].info + ', Writing ad(default)');
												    	var new_adtag = default_ad(size,basetag);
														res.writeHead(200,{'Content-type':'text/html'});
														res.end(new_adtag);
												    } // end if aid_data.length > 0
									  			} // end if have mysql results for aid
									  		}); // end mysql get aid
									  	} // end if result.success for connection.get aid
								    }); // end connection.get aid	
								} else { // if rows[0] else for mysql whitelist query
									//not whitelisted for sure...
									console.log(tid + ':16:' + host + ' not whitelisted in MySQL');
									var pbkey = 'pb_' + aid;
									connection.get(pbkey, function(result) {
										if (result.success && result.data) {
											console.log(tid + ':16a:Found passback for ' + pbkey + ' in memcached...Writing ad');
											res.writeHead(200,{'Content-type':'text/html'});
											res.end(result.data);
										} else {
											console.log(tid + ':16b:No passback in memcached');
											var query = 'SELECT ad FROM passbacks WHERE pb_id=\'' + pbkey + '\'';
											console.log(tid + ':16b:pb_key:' + pbkey);
											mysqlc.query(query,function(err,rows,fields) {
												if (err || !rows[0]) {
													//either we have an error or no results...send default
													//send default creative
													console.log(tid + ':16d:Passback not found in MySQL...Writing ad(default)');
													var new_adtag = default_ad(size,basetag);
													res.writeHead(200,{'Content-type':'text/html'});
													res.end(new_adtag);
												} else {
													console.log(tid + ':16c:Found passback for ' + pbkey + ' in MySQL...sending');
													connection.set(pbkey,rows[0].ad,function(result) {
														if (result.success) {
															//added to memcache
														} else {
															//didn't add to memcache
														}
													});
													console.log(tid + ':16d:Writing ad');
													res.writeHead(200,{'Content-type':'text/html'});
													res.end(rows[0].ad);
												}
											}); // end mysql query passbacks
										} // end if result.success pbkey
									}); // end connection.get pbkey
								}  // end if rows[0]
							}); // end mysql query whitelist
						} else { // no mysqlc...send default
							console.log(tid + ':16e:No MySQL connection...Writing ad(default)');
							var new_adtag = default_ad(size,basetag);
							res.writeHead(200,{'Content-type':'text/html'});
							res.end(new_adtag);
						}
					} // end if result.success
				}); // end connection.get hkey
			} else { // else for if memcached connnection
				console.log(tid + ':17:No memcached connection...check MySQL');
				if (mysql_connected) {
					var query = 'SELECT flag FROM whitelist WHERE host = \'' + host + '\'';
					mysqlc.query(query,function(err,rows,fields) {
						if (err || !rows[0]) {
							//check passbacks
						} else {
							//we have whitelisted site...
							console.log(tid + ':17a:Site whitelisted in MySQL');
							var query = 'SELECT info FROM aid_info WHERE aid = ' + aid;
							mysqlc.query(query,function(err,rows,fields) {
								if (err || !rows[0]) {
									//send default creative
									console.log(tid + ':17b:aid not found in aid_info...Writing ad(default)');
									var new_adtag = default_ad(size,basetag);
									res.writeHead(200,{'Content-type':'text/html'});
									res.end(new_adtag);
								} else {
									//process request for aid

					  				console.log(tid + ':17c:' + aid + ' found in MySQL');
					  				connection.set(aid, rows[0].info, function(result) {
					  					if (result.success) {
					  						//worked
					  					} else {
					  						//didn't work
					  					}
					  				});
					  				var aid_data = rows[0].info.split(":");
							  		if (aid_data.length > 2) {
							  			console.log(tid + ':17d:aid_data:' + rows[0].info + ' is good');
							    		var siteid = aid_data[0];
								  		var zoneid = aid_data[1];
								  		var apos   = aid_data[2];

								  		var new_adtag = basetag;
							  			new_adtag = new_adtag.replace(/_SIZE_/,size);

								  		if (!apos && adpos) {
								  			apos = adpos;
								  		} else if (!apos && !adpos) {
								  			apos = 'atf';
								  		}

								  		if (keys) {
									  		keys = keys.replace(/["']+/g,"");
									  		keys = keys + ',' + apos;
									  	} else {
									  		keys = apos;
									  	}
									  	new_adtag = new_adtag.replace(/_KEYWORDS_/,"ados_setKeywords('" + keys + "');");

								  		if (!siteid) {
								  			garbage = 1;
								  		} else {
								  			new_adtag = new_adtag.replace(/_SITEID_/im,siteid);
								  		}

								  		if (!zoneid) {
								  			//do we check paths at this point?
								  			//if we store all zones for an aid, then we just replace _SETZONE_ with nothing, right?
								  			console.log(tid + ':17e:No zoneid');
								  			new_adtag = new_adtag.replace(/_SETZONE_/im,"");
								  		} else {
								  			console.log(tid + ':17f:zoneid:' + zoneid);
								  			//check to see if there is more than one zone
								  			var zones = zoneid.split(",");
								  			if (zones.length == 1) {
								  				console.log(tid + ':17g:One zoneid');
								  				new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + zoneid + ")");
								  			} else {
								  				console.log(tid + ':17h:Multiple zoneids');
								  				ref = ref.replace(/^http:\/\//im,"");
								  				ref = ref.replace(/^www\./im,"");
								  				var elements = ref.split("/");
								  				var path = "/";
								  				console.log(tid + ':5c.a:' + elements.length);
								  				var j = 0;
								  				var nodes = new Array();
								  				for (var i=0; i < elements.length; i++) {
								  					console.log(tid + ':5c.a:' + elements[i]);
								  					path = path + elements[i] + '/';
								  					nodes[i] = path;
								  					console.log(tid + ':5c.ab:' + nodes[i]);
								  				}
								  				var done = 0;
								  				for (var i=nodes.length -1; i >= 0; i--) {
								  					connection.get(nodes[i], function(result) {
								  						if (result.success && result.data) {
								  							console.log(tid + ':17i:' + nodes[i] + ' has zoneid:' + result.data);
								  							done = 1;
								  							zoneid = result.data;
								  							new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + zoneid + ")");
								  						} else {
								  							var query = 'SELECT zoneid FROM sitezones WHERE url=\'' + nodes[i] + '\'';
								  							mysqlc.query(query,function(err,rows,fields) {
								  								if (err || !rows[0]) {
								  									//no zoned in mysql...
								  								} else {
								  									console.log(tid + ':17i.a:' + nodes[i] + ' has zoneid:' + rows[0].zoneid);
								  									done = 1;
								  									new_adtag = new_adtag.replace(/_SETZONE_/,".setZone(" + rows[0].zoneid + ")");
								  									connection.set(nodes[i],rows[0].zoneid,function(result) {
								  										if (result.success) {
								  											console.log(tid + ':17i.b:Added path/zone to memcached');
								  										} else {
								  											console.log(tid + ':17i.c:Couldn\'t add path/zone to memcached');
								  										}
								  									});
								  								}
								  							});
								  						}
								  					});
								  					if (done == 1) break;
								  				}
								  				if (!done) {
								  					console.log(tid + ':17j:No zoneid');
								  					//the aid had more than one zone, but none applied to the ref
								  					//use no zone
								  					new_adtag = new_adtag.replace(/_SETZONE_/im,"");
								  				}
								  			}
								  		}
								  		console.log(tid + ':17k:Writing ad');
								    	res.writeHead(200,{'Content-type':'text/html'});
								    	res.end(new_adtag);
								    } else { // if aid_data.length > 0
								    	//send default creative
								    	console.log(tid + ':17l:Malformed aid_data:' + rows[0].info + ', Writing ad(default)');
								    	var new_adtag = default_ad(size,basetag);
										res.writeHead(200,{'Content-type':'text/html'});
										res.end(new_adtag);
								    } // end if aid_data.length > 0
								} //end if err or no rows for aid_info
							}); //end if mysqlc.query for aid_info
						} //end if mysql error or no rows for whitelist
					}); // end of mysqlc.query for whitelist
				} else { // else for if mysql_connected
					//send default creative
					console.log(tid + ':17m:No MySQL connection...Writing ad(default)');
					var new_adtag = default_ad(size,basetag);
					res.writeHead(200,{'Content-type':'text/html'});
					res.end(new_adtag);
				} // end if mysqlc for whitelist query
			} // end if connection for memcached
	    }  // end if aid is not a number
	}); // end of app.get

	http.createServer(app).listen(app.get('port'), function(){
	  console.log("Express server listening on port " + app.get('port'));
	});

} //end of cluster if then
