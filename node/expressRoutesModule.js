var express = require('express');
var router = express.Router();
var elegantDataPrepped = require('../elegantDataPrepped')
var _ = require('lodash');

// convert theme title to url slug
function getSlug(title) {
    return title.toLowerCase().replace(/ /g, '-');
}

// build page link
function getLink(theme) {
    if (!theme || !theme.title || !theme.category) {
        return null;
    }
    return '/' + theme.category + '/' + getSlug(theme.title);
}

// decorate theme with extra info
function prepTheme(theme, suggestions) {
    if (!theme) return {};
    theme.featuresArr = (theme.features || "").split(',');
    theme.imgsArr = (theme.imgs || "").split(',');
    theme.colourImgsArr = (theme.colour_imgs || "").replace(/thumb/g, 'zoom').split(',');
    theme.link = getLink(theme);
    return theme;
}

function getCategoryList(data) {
    var cats =_.chain(data)
                .pluck('category')
                .unique()
                .value()
    return cats;
}

function addCategoryRoutes(categoryList, themesData, router) {
    _.each(categoryList, function(category) {

        console.log('added category route:', category)
        router.get('/' + category, function(req, res) {
            // get all themes in this category
            var catThemes = _.chain(themesData)
                                .filter(theme => (theme.category === category))
                                .map(theme => prepTheme(theme) )
                                .value();

            res.render('elegant/categoryPage', { category : category, themes: catThemes, categoryList: categoryList });
            
        });
    })
}

function getSuggestion(themeName, inputData) {
    var suggested = _.find(inputData, item => { //console.log(themeName,item.title.toLowerCase());
                                                return item.title.toLowerCase().indexOf(themeName) !== -1 } );
    return _.cloneDeep(suggested)
}

function getSimilarSuggestions(category, themeTitle, inputData) {
    return _.chain(inputData)
            .filter((item) => (item.category === category && item.title !== themeTitle && !/divi|extra|vertex/i.test(item.category)))
            .shuffle()
            .take(3)
            .map((suggestedTheme) => prepTheme(_.cloneDeep(suggestedTheme)))
            .value();
}

function getPopularSuggestions(inputData) {
    // extract popular suggestion data
    var divi = prepTheme(getSuggestion('divi', inputData));
    var extra = prepTheme(getSuggestion('extra', inputData));
    var vertex = prepTheme(getSuggestion('vertex', inputData));
    return [divi, extra, vertex];
}

function getSidebarSuggestions(inputData) {
    return getPopularSuggestions(inputData);
}

function addThemeRoutes(categoryList, themesData, router) {

        var popular = getPopularSuggestions(elegantDataPrepped);
        var sidebar = getSidebarSuggestions(elegantDataPrepped);
    _.each(themesData, function(theme) {

    // generate similar, popular and sidebar theme lists
        theme.similarSuggestions = getSimilarSuggestions(theme.category, theme.title, elegantDataPrepped);
        theme.popularSuggestions = popular;
        theme.sidebarSuggestions = sidebar;
        console.log('adding :',theme.link)
        router.get(theme.link, function(req, res) {

            //console.log(theme.categorySuggestions)
            res.render('elegant/themePage', { themeData : theme, categoryList: categoryList });
            
        });
    })
}

// finds a theme for the given category and extracts the first image it finds
function getImgForCategory(cat, data) {
    var firstTheme = _.find(data, theme => theme.category === cat && !/divi|extra/i.test(theme.title));
    firstTheme = prepTheme(firstTheme);
    //console.log('found theme:',cat, firstTheme)
    return firstTheme.imgs[0];
}

function addHomepageRoute(categoryList, elegantData, router) {

    var decoratedList = _.map(categoryList, category => ({ name: category, img: getImgForCategory(category, elegantData)}));

    //console.log('decoratedList', decoratedList)
    router.get('/', function(req, res) {
        // get all themes in this category

        res.render('homepage', { decoratedList: decoratedList, categoryList: categoryList });
        
    });
    
}

module.exports = function() {

    // extract popular suggestion data
    var divi = prepTheme(_.find(elegantDataPrepped, (item) => ( /divi/i.test(item.title) )));
    var extra = prepTheme(_.find(elegantDataPrepped, (item) => ( /extra/i.test(item.title) )));
    var vertex = prepTheme(_.find(elegantDataPrepped, (item) => ( /vertex/i.test(item.title) )));

    var mainThemes = [divi, extra, vertex];

    // get cats
    var categoryList = getCategoryList(elegantDataPrepped);

    // add category routes
    addCategoryRoutes(categoryList, elegantDataPrepped, router);

    // add theme routes
    addThemeRoutes(categoryList, elegantDataPrepped, router);

    // add homepage route
    addHomepageRoute(categoryList, elegantDataPrepped, router);

    return router;
}



