
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

exports.process = function(new_adtag, site_id, zone_id, tagkeys, adpos, dbadpos, size, req, res) {

	var div_id = Math.floor(Math.random()*99999);

	new_adtag = new_adtag.replace(/_SIZE_/im,size);

	new_adtag = new_adtag.replace(/_DIVID_/gim,div_id);

	if (adpos == undefined) {
		adpos = 'atf';
	}
	if (dbadpos == 'atf' || dbadpos == 'btf') {
		adpos = dbadpos;
	}

	var keys;
	if (tagkeys != "") {
  		tagkeys = tagkeys.replace(/["']+/g,"");
  		process_cookie(tagkeys,req,res);
  		keys = tagkeys + ',' + adpos;
  	} else {
  		keys = adpos;
  	}
  	new_adtag = new_adtag.replace(/_KEYWORDS_/im,'ados_setKeywords("' + keys + '");');

	if (site_id == undefined) {
		site_id = 28036;
	}

	new_adtag = new_adtag.replace(/_SITEID_/im,site_id);

	if (zone_id == undefined || zone_id == -1) {
		new_adtag = new_adtag.replace(/_SETZONE_/im,"");
	} else {
		new_adtag = new_adtag.replace(/_SETZONE_/im,".setZone(" + zone_id + ")");
	}

	return new_adtag;
}

var Keygrip = require('keygrip'),
    Cookies = require('cookies');

var keys = new Keygrip(["thrak","attak"]);

function process_cookie(newkeys,req,res) {
	var cookies = new Cookies(req,res,keys);
	var cval = cookies.get("LYMATKEYS");
	var cvlength = 0;
	var cvarray = new Array();
	if (cval) {
		cvlength = cval.length;
		cvarray = cval.split(",");
	}
	var nkarray = new Array();
	var nklength = 0;
	if (newkeys) {
		nklength = newkeys.length;
		nkarray = newkeys.split(",");
	}
	var cdate = new Date();
	var epochmilli = cdate.getTime();
	var new_epochmilli = epochmilli + 15724800000;
	var expire_date = new Date();
	expire_date.setTime(new_epochmilli);

	if (cvlength > 3000) {
		if (nklength < 3000 && nklength > 0) {
			cookies.set("LYMATKEYS",newkeys,{signed:true,expires:expire_date,overwrite:true});
		}
	} else if (cvlength + nklength < 3000 && cvlength + nklength > 0) {
		var keyhash = new Object();
		var keyarray = new Array();
		for (var k in cvarray) {
			keyhash[k] = 1;
		}
		for (var k in nkarray) {
			keyhash[k] = 1;
		}
		for (var k in keyhash) {
			if (keyarray.hasOwnProperty(k)) {
				keyarray.push(k);
			}
		}
		var keystring = keyarray.join(",");
		cookies.set("LYMATKEYS",keystring,{signed:true,expires:expire_date,overwrite:true});
	} else if (nklength < 3000) {
		cookies.set("LYMATKEYS",newkeys,{signed:true,expires:expire_date,overwrite:true});
	}
}

