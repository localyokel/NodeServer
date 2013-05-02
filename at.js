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
	  , swig = require('swig')
	  , atfunc = require('./lib/atfunc.js')
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

	var tag = '<script type="text/javascript">\
var ados = ados || {};\
ados.run = ados.run || [];\
ados.run.push(function() {\
_KEYWORDS_\
ados_addInlinePlacement(5598, _SITEID_, _SIZE_)_SETZONE_.setClickUrl("-optional-click-macro-").loadInline();\
});</script>\
<script type="text/javascript" src="http://static.adzerk.net/ados.js"></script>';

//	var basetag = '<script type="text/javascript">\
//	var ados = ados || {};\
//	ados.run = ados.run || [];\
//	ados.run.push(function() {\
//		ados_setDomain(\'engine.localyokelmedia.com\');\
//		_KEYWORDS_\
//		ados_addInlinePlacement(4413, _SITEID_, _SIZE_)_SETZONE_.setClickUrl(\'-optional-click-macro-\').loadInline();\
//	});</script><script type="text/javascript" src="http://static.localyokelmedia.com/ados.js"></script>';

	
	app.get('/', function(req,res) {
	  res.writeHead(200,{'Content-type':'text/html'});
	  res.end();
	});

	app.get('/index.html', function(req,res) {
	  res.writeHead(200,{'Content-type':'text/html'});
	  res.end();
	});

	app.get('/help', function(req,res) {
		var key = req.query.key;
		if (key === undefined || key != 'attakmule') {
			res.writeHead(200,{'Content-type':'text/html'});
			res.end();
		} else {
			var tmpl = swig.compileFile(__dirname + '/templates/help.html');
	        var renderedHtml = tmpl.render({});
	        res.writeHead(200,{'Content-type':'text/html'});
	        res.end(renderedHtml);
	    }
	});

	// get the lymuads.js file from the server
	app.get('/lymads.js',function(req,res) {
        fs.readFile('./static/lymads.js',function(error,content) {
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

	app.get('/lymads.js.src.js',function(req,res) {
        fs.readFile('./static/lymads.js.src.js',function(error,content) {
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

    app.get('/lymnads.js',function(req,res) {
        fs.readFile('./static/lymnads.js',function(error,content) {
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
        fs.readFile('./static/ntest.html',function(error,content) {
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
	    var type    = req.query.type;
	    var garbage = 0;

	    var basetag;
	    console.log("TYPE:" + type);
	    if (type == "iframe") {
	    	basetag = tag;
	    } else {
	    	basetag = 'document.write(\'' + tag + '\');';
	    }

	    //This is the thread id for logging purposes
	    var tid = Math.floor(Math.random()*100);

	    if (ref == undefined) {
	    	ref = 'http://test.localyokelmedia.com';
	    }
		var host = ref.replace(/^http:\/\//im,"");
	    host = host.replace(/^www\./im,"");
	    host = host.replace(/^([^\/]+).*?$/im,"$1");

	    // aid is the ad id and is only numeric
	    var aid = req.query.aid;
	    if (isNaN(aid)) {
	  		console.log(tid + ':1:' + aid + ':' + host + '::Invalid aid:Sending Default');
	  		//send default creative
	  		var new_adtag = atfunc.default_ad(size,basetag);
			res.writeHead(200,{'Content-type':'text/html'});
			res.end(new_adtag);
	    } else {
	    	
	    	var hkey = "WL:" + host;
	    	//first check to see if it is a whitelisted URL
	    	if (connection) {
		    	connection.get(hkey,function(result) {
		    		if (result.success && result.data) {
		    			//now check for its memcache aid entry
					    //console.log(tid+':2:' + host + ' is whitelisted');
					    connection.get(aid, function(result) {
						  	if (result.success && result.data) {
						  		//console.log(tid + ':3:' + aid + ' found in memcached');
						  		var aid_data   = result.data.split(":");
						  		if (aid_data.length > 2) {
									var new_adtag = basetag;
						  			
						  			new_adtag = atfunc.setup(aid_data,new_adtag,adpos,keys,size,req,res);

							  		new_adtag = atfunc.zones(aid_data,new_adtag,connection,mysqlc,tid);
							  		res.writeHead(200,{'Content-type':'text/html'});
							  		res.end(new_adtag);
							    } else {
							    	console.log(tid + ':6:' + aid + ':' + host + ':' + result.data + ':Invalid aid data:Sending Default');
							    	var new_adtag = atfunc.default_ad(size,basetag);
							    	res.writeHead(200,{'Content-type':'text/html'});
							    	res.end(new_adtag);
							    }
						  	} else {
						  		//console.log(tid + ':7:' + aid + ' not found in memcached');
						  		if (mysql_connected) {
							  		var query = "SELECT info FROM aid_info WHERE aid = " + aid;
							  		mysqlc.query(query,function(err,rows,fields) {
							  			if (err || !rows[0]) {
							  				console.log(tid + ':8:' + aid + ':' + host + ':' + err + ':aid not found in MySQL or error:Sending Default');
											//send default creative
											var new_adtag = atfunc.default_ad(size,basetag);
											res.writeHead(200,{'Content-type':'text/html'});
											res.end(new_adtag);
							  			} else {
							  				//console.log(tid + ':9:' + aid + ' found in MySQL');
							  				connection.set(aid, rows[0].info, function(result) {
							  					if (result.success) {
							  						//worked
							  					} else {
							  						//didn't work
							  					}
							  				});
							  				var aid_data = rows[0].info.split(":");
									  		if (aid_data.length > 2) {
									  			var new_adtag = basetag;
									  			new_adtag = atfunc.setup(aid_data,new_adtag,adpos,keys,size,req,res);
									    		
										  		new_adtag = atfunc.zones(aid_data,new_adtag,connection,mysqlc,tid);
										  		res.writeHead(200,{'Content-type':'text/html'});
												res.end(new_adtag);
										    } else {
										    	//send default creative
										    	console.log(tid + ':9:' + aid + ':' + host + ':' + rows[0].info + ':Invalid aid data:Sending Default');
										    	var new_adtag = default_ad(size,basetag);
												res.writeHead(200,{'Content-type':'text/html'});
												res.end(new_adtag);
										    } // end if aid_data.length > 0
							  			} // end if have mysql results for aid
							  		}); // end mysql get aid
								} else {
									//no mysql connection...
									console.log(tid + ':10a:No MySQL connection...Sending default');
									var new_adtag = atfunc.default_ad(size,basetag);
									res.writeHead(200,{'Content-type':'text/html'});
									res.end(new_adtag);
								} // end if mysqlc for mysql get aid_info
						  	} // end if result.success for connection.get aid
					    }); // end connection.get aid
					} else { // if result.success for connection.get hkey else for no results
						//check mysql to see if site is whitelisted
						//console.log(tid + ':11:' +  host + ' not whitelisted in memcached');
						if (mysql_connected) {
							var query = 'SELECT flag FROM whitelist WHERE host = \'' + host + '\'';
							mysqlc.query(query,function(err,rows,fields) {
								if (rows[0]) {
									//console.log(tid + ':12:' + host + ' is whitelisted in MySQL');
									//site is whitelisted...go through the whole routine
									connection.set(hkey,'1',function(result) {
										if (result.success) {
											//added whitelist for host to memcache
										}
									});

					    			//now check for its memcache aid entry
								    connection.get(aid, function(result) {
									  	if (result.success && result.data) {
									  		//console.log(tid + ':13:' + aid + ' found in memcached');
									  		var aid_data   = result.data.split(":");
									  		if (aid_data.length > 2 && aid_data[0] != "") {
									  			var new_adtag = basetag;
									  			new_adtag = atfunc.setup(aid_data,new_adtag,adpos,keys,size,req,res);
			
										  		new_adtag = atfunc.zones(aid_data,new_adtag,connection,mysqlc,tid);
												res.writeHead(200,{'Content-type':'text/html'});
												res.end(new_adtag);
										    } else {  // if aid_data.length > 2
										    	// we don't have good data to work with, send default
										    	//send default creative
										    	console.log(tid + ':14:' + aid + ':' + host + ':' + result.data + ':Invalid aid data:Sending Default');
										    	var new_adtag = atfunc.default_ad(size,basetag);
												res.end(new_adtag);
										    } // end if aid_data.length > 0
									  	} else { // if result.success for connection.get aid
									  		//console.log(tid + ':15:' + aid + ' not found in memcache');
									  		var query = "SELECT info FROM aid_info WHERE aid = " + aid;
									  		mysqlc.query(query,function(err,rows,fields) {
									  			if (err || !rows[0]) {
									  				console.log(tid + ':15a:' + aid + ':' + host + ':' + err + ':aid not found in MySQL or error:Sending Default'); 
									  				var new_adtag = atfunc.default_ad(size,basetag);
													res.writeHead(200,{'Content-type':'text/html'});
													res.end(new_adtag);
									  			} else {
									  				//console.log(tid + ':15b:' + aid + ' found in MySQL');
									  				connection.set(aid, rows[0].info, function(result) {
									  					if (result.success) {
									  						//worked
									  					} else {
									  						//didn't work
									  					}
									  				});
									  				var aid_data = rows[0].info.split(":");
											  		if (aid_data.length > 2 && aid_data[0] != "") {
											  			var new_adtag = basetag;
											  			new_adtag = atfunc.setup(aid_data,new_adtag,adpos,keys,size,req,res);

												  		new_adtag = atfunc.zones(aid_data,new_adtag,connection,mysqlc,tid);
														res.writeHead(200,{'Content-type':'text/html'});
														res.end(new_adtag);
												    } else { // if aid_data.length > 0
												    	//send default creative
												    	console.log(tid + ':15j:' + aid + ':' + host + ':' + rows[0].info + ':Invalid aid data:Sending Default');
												    	var new_adtag = atfunc.default_ad(size,basetag);
														res.writeHead(200,{'Content-type':'text/html'});
														res.end(new_adtag);
												    } // end if aid_data.length > 0
									  			} // end if have mysql results for aid
									  		}); // end mysql get aid
									  	} // end if result.success for connection.get aid
								    }); // end connection.get aid	
								} else { // if rows[0] else for mysql whitelist query
									//not whitelisted for sure...
									console.log(tid + ':16:' + aid + ':' + host + '::Not whitelisted in MySQL');
									var pbkey = 'pb_' + aid;
									connection.get(pbkey, function(result) {
										if (result.success && result.data) {
											//console.log(tid + ':16a:Found passback for ' + pbkey + ' in memcached...Writing ad');
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
													console.log(tid + ':16d:' + aid + ':' + host + '::Passback not found in MySQL:Sending Default');
													var new_adtag = atfunc.default_ad(size,basetag);
													res.writeHead(200,{'Content-type':'text/html'});
													res.end(new_adtag);
												} else {
													//console.log(tid + ':16c:Found passback for ' + pbkey + ' in MySQL...sending');
													connection.set(pbkey,rows[0].ad,function(result) {
														if (result.success) {
															//added to memcache
														} else {
															//didn't add to memcache
														}
													});
													//console.log(tid + ':16d:Writing ad');
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
							var new_adtag = atfunc.default_ad(size,basetag);
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
							console.log(tid+':17a:' + aid + ':' + host + '::Not whitelisted in MySQL:Sending Default');
							var new_adtag = atfunc.default_ad(size,basetag);
							res.writeHead(200,{'Content-type':'text/html'});
							res.end(new_adtag);
						} else {
							//we have whitelisted site...
							//console.log(tid + ':17a:Site whitelisted in MySQL');
							var query = 'SELECT info FROM aid_info WHERE aid = ' + aid;
							mysqlc.query(query,function(err,rows,fields) {
								if (err || !rows[0]) {
									//send default creative
									console.log(tid + ':17b:' + aid + ':' + host + ':' + err + ':aid not found in MySQL or error::Sending Default');
									var new_adtag = atfunc.default_ad(size,basetag);
									res.writeHead(200,{'Content-type':'text/html'});
									res.end(new_adtag);
								} else {
					  				var aid_data = rows[0].info.split(":");
							  		if (aid_data.length > 2) {
							  			//console.log(tid + ':17c:' + aid + ' found in MySQL');
					  					connection.set(aid, rows[0].info, function(result) {
					  						if (result.success) {
					  							//worked
					  						} else {
					  							//didn't work
					  						}
					  					});
							  			var new_adtag = basetag;
							  			new_adtag = atfunc.setup(aid_data,new_adtag,adpos,keys,size,req,res);
								  		new_adtag = atfunc.zones(aid_data,new_adtag,connection,mysqlc,tid);
										res.writeHead(200,{'Content-type':'text/html'});
										res.end(new_adtag);
								    } else { // if aid_data.length > 0
								    	//send default creative
								    	console.log(tid + ':17l:' + aid + ':' + host + ':' + rows[0].info + ':Invalid aid data:Sending Default');
								    	var new_adtag = atfunc.default_ad(size,basetag);
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
					var new_adtag = atfunc.default_ad(size,basetag);
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
