
var SizeMap = {'160x600':6,'300x250':5,'728x90':4,'468x60':3};
var localyokel_sizeid = SizeMap[localyokel_size];
if (localyokel_sizeid == undefined) {
  // do nothing
} else {
  if(localyokel_adsvr_adspace_id == "scr")
  {
    lym_makeScript();
  }
  else
  {
    lym_loadFrame();
  }
}

 function lym_loadFrame() {
   var AppRoot = "http://NodeBalancer-2000449350.us-west-1.elb.amazonaws.com/ad";
   var div_id = "adsvr_"+localyokel_adsvr_adspace_id+"_"+Math.floor(Math.random()*999);
   document.write('<form id="makeFrame"><div id="'+ div_id +'"></div></form>'); 
   
   var referrer;    
   if(self == top) referrer = document.location.href; else referrer = document.referrer;
   referrer = 'http://thebrooklyngame.com';

   var dimarray = new Array();
   dimarray = localyokel_size.split("x");
   var localyokel_width = dimarray[0];
   var localyokel_height = dimarray[1];

   var lym_zone_data = "";

   localyokel_custom = localyokel_custom.replace(/"'/m,"");
   localyokel_custom = localyokel_custom.replace(/^\s+/,"");
   localyokel_custom = localyokel_custom.replace(/\s+$/,"");
   localyokel_custom = localyokel_custom.replace(/\s+/m,",");

   ifrm = document.createElement("IFRAME"); 
   ifrm.setAttribute("src", AppRoot +'?zc=' + localyokel_adsvr_adspace_zc + '&mpid=' + localyokel_adsvr_adspace_MPID + '&type=iframe&keys=' + escape(localyokel_custom) + '&size='+localyokel_sizeid+'&adpos='+DetectPosition(div_id)+'&ref='+escape(referrer));
   ifrm.width = localyokel_width;
   ifrm.height = localyokel_height;
   ifrm.id=div_id+"_iframe";
   ifrm.frameBorder = "0";
   ifrm.marginHeight = "0";
   ifrm.marginWidth = "0";
   ifrm.topMargin = "0";
   ifrm.leftMargin = "0";
   ifrm.scrolling = "no";
   document.getElementById(div_id).appendChild(ifrm);
} 

function lym_makeScript()
{
  var AppRoot = "http://NodeBalancer-2000449350.us-west-1.elb.amazonaws.com/ad";
    var localyokel_refURL; 
    if(self == top) localyokel_refURL = document.location.href; else localyokel_refURL = document.referrer;
    localyokel_custom = localyokel_custom.replace(/"'/m,"");
    localyokel_custom = localyokel_custom.replace(/^\s+/,"");
    localyokel_custom = localyokel_custom.replace(/\s+$/,"");
    localyokel_custom = localyokel_custom.replace(/\s+/m,",");
    localyokel_refURL = 'http://thebrooklyngame.com';
    document.write('<span id="'+div_id+'_span" style="white-space:normal;"><script src="' + AppRoot +'?zc=' + localyokel_adsvr_adspace_zc + '&mpid=' + localyokel_adsvr_adspace_MPID + '&type=js' + '&keys=' + escape(localyokel_custom) + '&size=' + localyokel_sizeid + '&adpos='+DetectPosition(div_id)+'&ref='+escape(localyokel_refURL) + '" type="text/javascript"></script></span></div></form>');
}

function lym_adsvr_DetectPosition(lym_div_id)
{
   var adPos = 'atf';
   var lym_adsvr_PosY = lym_adsvr_findPosY(document.getElementById(lym_div_id));  
   var lym_adsvr_ScreenHeight  = lym_adsvr_getHeight();
   if(lym_adsvr_PosY < lym_adsvr_ScreenHeight)
	   adPos = 'atf';
   else 
   	   adPos = 'btf';
   return adPos;
}

function lym_adsvr_findPosY(obj)
{
    var lym_adsvr_top = 0;
    if(obj.offsetParent)
    {
        while(1)
        {
          lym_adsvr_top += obj.offsetTop;
          if(!obj.offsetParent)
            break;
          obj = obj.offsetParent;
        }
    }
    else if(obj.y)
    {
        lym_adsvr_top += obj.y;
    }
    return lym_adsvr_top;
  }

function lym_adsvr_getHeight()
{
	var lym_adsvr_myHeight;

	if( typeof( window.innerWidth ) == 'number' ) { 

	//Non-IE 

	lym_adsvr_myHeight = window.innerHeight; 

	} else if( document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight )) { 

	//IE 6+ in 'standards compliant mode' 

	lym_adsvr_myHeight = document.documentElement.clientHeight; 

	} else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) { 

	//IE 4 compatible 

	lym_adsvr_myHeight = document.body.clientHeight; 

	}
	return lym_adsvr_myHeight;
}


