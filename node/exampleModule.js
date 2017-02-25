'use strict';

var _ = require('lodash');
var $q = require('q');
var MpxServiceBase = require('./MPXServiceBase');
var path = require('path');
var MiddlewareException = require(path.resolve('common/MiddlewareException'));

module.exports = function (userId, token) {
    var mpxServiceBase = new MpxServiceBase(userId, token);

    function getPromoCodes () {
        return mpxServiceBase.sendSecureRequest(mpxServiceBase.ServiceEndpoints.Promotion.PromotionCode, { schema: '1.3' }, false, false, true, 2500);
    }

    /**
     * Extract the promotionID from the url
     * @param promoIDStr - e.g. http://promotion.commerce.theplatform.eu/promotion/data/Promotion/67005661
     * @returns {string} - e.g. 67005661
     */
    function extractIDFromUrl(promoIDStr) {
        var regex = new RegExp("/([0-9]+)$", "i");
        var res = promoIDStr.match(regex);

        return res[1];
    }

    /**
     * Get the promotionID from a promotionUseCountID
     * @param useCountID - an MPX ID which can be used to find the use count of a promotion
     * @returns {*} - a promise which resolves to a promotionID
     */
    function getPromotionID(useCountID) {
        return mpxServiceBase.sendSecureRequest(mpxServiceBase.ServiceEndpoints.Promotion.PromotionUseCount,
            { byId: useCountID, schema: '1.3' }, true, false, true, 2500)
            .then(function(results) {
                var promoIDStr = _.get(results, "entries[0].plpromotionusecount$promotionId");
                if (promoIDStr) {
                    var promoID = extractIDFromUrl(promoIDStr);
                    return $q.when(promoID);
                } else {
                    throw new MiddlewareException("Could not extract PromotionID from PromotionUseCount", null,
                        MiddlewareException.CodeMpx);
                }
            });
    }

    /**
     * Get the title of the promotion from the promotionID
     * @param promoID - the promotionID to query
     * @returns {*} - a promise which resolves to a promotion title
     */
    function getPromotionDetails(promoID) {
        return mpxServiceBase.sendSecureRequest(mpxServiceBase.ServiceEndpoints.Promotion.Promotion,
                    { byId: promoID, schema: '1.3' }, false, false, true, 2500)
            .then(function(results) {
                var title = _.get(results, "entries[0].title");
                if (!title) {
                    throw new MiddlewareException("No promotion title found", null, MiddlewareException.CodeMpx);
                }
                return $q.when({ title: title })
            });
    }

    /**
     * Get the promotion title from the promotionUseCountID
     * @param useCountID - required - an MPX ID which can be used to find the use count of a promotion
     * @returns {*} - a promise containing the title { title: "promo title" }
     */
    function getPromoTitle (useCountID) {
        return getPromotionID(useCountID).then(getPromotionDetails);
    }

    return {
        getPromoCodes: getPromoCodes,
        getPromoTitle: getPromoTitle
    };
};
