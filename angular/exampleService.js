'use strict';

/* This storage service allows data to be saved to a cloud-based database (currently AWS dynamodb) */
angular.module('example.services.cloudStorageService', [])
    .service('CloudStorageService', ['$http', 'globals', '$log', 'OtherService',
        function ($http, globals, $log, OtherService) {

            // get the save data API endpoint
            var apiEndpoint = OtherService.getConfigSync('cfg_cloudStorageApiEndpoint');
            $log.log('cloud api endpoint:',apiEndpoint);

            /**
             * sends data to the cloud database for storage and analysis
             * @param {object} params - object containing 'type' and any other items to be saved
             */
            function saveData(params) {

                // call AWS gateway endpoint
                $log.log('cloud service sending data:',params)
                var options = { method: 'GET',
                                url: apiEndpoint,
                                params: params }
                $http(options)
                    .then(function (response) {
                        $log.log('cloud service save response:', response.data)
                    })
            }

            /**
             * saves the referral data to AWS dynamo referafriend table
             * @param data - referral data
             */
            function saveReferralData(data) {
                // set the event type
                data.type = "REFERRAL_DATA";
                // call AWS gateway endpoint
                $log.log('cloud service sending referral data:', data);
                // send the data to the unified aws storage endpoint
                saveData(data);
            }

            return {
                saveData: saveData,
                saveReferralData: saveReferralData
            };
        }
    ]);

