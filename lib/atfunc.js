exports.default_ad = function(size,basetag) {
	var new_adtag = basetag;
	var div_id = Math.floor(Math.random()*99999);
	new_adtag = new_adtag.replace(/_SIZE_/im,size);
	new_adtag = new_adtag.replace(/_KEYWORDS_/im,"");
	new_adtag = new_adtag.replace(/_SITEID_/im,"28036");
	new_adtag = new_adtag.replace(/_SETZONE_/im,"");
	new_adtag = new_adtag.replace(/_DIVID_/gim,div_id);
	return new_adtag;
}

exports.setup = function(aid_data,new_adtag,adpos,keys,size,div_id,targets) {

	var siteid = aid_data[0];
	var zoneid = aid_data[1];
	var defkeys = aid_data[2];

	new_adtag = new_adtag.replace(/_SIZE_/im,size);

	new_adtag = new_adtag.replace(/_DIVID_/gim,div_id);

	if (!adpos) {
		adpos = 'atf';
	}

	if (keys && defkeys) {
  		keys = keys.replace(/["']+/g,"");
  		var ckeys = keys + ',' + defkeys;
  		//process_cookie(ckeys,targets);

  		keys = keys + ',' + defkeys + ',' + adpos;
  	} else if (defkeys) {
  		//process_cookie(defkeys,targets);
  		keys = defkeys + ',' + adpos;
  	} else {
  		keys = adpos;
  	}
  	new_adtag = new_adtag.replace(/_KEYWORDS_/im,"ados_setKeywords('" + keys + "');");

	if (!siteid) {
		siteid = 28036;
	}
	new_adtag = new_adtag.replace(/_SITEID_/im,siteid);

	return new_adtag;
}

function process_cookie(keys,targets) {
	var oatmeal = require('oatmeal');
	if (keys === undefined) {
		return;
	}
	var basekeys = '';
	if(targets.length > 0) {
		basekeys = targets.join(",");
	}
	var keysLength = keys.length;
	var baseLength = basekeys.length;

	var klist = new Array();
	klist = keys.split(",");
	
	var final = new Object();
	for (var key in klist) {
		final[key] = 1;
	}
	if (keysLength + baseLength < 3000) {
		for (var key in targets) {
			final[key] = 1;
		}
	}
	var tags = new Array();
	for (var key in final) {
		if (final.hasOwnProperty(key)) {
			tags.push(key);
		}
	}
	if (tags.length > 0) {
		var keylist = tags.join(",");
		var size = keylist.length;
		//oatmeal.munch('LYM_AT_TARGETS');
		oatmeal.cookie('LYM_AT_TARGETS',keylist, { months: 3 });
	}
}

exports.zones = function(aid_data,new_adtag,connection,mysqlc,tid) {
	var zoneid = aid_data[1];

	if (!zoneid) {
		console.log(tid + ':4:No zoneid defined');
		//do we check paths at this point?
		//if we store all zones for an aid, then we just replace _SETZONE_ with nothing, right?
		new_adtag = new_adtag.replace(/_SETZONE_/im,"");
		return new_adtag;
	} else {
		//check to see if there is more than one zone
		console.log(tid + ':5a:zoneid:' + zoneid);
		var zones = zoneid.split(",");
		if (zones.length == 1) {
			console.log(tid + ':5b:Just one zoneid');
			new_adtag = new_adtag.replace(/_SETZONE_/im,".setZone(" + zoneid + ")");
			return new_adtag;
		} else {
			console.log(tid + ':5c:More than one zoneid');
			var done = 0;
			connection.get(host,function(result) {
				console.log(tid + ':5d.a:checking for possible zones in memcached');
				
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
					console.log(tid + ':5c.b:' + nodes[i]);
				}

				if (result.success && result.data) {
					console.log(tid + ':5d.b:found ' + result.data);
					//we have list of possible paths and zones
					var darray = new Array();
					darray = result.data.split(",");
					for (var i = nodes.length - 1; i >= 0; i--) {
						console.log(tid + ':5d.c:Checking ' + nodes[i]);
						for (var j = 0; j < darray.length; j++) {
							console.log(tid + ':5d.d:Against ' + darray[j]);
							var data = darray[j].split(":");
							if (nodes[i] == data[0]) {
								console.log(tid + ':5d.e:Found in memcached');
								done = 1;
								new_adtag = new_adtag.replace(/_SETZONE_/im,".setZone(" + data[1] + ")");
								break;
							}
						}
						if (done == 1) {
							break;
						}
					}
					if (done == 0) {
						new_adtag = new_adtag.replace(/_SETZONE_/im,"");
					}
					return new_adtag;
				} else {
					console.log(tid + ':5d.f:Not found in memcached');
					var query = "SELECT url,zoneid FROM sitezones WHERE url LIKE '/" + host + "%' ORDER BY url DESC";
					var temp = new Array();
					mysqlc.query(query,function(err,rows,fields) {
						if (err || rows.length == 0) {
							console.log(tid + ':5d.g:Not found in MySQL');
							new_adtag = new_adtag.replace(/_SETZONE_/im,"");
							return new_adtag;
							//no data
						} else {
							console.log(tid + ':5d.h:Found ' + host + ' in MySQL');
							for (var i = 0; i < rows.length; i++) {
								console.log(tid + ':5d.i:URL ' + rows[i].url);
								for (var j = nodes.length - 1; j >= 0; j--) {
									console.log(tid + ':5d.j:Node ' + nodes[j]);
									if (nodes[j] == rows[i].url) {
										console.log(tid + ':5d.k:Found in MySQL');
										new_adtag = new_adtag.replace(/_SETZONE_/im,".setZone(" + rows[i].zoneid + ")");
										done = 1;
									}
								}
								temp[i] = rows[i].url + ':' + rows[i].zoneid;
							}
							var mdata = temp.join();
							connection.set(host,mdata,function(result) {
								if (result.success) {
									//added to memcache 
								} else {
									//not added to memcache
								}
							});
							if (!done) {
								new_adtag = new_adtag.replace(/_SETZONE_/im,"");
							}
							return new_adtag;
						}
					});
				}
			});
		}
	}
}