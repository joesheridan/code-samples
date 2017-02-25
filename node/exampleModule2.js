'use strict'

var common = require('./common')
var _ = require('lodash')

function runPriceCommand(commandLine, plans) {
    var annualConsumption = common.getCommandArg(commandLine, 1)

    // calculate the cost of each plan
    var planData = _.map(plans, function(plan) {
        return { supplier: plan.supplier, plan: plan.plan, price: getPlanPrice(plan, annualConsumption) }
    })

    // sort the plans by price
    var sorted = _.sortBy(planData, function(p) { return p.price });

    // print the plans
    _.each(sorted, function(plan) {
        common.printOutput(plan.supplier + ',' + plan.plan + ',' + plan.price)
    })
}

function getPlanPrice(plan, annualConsumption) {
    var cost = 0
    var consumptionRemaining = annualConsumption

    // calculate the portion of cost for each rate band
    _.each(plan.rates, function(rate) {

        // if we've used all the consumption, return early
        if (!consumptionRemaining) {
            return
        }
        if (rate.threshold) {
            if (rate.threshold > consumptionRemaining) {
                cost += rate.price * consumptionRemaining
                consumptionRemaining = 0
            } else {
                cost += rate.price * rate.threshold
                consumptionRemaining -= rate.threshold
            }

        } else {
            cost += rate.price * consumptionRemaining
        }
    })

    // add the standing charge
    cost += common.getStandingCharge(plan.standing_charge)

    // convert to pounds from pence
    cost = cost / 100

    // add VAT and round to 2 decimal places
    return (common.addVAT(cost).toFixed(2))/1
}

module.exports = {
    runPriceCommand: runPriceCommand
}
