'use strict';

/**
 * Controller to handle the purchasing of a pre-paid code
 */
angular.module('samplemodule')
    .controller('PrePaidSubscribeCtrl', ['$scope', '$rootScope', '$log', '$state', '$stateParams', 'UserManager', 'PaymentService', 'SubscriptionService', 'AppGridService', 'globals', '$translate', 'commons', 'data',
        function ($scope, $rootScope, $log, $state, $stateParams, UserManager, PaymentService, SubscriptionService, AppGridService, globals, $translate, commons, data) {

            var MOBILE_MAX_WIDTH = 480;
            // used to display error msgs
            $scope.errorMessage = "";
            $scope.isCreatingPrePaidCode = false;

            var errorEnum = {
                CardFraudDetected: 'PROMO_ERROR_CODE_CARD_FRAUD_DETECTED',
                CardExpired: 'PROMO_ERROR_CODE_CARD_EXPIRED',
                InvalidEmail: 'PREPAY_PAYMENT_EMAIL_INVALID',
                TermsNotAccepted: 'PREPAY_TERMS_NOT_ACCEPTED'
            };
            
            // setup priceparam for footer message translation string
            $scope.priceParam = { price: data.price || '' };

            // determine mobileness using screenwidth
            $scope.isSmallScreen = (window.innerWidth <= MOBILE_MAX_WIDTH);

            // prepaid code view model
            $scope.input = {
                email: '',
                voucherIsGift: data.voucherIsGiftDefault,
                acceptsTerms: false,
                emailOptIn: false
            };

            // load the number of gift card terms items
            $scope.giftCardTermsNumber = AppGridService.getConfigSync('cfg_giftCardTermItems');

            /**
             * Gets an array to use with ng-repeat to determine the number of repeats
             * e.g. ng-repeat="i in getRepeatNumber(numItems)"
             * @param num - the number of times to repeat
             * @returns {Array} - an array which can be used to control the number repeats ng-repeat does
             */
            $scope.getRepeatNumber = function(num) {
                return new Array(num);
            };

            /**
             * Checks email validity and terms acceptance before submitting payment details
             * to Braintree
             * @returns {boolean} - whether user has entered the correct data and accepted the t's and c's
             */
            $scope.formIsValid = function() {
                $log.log('input validation running...');
                // validate the email before proceeding
                if (!commons.isValidEmail($scope.input.email)) {
                    $scope.errorMessage = errorEnum.InvalidEmail;
                    $log.log('email validation error: ', $scope.errorMessage);

                    return false;
                }

                // check for acceptance of terms and conditions
                if (!$scope.input.acceptsTerms) {
                    $scope.errorMessage = errorEnum.TermsNotAccepted;
                    $log.log('terms not yet accepted: ', $scope.errorMessage);

                    return false;
                }

                return true;
            };

            /**
             * remove any displaying errors
             */
            function clearErrors() {
                $log.log('clearing errors');
                $scope.errorMessage = "";
            }

            /**
             * Handle the pre paid code checkout process
             * @param nonce - the newly created braintree payment method nonce
             * @param deviceData - the newly created braintree payment method device data
             * @param email - the given email address of the purchaser
             * @param voucherIsGift - whether the purchaser is buying for himself or not
             * @returns {*} - thenable promise
             */
            function handlePurchaseUsingPrePaidCode(nonce, deviceData, email, voucherIsGift, emailOptIn) {

                clearErrors();

                // validate the email before proceeding
                if (!commons.isValidEmail(email)) {
                    $scope.errorMessage = errorEnum.InvalidEmail;
                    $log.log('email validation error: ',$scope.errorMessage);
                    // reload the braintree form
                    $scope.braintreeFormReloadTrigger = new Date().getTime();

                    return;
                }

                $log.log('checking out with pre paid code');

                $scope.isCreatingPrePaidCode = true;

                return PaymentService.purchasePrePaidCode(nonce, deviceData, email, voucherIsGift,
                    data.productFeedVoucherTitle, emailOptIn)
                    .then(function (response) {
                        var code = _.get(response, "oneStepOrderResponse.purchaseItems[0].giftVoucherItems[0].promotionCode");
                        var orderId = _.get(response, "oneStepOrderResponse.purchaseItems[0].providerItemRef");
                        var orderTotal = _.get(response, "oneStepOrderResponse.orderTotal");
                        $log.debug('giftcode purchased: ', code);

                        $state.go('base.main.landing-' + data.campaignName + '.congratulations', {
                            revenue: orderTotal || 1,
                            orderId: orderId,
                            trialLength: 0,
                            email: email
                        }, {reload: true});

                        $scope.isCreatingPrePaidCode = false;
                    })
                    .catch(handleCheckoutErrors);

            }

            /**
             * Deal with any checkout errors
             * @param error
             */
            function handleCheckoutErrors(error) {

                $scope.isCreatingPrePaidCode = false;

                // handle invalid promotion code
                switch(error.message) {
                    case "Braintree request error" :
                        if (_.get(error, "originalErrorObject.message") === "Expired Card") {
                            $scope.errorMessage = errorEnum.CardExpired;
                            break;
                        }
                        if (_.get(error, "originalErrorObject.message") === "Gateway Rejected: fraud") {
                            $scope.errorMessage = errorEnum.CardFraudDetected;
                            break;
                        }
                        // otherwise display a general error
                        $scope.errorMessage = error.message;
                        break;
                    case "Unknown MPX response" :
                        throw error;
                        break;
                    default :
                        // otherwise display a general error
                        $scope.errorMessage = error.message;
                }

                $scope.braintreeFormReloadTrigger = new Date().getTime();

            }

            /**
             * Handle successful creation of payment instrument
             * @param nonce - onetime string returned from Braintree to use in place of card details
             * @param deviceData
             * @returns {*} thenable promise
             */
            $scope.onNonceReceived = function(nonce, deviceData) {

                $log.log('calling promocodesubscribe controller onnoncerecieved');

                return handlePurchaseUsingPrePaidCode(nonce, deviceData, $scope.input.email, $scope.input.voucherIsGift,
                    $scope.input.emailOptIn);

            };


        }]);

