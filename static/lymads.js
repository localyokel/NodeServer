//universal ad tag loader

//we only allow three ad sizes..the following enforces that
var SizeMap = {'160x600':6,'300x250':5,'728x90':4,'468x60':3};
var localyokel_sizeid = SizeMap[localyokel_size];
if (!SizeMap[localyokel_size]) {
	/*do nothing if not a valid ad size*/
} else {
	lym_ads_makeFrame();
}

function lym_ads_makeFrame() {
   var localyokel_adsvr_adspace_vAppRoot = "http://NodeBalancer-2000449350.us-west-1.elb.amazonaws.com/a";
   var lym_adsvr_div_id = "adsvr_"+localyokel_adsvr_adspace_id+"_"+Math.floor(Math.random()*999);
   document.write('<form id="lym_adsvr_makeFrame"><div id="'+ lym_adsvr_div_id +'"></div></form>'); 
   var referrer;
   if(self == top) referrer = document.location.href; else referrer = document.referrer;
   referrer = 'http://accuweather.com/this/is/a/test/ad.html';
   var localyokel_width = lym_adsvr_SplitOnString(0);
   var localyokel_height = lym_adsvr_SplitOnString(1);
   var lym_zone_data = "";
   ifrm = document.createElement("IFRAME"); 
   ifrm.setAttribute("src", localyokel_adsvr_adspace_vAppRoot +'?aid=' + localyokel_adsvr_adspace_id + '&keys=' + escape(localyokel_custom) + '&size='+localyokel_sizeid+'&adpos='+lym_adsvr_DetectPosition(lym_adsvr_div_id)+'&ref='+escape(referrer));
   //ifrm.style.width = localyokel_width +"px"; 
   //ifrm.style.height = localyokel_height +"px";
   ifrm.width = localyokel_width;
   ifrm.height = localyokel_height;
   ifrm.id=lym_adsvr_div_id+"_iframe";
   ifrm.frameBorder = "0";
   ifrm.marginHeight = "0";
   ifrm.marginWidth = "0";
   ifrm.topMargin = "0";
   ifrm.leftMargin = "0";
   ifrm.scrolling = "no";
   document.getElementById(lym_adsvr_div_id).appendChild(ifrm);
} 

function lym_adsvr_SplitOnString(pos)
{	
    var SplitResult = localyokel_size.split("x");
    return SplitResult[pos];
}

function lym_adsvr_DetectPosition(lym_div_id)
{
   var browserName=navigator.appName;
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
	if(obj==null)
		{
	
		}
	else
		{
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
