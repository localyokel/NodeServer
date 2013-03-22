//universal ad tag loader

lym_ads_makeFrame();

function lym_ads_makeFrame() {
   var localyokel_adsvr_adspace_vAppRoot = "http://NodeBalancer-2000449350.us-west-1.elb.amazonaws.com/a";
   var lym_adsvr_div_id = "adsvr_"+localyokel_adsvr_adspace_id+"_"+Math.floor(Math.random()*999);
   document.write('<form id="lym_adsvr_makeFrame"><div id="'+ lym_adsvr_div_id +'"></div></form>');     
   var localyokel_refURL; if(self == top) localyokel_refURL = document.location.href; else localyokel_refURL = document.referrer;
   localyokel_refURL = 'http://test.localyokelmedia.com/this/is/a/test/ad.html';
   var localyokel_width = lym_adsvr_SplitOnString(0);
   var localyokel_height = lym_adsvr_SplitOnString(1);
   ifrm = document.createElement("IFRAME"); 
   ifrm.setAttribute("src", localyokel_adsvr_adspace_vAppRoot +'?aid=' + localyokel_adsvr_adspace_id + '&keys=' + escape(localyokel_custom) + '&size='+localyokel_size+'&adpos='+lym_adsvr_DetectPosition(lym_adsvr_div_id)+'&ref='+escape(localyokel_refURL));
   ifrm.style.width = localyokel_width +"px"; 
   ifrm.style.height = localyokel_height +"px"; 
   ifrm.id=lym_adsvr_div_id+"_iframe";
   ifrm.frameBorder = "0"; 
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
