'use strict';

angular.module('samplemodule.subscriptions', [])
    .controller('SubscriptionsCtrl', ['$scope', '$rootScope', '$q', '$translate', '$filter', '$window', '$modal', 'SubscriptionService', '$log', 'UserManager', 'commons',
        function ($scope, $rootScope, $q, $translate, $filter, $window, $modal, SubscriptionService, $log, UserManager, Commons) {

            // constants
            var PROMO_CAMPAIGN = 'PROMO_CAMPAIGN';
            var FREE_TRIAL = 'FREE_TRIAL';
            var IN_PROMOTION = 'IN_PROMOTION';
            var SPACE = ' ';

            // scope variables
            $scope.isLoading = true;
            $scope.thirdPartyPayment = '';
            $scope.subscriptionCancelled = false;
            $scope.subscriptionEnded = false;
            $scope.displayRenewBtn = false;
            $scope.displayCancelBtn = false;
            $scope.displayiTunesRenewalBtn = false;
            $scope.displayGPlayRenewalBtn = false;
            $scope.billingMessage = '';

            /**
             * generate the overall billing message depending on the state of the user's subscription
             * @param contracts
             * @param invoices
             * @returns {Promise} a promise which resolves the billing message
             */
            $scope.generateBillingMessage = function(contracts, invoices, currentUser) {

                var activeContract = getActiveContract(contracts)

                // check if user cancelled
                if ($scope.subscriptionCancelled) {
                    return $q.when(handleCancellationPending(activeContract));
                }

                // check free trial period
                if (checkActiveTrial(activeContract)) {
                    return $q.when(handleFreeTrial(activeContract));
                }

                // handle active promotion
                if (getActivePaymentMethod(contracts, currentUser) === IN_PROMOTION) {
                    return handleContractInPromotion(contracts);
                }

                // check for Example subscription
                if (getActivePaymentMethod(contracts, currentUser) === FOXTEL) {
                    return $q.when(handleExample());
                }

                // handle no valid subscriptions
                if (contracts.length === 0) {
                    return handleNoValidSubscriptions(invoices);
                }

                // check for active subscription
                if (contracts.length && !$scope.subscriptionCancelled) {
                    return $q.when(handleActiveSubscription(activeContract, $scope.activePaymentMethod));
                }

            };

            /**
             * work out the current promotion end date from the billing schedule
             * @param activeContract
             * @returns {string} the promotion end date
             */
            function getPromotionEndDate(activeContract) {
                // find the current promotion in the billing schedule
                var promoScheduleItem = _.find(activeContract.plcontract$billingSchedule, function(schedule) {
                    return (!schedule.plcontract$isFreeTrial && schedule.plcontract$amountBeforePromotion);
                });

                return (promoScheduleItem) ? promoScheduleItem.plcontract$endDate : '-';
            }

            /**
             * find the active contract from the contracts list
             * @param contracts
             */
            function getActiveContract(contracts) {
                return _.find(contracts, function(contract) {
                    return (contract.plcontract$active);
                });
            }

            /**
             * determine whether the active contract is under active promotion
             * @param activeContract
             * @returns {boolean} true if active contract is in promotion
             */
            function checkActivePromotion(activeContract) {
                // if inPromotion flag is set, we are definitely in a promotion period
                return (_.get(activeContract, "plcontract$activitySummary.plcontract$inPromotion") === true);
            }

            /**
             * determine whether the active contract is currently in a free trial
             * @param activeContract
             * @returns {boolean} true if active contract is in free trial period
             */
            function checkActiveTrial(activeContract) {
                if (activeContract && activeContract.plcontract$billingSchedule) {
                    var freeTrialPeriod = _.find(activeContract.plcontract$billingSchedule, function(item) {
                        return item.plcontract$isFreeTrial;
                    });

                    if (freeTrialPeriod) {
                        // work out whether the current time is between the free trial start and end dates
                        var now = Commons.getCurrentTimestamp();
                        if (freeTrialPeriod.plcontract$startDate <= now &&
                            freeTrialPeriod.plcontract$endDate > now) {
                            return true;
                        }
                    }
                }

                return false;
            }

            /**
             * Gets whether active payment method is a third party e.g. 'sample'
             * @param activePaymentMethod
             * @returns {*}
             */
            function getThirdPartyPaymentMethod(activePaymentMethod) {
                if (activePaymentMethod === EXAMPLE) {
                    return EXAMPLE;
                }
            }

            /**
             * Gets the user's last active contract date (if any)
             * @returns {Promise} a promise which resolves to the last contract end date
             */
            function checkLastContractDate() {
                var currentUser = UserManager.getUser();
                var expiredSubscription = _.get(currentUser, "account.subscriptionState.hasExpiredSubscription");
                if (expiredSubscription) {
                    return SubscriptionService.getLastContractDate()
                        .then(function(enddate) {
                            $log.log('got last contract end date:', enddate)
                            return enddate;
                        });
                }
                // if no need for last contract end date, just return empty promise
                return $q.when();
            }

            
        }]);
