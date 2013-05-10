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
	  , atfunc = require('./lib/atf.js')  //custom library that contains the atfunc.process function
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

	//this is the template for the ad tag that we are going to produce.  Note that
	//_SITEID_, _SIZE_, _SETZONE_, _KEYWORDS_, all get replaced before sending the tag
	var tag = '<script type="text/javascript">\
var ados = ados || {};\
ados.run = ados.run || [];\
ados.run.push(function() {\
_KEYWORDS_\
ados_addInlinePlacement(5598, _SITEID_, _SIZE_)_SETZONE_.setClickUrl("-optional-click-macro-").loadInline();\
});</script>\
<script type="text/javascript" src="http://static.adzerk.net/ados.js"></script>';


	//we send empty values for / and index.html	
	app.get('/', function(req,res) {
	  res.writeHead(200,{'Content-type':'text/html'});
	  res.end();
	});

	app.get('/index.html', function(req,res) {
	  res.writeHead(200,{'Content-type':'text/html'});
	  res.end();
	});

	//to see the help page load /help?key=attakmule
	app.get('/help', function(req,res) {
		var key = req.query.key;
		if (key != 'attakmule') {
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
        if (error) {
          res.writeHead(200,{'Content-type':'text/javascript'});
          res.end();
        } else {
          res.writeHead(200,{'Content-type':'text/javascript'});
          res.end(content,'utf-8');
        }
      });
    });

	app.get('/lymads.js.src.js',function(req,res) {
        fs.readFile('./static/lymads.js.src.js',function(error,content) {
	    //console.log('Request for lymuads.js');
        if (error) {
          res.writeHead(200,{'Content-type':'text/javascript'});
          res.end();
        } else {
          res.writeHead(200,{'Content-type':'text/javascript'});
          res.end(content,'utf-8');
        }
      });
    });

    app.get('/lymdynads.js',function(req,res) {
        fs.readFile('./static/lymdynads.js',function(error,content) {
	    //console.log('Request for lymuads.js');
        if (error) {
          res.writeHead(200,{'Content-type':'text/javascript'});
          res.end();
        } else {
          res.writeHead(200,{'Content-type':'text/javascript'});
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

	app.get('/ad',function(req,res) {
		var aid 	= req.query.aid;	//the adspace id for the ad being processed
        var size    = req.query.size;	//the size of the ad...this is an id
	    var adpos   = req.query.adpos;	//either atf or btf(above the fold or below the fold)
	    var keys    = req.query.keys;	//keywords taken from the local_yokel_custom var in the ad js
	    var ref     = req.query.ref;	//the referrer for this ad call(the site the ad is on)
	    var type    = req.query.type;	//the type of ad...javascript(js) or iframe
	    var zc      = req.query.zc;		//the zone code in a universal tag...not currently used
	    var mpid	= req.query.mpid;	//the media partner id or publisher id for the tag

	    var basetag;
	    var mimetype = 'text/html';
	    
	    //if type is iframe we don't modify tag(defined above) else, we place it in a document.write
	    //if type iframe, we keep mimetype as text/html, if not iframe, mimetype is text/javascript.
	    //The reason is, the iframe ad code is in html format and the non-iframe is actually just
	    //a javascript document.write statement...
	    //basetag either becomes tag from above or becomes a document write that writes tag 
	    if (type == "iframe") {
	    	basetag = tag;
	    } else {
	    	mimetype = 'text/javascript';
	    	basetag = 'document.write(\'' + tag + '\');';
	    }

	    //This is the thread id for logging purposes
	    var tid = Math.floor(Math.random()*100);

	    //ref is the referrer string passed to this application by the javascript ad tag
	    if (ref == undefined) {
	    	ref = 'http://test.localyokelmedia.com';
	    }
	    //we clean up the string to get a basic hostname minus path and www
		var host = ref.replace(/^http:\/\//im,"");
	    host = host.replace(/^www\./im,"");
	    host = host.replace(/^([^\/]+).*?$/im,"$1");
	    
	    //akey is the primary key used in memcache and in the mysql aidinfo table.  The 
	    //value for the akey entry is a string that contains information about the ad unit
	    //that we are going to display.  Below, you will see that that data gets split into
	    //an array called aid_info
	    var akey;
	    if (aid == undefined && mpid != undefined) {
	    	akey = mpid + ':' + host + ':' + size;
	    } else {
	    	akey = 'aid_' + aid;
	    }

	    //for the life of me, I don't understand why I needed to create duplicates of aid and mpid
	    //but I was forced to because both aid and mpid magically go out of scope once we start
	    //querying the databases...why said and smpid don't is beyond me
    	var said = aid;
    	var smpid = mpid;

    	/* First, we check memcache using akey to find the aidinfo we need to generate the ad.  
    	   If we have a result, we check the hostname given by the tag in the ref var matches 
    	   the hostname we find in the aidinfo data.  If it matches, we process the data and
    	   send the ad.  If not, we check for a passback and send if we have one.  Otherwise,
    	   we send a default creative.

    	   If we do not get a match in memcached, we check mysql.  If not found in mysql, we 
    	   send a default creative.  If found, we follow the same steps from above.  It's that 
    	   simple.
		*/
    	connection.get(akey, function(result) {
    		console.log(tid + ':2AID:' + said + ':MPID:' + smpid + ':SIZE:' + size + ':ADPOS:' + adpos + ':KEYS:' + keys);
    		//if success, check result.data for correct data
    		if (result.success && result.data) {
    			var aid_info = result.data.split("::");
				if (aid_info.length > 4) {
					console.log(aid_info);
					var aid      = aid_info[0];
					var mpid     = aid_info[1];
					var site_id  = aid_info[2];
					var zone_id  = aid_info[3];
					var dbadpos  = aid_info[4];
					var dbsize   = aid_info[5];
					var ahost    = aid_info[6];
					var passback = aid_info[7];
					console.log(tid + ':3AID:' + said + ':MPID:' + smpid + ':SIZE:' + size + ':ADPOS:' + adpos + ':KEYS:' + keys);
					if (host == ahost) {
						//site is whitelisted
						var new_adtag = atfunc.process(basetag, site_id, zone_id, keys, adpos, dbadpos, size, req, res);
						res.writeHead(200,{'Content-type':mimetype});
						res.end(new_adtag);
					} else if (passback != undefined) {
						//this assumes hostnames aren't the same and we have a passback for this ad
						console.log(tid + ';1;' + said + ';' + smpid + ';' + host + ';Referrer:' + host + ',AHost:' + ahost + ';hosts don\'t match.  Not whitelisted.;Sending passback');
						res.writeHead(200,{'Content-type':'text/html'});
						res.end(passback);
					} else {
						//hostnames don't match and we don't have a passback...send default creative
						console.log(tid + ';2;' + said + ';' + smpid + ';' + host + ';Referrer:' + host + ',AHost:' + ahost + ';hosts don\'t match.  Not whitelisted.;Sending default');
						var new_adtag = atfunc.default_ad(size,basetag);
				    	res.writeHead(200,{'Content-type':mimetype});
				    	res.end(new_adtag);
					}
				} else {
					// send default because of bad aidinfo data
					console.log(tid + ';3;' + said + ';' + smpid + ';' + host + ';' + result.data + ';Bad aidinfo data;Sending default');
					var new_adtag = atfunc.default_ad(size,basetag);
			    	res.writeHead(200,{'Content-type':mimetype});
			    	res.end(new_adtag);
				}
    		} else {
    			//check mysql
	    		console.log(tid + ':4AID:' + said + ':MPID:' + smpid + ':SIZE:' + size + ':ADPOS:' + adpos + ':KEYS:' + keys);
    			if (mysql_connected) {
	    			var query = "SELECT info FROM aidinfo WHERE akey='" + akey + "'";
	    			mysqlc.query(query, function(err, rows, fields) {
	    				console.log(tid + ':5AID:' + said + ':MPID:' + smpid + ':SIZE:' + size + ':ADPOS:' + adpos + ':KEYS:' + keys);
	    				if (err || !rows[0]) {
							console.log(tid + ';4;' + said + ';' + smpid + ';' + host + ';;No aidinfo;Sending default');
	    					//send default
	    					var new_adtag = atfunc.default_ad(size,basetag);
					    	res.writeHead(200,{'Content-type':mimetype});
					    	res.end(new_adtag);
	    				} else {
	    					var aid_info = rows[0].info.split("::");
	    					if (aid_info.length > 4) {
								var aid      = aid_info[0];
								var mpid     = aid_info[1];
								var site_id  = aid_info[2];
								var zone_id  = aid_info[3];
								var dbadpos  = aid_info[4];
								var dbsize   = aid_info[5];
								var ahost    = aid_info[6];
								var passback = aid_info[7];
								console.log(tid + ':4a:' + said + ':' + host + ':' + ahost + ':' + site_id + ':' + dbadpos);
								if (host == ahost) {
									//site is whitelisted if referrer and ahost match...always true with universal,  can be false when using aid
									var new_adtag = atfunc.process(basetag, site_id, zone_id, keys, adpos, dbadpos, size, req, res);
									res.writeHead(200,{'Content-type':mimetype});
									res.end(new_adtag);
								} else if (passback != undefined) {
									//this assumes hostnames aren't the same and we have a passback for this ad
									console.log(tid + ';5;' + said + ';' + smpid + ';' + host + ';Referrer:' + host + ',AHost:' + ahost + ';hosts don\'t match.  Not whitelisted.;Sending passback');
									//send passback
									res.writeHead(200,{'Content-type':'text/html'});
									res.end(passback);
								} else {
									//hosts aren't the same and we don't have a passback so we send a default creative
									console.log(tid + ';6;' + said + ';' + smpid + ';' + host + ';Referrer:' + host + ',AHost:' + ahost + ';hosts don\'t match.  Not whitelisted.;Sending default');
									//send default
									var new_adtag = atfunc.default_ad(size,basetag);
							    	res.writeHead(200,{'Content-type':mimetype});
							    	res.end(new_adtag);
								}
							} else {
								console.log(tid + ';7;' + said + ';' + smpid + ';' + host + ';' + rows[0].info + ';Bad aidinfo data;Sending default');
								// send default because of bad aidinfo data
								var new_adtag = atfunc.default_ad(size,basetag);
						    	res.writeHead(200,{'Content-type':mimetype});
						    	res.end(new_adtag);
							}
						}
	    			});
				} else {
					console.log(tid + ';8;' + said + ';' + smpid + ';' + host + ';' + rows[0].info + ';No MySQL connection;Sending default');
					// send default because of bad aidinfo data
					var new_adtag = atfunc.default_ad(size,basetag);
			    	res.writeHead(200,{'Content-type':mimetype});
			    	res.end(new_adtag);
				}
    		}
    	});
    });

	app.get('*', function(req, res){
	  res.end('', 404);
	});

	http.createServer(app).listen(app.get('port'), function(){
	  console.log("Express server listening on port " + app.get('port'));
	});

} //end of cluster if then
