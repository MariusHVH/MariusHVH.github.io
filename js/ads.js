async function launchAds() {
    var currentTimestamp = Math.floor(new Date().getTime() / 1000)
    const accountActive = await getAccountActive();
    console.log(accountActive.ipinfo.country)
    if(accountActive.tier == "premium" || appdata.fileManager.mainContent.data.totalDownloadCount < 20 || appdata.fileManager.mainContent.data.isOwner) {
        return
    }

    document.getElementById('index_ads').classList.remove('hidden');
    //if (
    //appdata.random > 0 
    // && window.innerWidth <= 1024 
    //&& (accountActive.ipinfo.country == "IN")
    //&& (localStorage.getItem('cleveradTimestamp') == undefined || currentTimestamp - localStorage.getItem('cleveradTimestamp') > 43200)
    // && (isNSFWInFolder() == false)
    //) {
    //    appdata.ads.mustLoadCleverad = true;
    //    localStorage.setItem('cleveradTimestamp', currentTimestamp);
    //}
    // if (appdata.random > 0 && document.referrer.match(/simpcity|socialmediagirls|phica|leakimedia/)) {
    //     //AdcashPop
    //     if(document.getElementById("index_ads").innerHTML == "") {
    //         document.getElementById("index_ads").innerHTML = '<small class="mb-2">To disable ads, <a href="/premium" class="text-blue-500 hover:text-blue-700 underline">upgrade</a> your account to Premium</small>';
    //         appdata.ads.mustLoadAdcashPop = true;
    //         localStorage.setItem('adcashTimestamp', currentTimestamp);
    //     }
    // }
    if (appdata.random > 0 && accountActive.ipinfo.country != "JP" && (localStorage.getItem('aadsTimestamp') == undefined || currentTimestamp - localStorage.getItem('aadsTimestamp') > 43200)) {
        //Aads ATF
        if(document.getElementById("index_ads").innerHTML == "")
        {
            document.getElementById("index_ads").innerHTML = '<small class="mb-2">To disable ads, <a href="/premium" class="text-blue-500 hover:text-blue-700 underline">upgrade</a> your account to Premium</small><iframe data-aa="2059298" src="//ad.a-ads.com/2059298?size=300x250" style="width:300px; height:250px; border:0px; padding:0; overflow:hidden; background-color: transparent;"></iframe>';
            localStorage.setItem('aadsTimestamp', currentTimestamp);
        }
    }
    else if(appdata.random > 0 && (localStorage.getItem('adcashTimestamp') == undefined || currentTimestamp - localStorage.getItem('adcashTimestamp') > 43200)) {
        //AdcashPop
        if(document.getElementById("index_ads").innerHTML == "") {
            document.getElementById("index_ads").innerHTML = '<small class="mb-2">To disable ads, <a href="/premium" class="text-blue-500 hover:text-blue-700 underline">upgrade</a> your account to Premium</small>';
            appdata.ads.mustLoadAdcashPop = true;
            localStorage.setItem('adcashTimestamp', currentTimestamp);
        }
    }
    else if(appdata.random > 0.55) {
        //Galaksion
        if(document.getElementById("index_ads").innerHTML == "") {
            document.getElementById("index_ads").innerHTML = '<small class="mb-2">To disable ads, <a href="/premium" class="text-blue-500 hover:text-blue-700 underline">upgrade</a> your account to Premium</small>';
            var adScript = document.createElement('script');
            adScript.setAttribute('data-cfasync','false');
            adScript.setAttribute('src','//bm.educandrelock.com/tjxbLQ0u10c34K5sU/125755');
            document.getElementById("index_ads").appendChild(adScript);
        }
    } else {
        //ClickaduATF
        if(document.getElementById("index_ads").innerHTML == "")
        {
            document.getElementById("index_ads").innerHTML = '<small class="mb-2">To disable ads, <a href="/premium" class="text-blue-500 hover:text-blue-700 underline">upgrade</a> your account to Premium</small>'
            appdata.ads.mustLoadClickadu = true
        }
    }
    // else if (appdata.random > 0.8 && accountActive.ipinfo.country == "JP" && document.referrer.match(/t\.co|twitter\.com|x\.com/i) && (localStorage.getItem('clickaduInPageTimestamp') == undefined || currentTimestamp - localStorage.getItem('clickaduInPageTimestamp') > 43200)) {
    //     //clickaduInPage
    //     appdata.ads.mustLoadClickaduInPage = true;
    //     localStorage.setItem('clickaduInPageTimestamp', currentTimestamp);
    // }
    // else if (appdata.random > 0.7 && accountActive.ipinfo.country == "JP" && document.referrer.match(/t\.co|twitter\.com|x\.com/i) && (localStorage.getItem('galaksionInPageTimestamp') == undefined || currentTimestamp - localStorage.getItem('galaksionInPageTimestamp') > 43200)) {
    //     //GalaksionInPage
    //     appdata.ads.mustLoadGalaksionInPage = true;
    //     localStorage.setItem('galaksionInPageTimestamp', currentTimestamp);
    // }
    // else if (appdata.random > 0.8 && accountActive.ipinfo.country == "JP" && (localStorage.getItem('surveooTimestamp') == undefined || currentTimestamp - localStorage.getItem('surveooTimestamp') > 43200)) {
    //     document.getElementById("index_ads").innerHTML = '<small class="mb-2">To disable ads, <a href="/premium" class="text-blue-500 hover:text-blue-700 underline">upgrade</a> your account to Premium</small>';
    //     var adScript = document.createElement('script');
    //     adScript.setAttribute('type', 'text/javascript');
    //     adScript.setAttribute('id', 'OeXg7PuXmDTVZ1WipMd3');
    //     adScript.setAttribute('src', 'https://price-low.eu/js/script_OeXg7PuXmDTVZ1WipMd3.js');
    //     document.getElementById("index_ads").appendChild(adScript);
    //     localStorage.setItem('surveooTimestamp', currentTimestamp);
    // }

    if(appdata.ads.mustLoadAdcash == true && appdata.ads.adcashScriptLoaded == false) {
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
            document.getElementById("index_ads").appendChild(bannerScript);
        };
        document.head.appendChild(acLibScript);
        appdata.ads.adcashScriptLoaded = true
    }
    if(appdata.ads.mustLoadAdcashPop == true && appdata.ads.adcashPopScriptLoaded == false) {
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
        appdata.ads.adcashPopScriptLoaded = true
    }
    if(appdata.ads.mustLoadClickadu == true && appdata.ads.clickaduScriptLoaded == false) {
        var adScript = document.createElement('script');
        adScript.setAttribute('data-cfasync','false');
        adScript.setAttribute('class','__clb-2035294'); 
        adScript.setAttribute('src','//brittlesturdyunlovable.com/lv/esnk/2035294/code.js');
        document.getElementById("index_ads").appendChild(adScript);
        appdata.ads.clickaduScriptLoaded = true
    }
    if(appdata.ads.mustLoadClickaduInPage == true && appdata.ads.clickaduInPageScriptLoaded == false) {
        var adScript = document.createElement('script');
        adScript.setAttribute('data-cfasync','false');
        adScript.setAttribute('data-clipid','2070455');
        adScript.setAttribute('src','//deductgreedyheadroom.com/in.js');
        document.head.appendChild(adScript);
        appdata.ads.clickaduInPageScriptLoaded = true
    }
    if(appdata.ads.mustLoadGalaksionInPage == true && appdata.ads.galaksionInPageScriptLoaded == false) {
        var adScript = document.createElement('script');
        adScript.setAttribute('data-cfasync','false');
        adScript.setAttribute('src','//bh.abistonfrau.com/s4GCQrZtdlmkrt/122746');
        document.head.appendChild(adScript);
        appdata.ads.galaksionInPageScriptLoaded = true
    }
    if (appdata.ads.mustLoadCleverad == true && appdata.ads.cleveradScriptLoaded == false) {
        var scriptElement = document.createElement("script");
        scriptElement.setAttribute("data-cfasync", "false");
        scriptElement.setAttribute("type", "text/javascript");
        scriptElement.setAttribute("id", "AdsCoreLoader97556");
        scriptElement.src = "https://sads.adsboosters.xyz/9aabf53598f8eafbb5a058a96e2d092c.js";
        document.getElementById("index_ads").appendChild(scriptElement);
        appdata.ads.cleveradScriptLoaded = true;
    }
}
