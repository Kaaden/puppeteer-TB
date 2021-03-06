const cheerio = require("cheerio");
// 爬取淘宝
exports.findTaobao = async (page, content, url) => {
    const objItem = {
        imgs: [],
        title: "",
        price: "",
        content: [],
        good_id: 0,
    }
    objItem.good_id = getGoodid(url)
    try {
        objItem.title = await getTitle(page)
        objItem.imgs = await getSwiper(content)
        objItem.price = await getPrice(page)
        objItem.content = await getContent(content)
        error = false
    } catch (err) {
        error = true
    }
    return objItem
}
// 爬取天猫h5
exports.findTianMao = (html, url) => {
    const objItem = {
        good_id: 0,
        imgs: [],
        title: "",
        price: "",
        content: [],
    }
    objItem.good_id = getGoodid(url)
    const $ = cheerio.load(html);
    //价格
    $(".price").each(function (i, e) {
        if (e.childNodes.length) {

            if (e.childNodes.length === 1) {
                if (e.childNodes[0].data) {
                    objItem.price = e.childNodes[0].data
                    return false
                }
            }
            if (e.childNodes.length === 2) {
                if (e.childNodes[1].childNodes.length) {
                    objItem.price = e.childNodes[1].childNodes[0].data
                    return false
                }
            }

        }
    });
    if (!objItem.price) {
        $(".price-real .num").each(function (i, e) {
            if (e.childNodes.length && e.childNodes[0].data) {
                objItem.price = e.childNodes[0].data
                return false
            }
        });
    }
    // 标题
    $(".share-warp .main").each(function (i, e) {
        if (e.childNodes.length && e.childNodes[0].data) {
            objItem.title = e.childNodes[0].data
            return false
        }
    })
    if (objItem.title) {
        objItem.title = trim(objItem.title)
    }
    // 轮播图
    $(".preview-scroller a img").each(function (i, e) {
        if (e.attribs["data-src"]) {
            objItem.imgs.push(e.attribs["data-src"])
        }
    })

    //详情
    $(".mui-custommodule .mui-custommodule-item img").each(function (i, e) {
        if (e.attribs["data-ks-lazyload"]) {
            objItem.content.push(e.attribs["data-ks-lazyload"])
        }
    })
    $(".module-container  .mui-wpimagetext-item img").each(function (i, e) {
        if (e.attribs["data-ks-lazyload"] && checkStr(objItem.content, e.attribs["data-ks-lazyload"], false)) {
            objItem.content.push(e.attribs["data-ks-lazyload"])
        }
    })
    $(".group-warp section img").each(function (i, e) {
        if (e.attribs["data-src"] && checkStr(objItem.content, e.attribs["data-src"], false)) {
            objItem.content.push(e.attribs["data-src"])
        }
    })

    $(".container section img").each(function (i, e) {
        if (e.attribs["data-src"] && checkStr(objItem.content, e.attribs["data-src"], false)) {
            objItem.content.push(e.attribs["data-src"])
        }
    })
    $(".container section p img").each(function (i, e) {
        if (e.attribs["data-src"] && checkStr(objItem.content, e.attribs["data-src"], false)) {
            objItem.content.push(e.attribs["data-src"])
        }
    })
    return objItem
}


exports.changeUrl = (url) => {
    if (/detail.tmall.com/.test(url)) {
        url = url.replace("detail.tmall.com", "detail.m.tmall.com")
    }
    return url
}

exports.resJosn = (vm, res) => {
    res.writeHead(200, {
        "Content-Type": "application/json"
    });
    res.end(JSON.stringify(vm));
}

