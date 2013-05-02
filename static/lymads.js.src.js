

var SizeMap = {'160x600':6,'300x250':5,'728x90':4,'468x60':3};
var localyokel_sizeid = SizeMap[localyokel_size];
if (!SizeMap[localyokel_size]) {
	/*do nothing if not a valid ad size*/
} else {
	if(js_only(localyokel_adsvr_adspace_id))
	{
	  var div_id = "adsvr_"+localyokel_adsvr_adspace_id+"_"+Math.floor(Math.random()*999);
	  document.write('<form id="'+div_id+'_frm"><div id="'+ div_id +'">');
	  makeScript();
	}
	else
	{
	  makeFrame();
	}
}

function makeFrame() {
   var AppRoot = "http://NodeBalancer-2000449350.us-west-1.elb.amazonaws.com/a";
   var div_id = "adsvr_"+localyokel_adsvr_adspace_id+"_"+Math.floor(Math.random()*999);
   document.write('<form id="makeFrame"><div id="'+ div_id +'"></div></form>'); 
   var referrer;    
   if(self == top) referrer = document.location.href; else referrer = document.referrer;
   referrer = 'http://thebrooklyngame.com';
   var localyokel_width = SplitOnString(0);
   var localyokel_height = SplitOnString(1);
   var lym_zone_data = "";
   localyokel_custom = localyokel_custom.replace(/"'/m,"");
   localyokel_custom = localyokel_custom.replace(/^\s+/,"");
   localyokel_custom = localyokel_custom.replace(/\s+$/,"");
   localyokel_custom = localyokel_custom.replace(/\s+/m,",");
   ifrm = document.createElement("IFRAME"); 
   ifrm.setAttribute("src", AppRoot +'?aid=' + localyokel_adsvr_adspace_id + '&type=iframe&keys=' + escape(localyokel_custom) + '&size='+localyokel_sizeid+'&adpos='+DetectPosition(div_id)+'&ref='+escape(referrer));
   //ifrm.style.width = localyokel_width +"px"; 
   //ifrm.style.height = localyokel_height +"px";
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

function makeScript()
{
	
	var AppRoot = "http://NodeBalancer-2000449350.us-west-1.elb.amazonaws.com/a";
    var localyokel_refURL; 
	if(self == top) localyokel_refURL = document.location.href; else localyokel_refURL = document.referrer;
    localyokel_custom = localyokel_custom.replace(/"'/m,"");
    localyokel_custom = localyokel_custom.replace(/^\s+/,"");
    localyokel_custom = localyokel_custom.replace(/\s+$/,"");
    localyokel_custom = localyokel_custom.replace(/\s+/m,",");
    localyokel_refURL = 'http://thebrooklyngame.com';
    document.write('<span id="'+div_id+'_span" style="white-space:normal;"><script src="' + AppRoot +'?aid=' + localyokel_adsvr_adspace_id + '&type=js' + '&keys=' + escape(localyokel_custom) + '&size='+localyokel_sizeid+'&adpos='+DetectPosition(div_id)+'&ref='+escape(localyokel_refURL) + '" type="text/javascript"></script></span></div></form>');

}

function SplitOnString(pos)
{	
    var SplitResult = localyokel_size.split("x");
    return SplitResult[pos];
}

function js_only(aid)
{
	var JSOnly = {'9291':1,'9294':1,'9606':1};
	if (JSOnly[aid] == undefined) {
		return 0;
	} else {
		return 1;
	}
}

function DetectPosition(lym_div_id)
{
   var browserName=navigator.appName;
   var adPos = 'atf';
   var PosY = findPosY(document.getElementById(lym_div_id));  
   var ScreenHeight  = getHeight();
   if(PosY < ScreenHeight)
	   adPos = 'atf';
   else 
   	   adPos = 'btf';
   return adPos;
}

function findPosY(obj)
{
	var top = 0;
	if(obj==null)
		{
	
		}
   	else
		{
			if(obj.offsetParent)
			{
				while(1)
				{
				  top += obj.offsetTop;
				  if(!obj.offsetParent)
					break;
				  obj = obj.offsetParent;
				}
			}
			else if(obj.y)
			{
				top += obj.y;
			}
		}
    return top;
}


function getHeight()
{
	var myHeight;
	if( typeof( window.innerWidth ) == 'number' ) { 
		//Non-IE 
		myHeight = window.innerHeight; 
	} else if( document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight )) { 
		//IE 6+ in 'standards compliant mode' 
		myHeight = document.documentElement.clientHeight; 
	} else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) { 
		//IE 4 compatible 
		myHeight = document.body.clientHeight;       
	}
	return myHeight;
}
