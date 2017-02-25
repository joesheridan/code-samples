'use strict';

describe('subscriptions test', function() {

    // setup the mocked services and providers
    function ModuleFactory(userType, currentTime) {
        var scope;
        // return the beforeEach function, populated with the right userinfo
        return { getScope : function() { return scope },
            createModule : function() {
                angular.mock.module('example.subscriptions', function($provide) {
                        
                        $provide.service('$translate', function() {
                            this.instant = function(msg) { return msg }
                        });

                        $provide.service('commons', function() {
                            this.getCurrencySymbol = function() {
                                return '$';
                            }
                            this.getCurrentTimestamp = function() { 
                                //"2016-08-03T13:38:28.000Z" cancel date
                                // before canceldate - 1470009600 1/8/16
                                // after canceldate - 1470355200 5/8/16
                                return currentTime || 1470009600000;
                            }
                        });

                        $provide.provider('$modal', function() {
                            this.$get = function () {}
                        });

                        $provide.service('SubscriptionService', function($q) {
                            this.getPromotionTitle = function() {
                                console.log("subscription service getpromotiontitle called")
                                if (userType === "valid-thirdmedia-user") {

                                    return $q.when({title:"ThirdParty Subscriber Promotion"});
                                }

                                return $q.when({title:"Some Nice Promotion"});
                            }
                            // others...
                        });

                        $provide.decorator('$q', function($delegate, $injector){
                            var d = $delegate.defer();
                            var promisePrototype = Object.getPrototypeOf(d.promise);
                            promisePrototype.handleGeneralErrors = function (params) {};
                            return $delegate;
                        });

                        // others..

                    }
                );

                inject(function($rootScope, $controller) {
                    var subsCtrl;
                    scope = $rootScope.$new();
                    subsCtrl = $controller('SubscriptionsCtrl', {$scope: scope});
                })
            }
        }
    }


    describe('standard web user just cancelled subscription', function(){
        var factory = new ModuleFactory("webuser-cancelled");

        beforeEach(factory.createModule);

        it('should display a cancel scheduled billing message ', inject(function($controller) {
            var scope = factory.getScope();
            scope.$apply();
            console.log('billing message:',scope.billingMessage);
            expect(scope.billingMessage).toMatch(/SUBSCRIPTION_CANCEL_SCHEDULED/);
            expect(scope.displayRenewBtn).toBe(false);
            expect(scope.displayCancelBtn).toBe(false);
        }));

    });

    describe('valid subscription itunes user', function(){
        var factory = new ModuleFactory("ios-user-valid-subscription");

        beforeEach(factory.createModule);

        it('should display a renew subscription message ', inject(function($controller) {
            var scope = factory.getScope();
            scope.$apply();
            console.log('billing message:',scope.billingMessage);
            expect(scope.billingMessage).toMatch(/YOUR_SUBSCRIPTION_ACTIVE_ITUNES/);
            expect(scope.displayRenewBtn).toBe(false);
            expect(scope.displayCancelBtn).toBe(false);
        }));

    });

    // others...
});
