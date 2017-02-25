'use strict'

var jsdom = require("jsdom");
var _ = require("lodash");
var request = require('request');
var baseUrl = 'https://someurlhere';
var MAX_DELAY = 150;

// list the pages to scrape
var pages = [
    { category : 'app', themes : ['list', 'of', 'items', 'to', 'scrape'] },
    ...,
];

// request the pages and collect a promise for each of the pages to retrieve
var themePromises = [];
_.each(pages, (category) => {
    themePromises = _.concat(themePromises, _.map(category.themes, (themeName) => { 
                                return getThemeData(themeName, category.category) } ));
})

// wait for all the promises to resolve (i.e. all the page data has been retrieved)
// and print the data
var results = Promise.all(themePromises)
results.then((data)=> { 
    console.log('category results:', JSON.stringify(data))
})

function getThemeData(themeName, category) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            request({ url: baseUrl + themeName + '/', gzip: true}, function (error, response, body) {
                //console.log('got response:',response,body)
              if (!error && response.statusCode == 200) {
                jsdom.env(
                    body, null, null,
                    (err, window) => {
                        // extract the contents of the page using jsdom window object
                        resolve(extractContents(window, category));
                    }
                );
              }
           });
        }, 1000 * Math.random() * MAX_DELAY);
    });
}



function extractContents(window, cat) {
    var doc = window.document;
    var contents = {};
    contents.title = doc.querySelector('title') ? doc.querySelector('title').innerHTML : '';
    contents.category = cat;
    contents.theme_quote = doc.querySelector('#theme_quote') ? doc.querySelector('#theme_quote').innerHTML : '';
    contents.demo_link = doc.querySelector('#view') ? doc.querySelector('#view').href : '';
    contents.imgs = getImgSources(doc.querySelectorAll('.nivoSlider img'));
    contents.colour_imgs = getImgSources(doc.querySelectorAll('#screenshots .fancybox>img'));
    contents.features = getNodeListText(doc.querySelectorAll('#features .feature>h3'));
    return contents;
}

function getImgSources(imgList) {
    return _.chain(imgList)
                .map(function (img) {
                    return img.src.replace('file://','')
                })
                .join()
                .value();
}

function getNodeListText(list) {
    return _.chain(list)
            .map(function(item) {
                return item.innerHTML;
            })
            .join()
            .value();
}
