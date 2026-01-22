async function initTestPage() {
    if (window.location.search.includes('galaksionInPage')) {
        var adScript = document.createElement('script');
        adScript.setAttribute('data-cfasync','false');
        adScript.setAttribute('src','//bh.abistonfrau.com/s4GCQrZtdlmkrt/122746');
        document.head.appendChild(adScript);
    } else if (window.location.search.includes('galaksion')) {
        var adScript = document.createElement('script');
        adScript.setAttribute('data-cfasync','false');
        adScript.setAttribute('src','//ph.couloirmatrass.com/tA0BuWmJtNv/120875');
        document.getElementById("test_ads").appendChild(adScript);
    } else if (window.location.search.includes('clickadu')) {
        var adScript = document.createElement('script');
        adScript.setAttribute('data-cfasync','false');
        adScript.setAttribute('class','__clb-2035294'); 
        adScript.setAttribute('src','//brittlesturdyunlovable.com/lv/esnk/2035294/code.js');
        document.getElementById("test_ads").appendChild(adScript);
    } else if (window.location.search.includes('clickaduInPage')) {
        var adScript = document.createElement('script');
        adScript.setAttribute('data-cfasync','false');
        adScript.setAttribute('data-clipid','2070455');
        adScript.setAttribute('src','//deductgreedyheadroom.com/in.js');
        document.head.appendChild(adScript);
    } else if (window.location.search.includes('adcashPop')) {
        var acLibScript = document.createElement('script');
        acLibScript.setAttribute('id', 'aclib');
        acLibScript.setAttribute('type', 'text/javascript');
        acLibScript.setAttribute('src', '//acscdn.com/script/aclib.js');
        acLibScript.onload = function() {
            var popScript = document.createElement('script');
            popScript.setAttribute('type', 'text/javascript');
            popScript.textContent = `
                aclib.runPop({
                    zoneId: '10002398',
                });
            `;
            document.head.appendChild(popScript);
        };
        document.head.appendChild(acLibScript);
    } else if (window.location.search.includes('adcash')) {
        var acLibScript = document.createElement('script');
        acLibScript.setAttribute('id', 'aclib');
        acLibScript.setAttribute('type', 'text/javascript');
        acLibScript.setAttribute('src', '//acscdn.com/script/aclib.js');
        acLibScript.onload = function() {
            var bannerScript = document.createElement('script');
            bannerScript.setAttribute('type', 'text/javascript');
            bannerScript.textContent = `
                aclib.runBanner({
                    zoneId: '9970978',
                });
            `;
            document.getElementById("test_ads").appendChild(bannerScript);
        };
        document.head.appendChild(acLibScript);
    } else if (window.location.search.includes('monetagPush')) {
        var monetagScript = document.createElement('script');
        monetagScript.setAttribute('type', 'text/javascript');
        monetagScript.textContent = `
            (function(d,z,s){
                s.src='https://'+d+'/400/'+z;
                try{
                    (document.body||document.documentElement).appendChild(s)
                }catch(e){}
            })('theetheks.com',6440586,document.createElement('script'))
        `;
        document.head.appendChild(monetagScript);
    } else if (window.location.search.includes('monetagInter')) {
        (function(d,z,s){s.src='https://'+d+'/401/'+z;try{(document.body||document.documentElement).appendChild(s)}catch(e){}})('wugroansaghadry.com',9397261,document.createElement('script'))
    } else if (window.location.search.includes('monetagPop')) {
        var adScript = document.createElement('script');
        adScript.setAttribute('data-cfasync','false');
        adScript.setAttribute('src','//madurird.com/5/6440852');
        document.head.appendChild(adScript);
    } else if (window.location.search.includes('popadsPush')) {
        (function(){var q=window,o="dd042512d08c30968dd1d65812e1ba86",g=[["siteId",330*97+142+1588365],["minBid",0],["popundersPerIP","0:12"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","never"]],a=["d3d3LmRpc3BsYXl2ZXJ0aXNpbmcuY29tL1dyWVRnL29ib290c3RyYXAtbWFya2Rvd24ubWluLmpz","ZDNtem9rdHk5NTFjNXcuY2xvdWRmcm9udC5uZXQvWHJMamIvdWlwL3pqcXVlcnkuZm9ybS5taW4uY3Nz"],c=-1,t,h,y=function(){clearTimeout(h);c++;if(a[c]&&!(1774564114000<(new Date).getTime()&&1<c)){t=q.document.createElement("script");t.type="text/javascript";t.async=!0;var w=q.document.getElementsByTagName("script")[0];t.src="https://"+atob(a[c]);t.crossOrigin="anonymous";t.onerror=y;t.onload=function(){clearTimeout(h);q[o.slice(0,16)+o.slice(0,16)]||y()};h=setTimeout(y,5E3);w.parentNode.insertBefore(t,w)}};if(!q[o]){try{Object.freeze(q[o]=g)}catch(e){}y()}})();
    } else {
        document.getElementById("test_ads").innerHTML = '<iframe data-aa="2059298" src="//ad.a-ads.com/2059298?size=300x250" style="width:300px; height:250px; border:0px; padding:0; overflow:hidden; background-color: transparent;"></iframe>';
    }
}