//获取标题
const getTitle = async (page) => {
    const t1 = ".tpl-wrapper > div > div > div > span"
    const t2 = ".tb-detail-hd > h1"
    const t3 = ".tb-main-title"
    let title
    try {
        title = await page.$eval(t3, ele => ele.innerHTML);
    } catch (err) {
        try {
            title = await page.$eval(t2, ele => ele.innerHTML);
        } catch (errmsg) {
            try {
                title = await page.$eval(t1, ele => ele.innerHTML);
            } catch (errmsg) {
                title = "";
            }
        }
    }
    return trim(title)
}
//获取swiper
const getSwiper = (html) => {
    let urls = []
    urls = catchSwiper(".tb-thumb li .tb-pic a img", html)
    urls = urlSize(urls, "50x50.jpg")
    // if (/item.taobao.com/.test(url)) {
    //     urls = catchSwiper(".tb-thumb li .tb-pic a img", html)
    //     urls = urlSize(urls, "50x50.jpg")
    // }
    // if (/detail.tmall.com/.test(url)) {
    //     urls = catchSwiper(".tb-thumb li a img", html)
    //     urls = urlSize(urls, "60x60q90.jpg")
    // }

    return urls
}
//获取价格
const getPrice = async (page) => {
    let price = ""
    try {
        price = await page.$eval('.tb-rmb-num', ele => ele.innerHTML);
    } catch (error) {
        price = ""
    }
    return price
}
// 详情
const getContent = async (html) => {
    let urls = []
    urls = catchSwiper(".J_DetailSection .content img", html)
    return urls
}
// 获取图片
const catchSwiper = (ele, html) => {
    const $ = cheerio.load(html);
    let urls = []
    try {
        $(ele).each(function (i, elem) {
            const src = elem.attribs["data-ks-lazyload"] || elem.attribs.src
            if (src && checkStr(src, "top_1", false) && checkStr(src, ".gif", false) && checkStr(src, "video", false)) {
                urls.push(src)
            }
        });
    } catch (err) {
        console.log(err)
    }
    return urls
}
// 获取goodid
const getGoodid = (url) => {
    let id = 0
    url = url.split("&")
    if (url.length) {
        for (let i = 0, len = url.length; i < len; i++) {
            if (checkStr(url[i], "id=", true)) {
                let idt = url[i].split("=")
                id = idt[1]
                return id
            }
        }
    }
    return id
}

const checkStr = (str, para, type) => {
    if (type) {
        if (str.includes(para)) {
            return true
        } else {
            return false
        }
    } else {
        if (!str.includes(para)) {
            return true
        } else {
            return false
        }
    }
}

const urlSize = (imgs, size) => {
    if (!imgs.length) {
        return imgs
    }
    for (let i = 0, len = imgs.length; i < len; i++) {
        if (checkStr(imgs[i], size, true)) {
            imgs[i] = imgs[i].replace(size, "400x400.jpg")
        }
    }
    return imgs
}

//去空格
const trim = (str) => {
    try {
        str = str.replace(/<\/?.+?>/g, "").replace(/^(\s|\u00A0)+/, "").replace(/(\s|\u00A0)+$/, "")
    } catch (error) {
        str = str
    }
    return str;
}



// 获取规格
// const getSku = (html, goodPage) => {
//     const $ = cheerio.load(html);
//     const value2label = {};
//     $(".J_TSaleProp li").each(function (i, elem) {
//         const value = $(this).attr("data-value");
//         const label = $(this)
//             .find("span")
//             .text();
//         value2label[value] = label;
//     });
//     // 预定义结果 skuList = [{name,skuId,stock},{name,skuId,stock}]
//     const skuList = [];
//     let skuMaps;
//     if (/item.taobao.com/.test(goodPage)) {
//         skuMaps = html.match(/skuMap[\s]+:[\s]+{[\S]+[\s]+,propertyMemoMap/);
//         if (skuMaps) {
//             skuMaps = trim(skuMaps[0]);
//             skuMaps = skuMaps.slice(13, -16);
//             skuMaps = JSON.parse(skuMaps);
//         }
//     }
//     if (/detail.tmall.com/.test(goodPage)) {
//         skuMaps = html.match(/"skuMap":{[\S]+,"salesProp"/);
//         if (skuMaps) {
//             skuMaps = JSON.parse(skuMaps[0].slice(9, -12));
//         }
//     }
//     if (skuMaps) {
//         Object.keys(skuMaps).map(key => {
//             const keyArray = key.split(";");
//             let name = "";
//             keyArray.map(i => {
//                 if (value2label[i]) name += value2label[i] + " ";
//             });
//             skuList.push({
//                 name,
//                 skuId: skuMaps[key].skuId,
//                 stock: skuMaps[key].stock,
//                 price: skuMaps[key].price,
//             });
//         });
//         return skuList;
//     }
//     return [];
// }